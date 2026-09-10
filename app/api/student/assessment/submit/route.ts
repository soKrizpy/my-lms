import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import {
  getAssessmentAttempts,
  getAssessmentQuestions,
  type AssessmentSubmitResult,
} from "../../../../../lib/lmsData";
import { resolveModuleCompletionMap } from "../../../../../lib/moduleCompletion";
import {
  computeScore,
  computeBestScore,
  buildQuestionResults,
} from "../../../../../lib/assessmentScoring";
import { evaluateBadges } from '../../../../../lib/gamification/badgeEvaluator';
import type { BadgeDefinition } from '../../../../../lib/gamification/badgeCatalog';

// POST /api/student/assessment/submit
// Body: { assessmentId: number, answers: Record<string, 'A'|'B'|'C'|'D'> }
export async function POST(request: Request) {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentId = user.id;

  // 2. Parse and validate request body
  let body: { assessmentId?: unknown; answers?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { assessmentId: rawAssessmentId, answers: rawAnswers } = body;

  if (rawAssessmentId === undefined || rawAssessmentId === null) {
    return NextResponse.json({ error: "Missing assessmentId." }, { status: 400 });
  }

  if (rawAnswers === undefined || rawAnswers === null || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) {
    return NextResponse.json({ error: "Missing or invalid answers." }, { status: 400 });
  }

  const assessmentId = Number(rawAssessmentId);
  if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
    return NextResponse.json({ error: "Invalid assessmentId." }, { status: 400 });
  }

  const answers = rawAnswers as Record<string, string>;

  const supabaseAdmin = getSupabaseAdmin();

  // 3. Fetch assessment record
  const { data: assessment, error: assessmentError } = await supabaseAdmin
    .from("module_assessments")
    .select("id, module_id, title, created_at")
    .eq("id", assessmentId)
    .maybeSingle();

  if (assessmentError) {
    console.error("POST /api/student/assessment/submit: error fetching assessment", assessmentError);
    return NextResponse.json({ error: "Gagal memuat assessment." }, { status: 500 });
  }

  if (!assessment) {
    return NextResponse.json({ error: "Assessment tidak ditemukan." }, { status: 404 });
  }

  const moduleId: number = assessment.module_id;

  // 4. Verify student enrollment
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from("student_modules")
    .select("student_id")
    .eq("student_id", studentId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (enrollmentError) {
    console.error("POST /api/student/assessment/submit: error checking enrollment", enrollmentError);
    return NextResponse.json({ error: "Gagal memverifikasi enrollment." }, { status: 500 });
  }

  if (!enrollment) {
    return NextResponse.json({ error: "Kamu tidak terdaftar di modul ini." }, { status: 403 });
  }

  // 5. Verify module completion
  const completionMap = await resolveModuleCompletionMap(studentId, [moduleId]);
  const completionResult = completionMap.get(moduleId);

  if (!completionResult?.isComplete) {
    return NextResponse.json(
      { error: "Selesaikan semua topik terlebih dahulu." },
      { status: 403 }
    );
  }

  // 6. Fetch existing attempts; reject if already at 2
  const { data: existingAttempts, error: attemptsError } = await getAssessmentAttempts(studentId, assessmentId);

  if (attemptsError) {
    console.error("POST /api/student/assessment/submit: error fetching attempts", attemptsError);
    return NextResponse.json({ error: "Gagal memeriksa riwayat percobaan." }, { status: 500 });
  }

  const attemptList = existingAttempts ?? [];

  if (attemptList.length >= 2) {
    return NextResponse.json({ error: "Batas percobaan tercapai." }, { status: 400 });
  }

  // 7. Fetch questions with correct_option
  const { data: questions, error: questionsError } = await getAssessmentQuestions(assessmentId);

  if (questionsError) {
    console.error("POST /api/student/assessment/submit: error fetching questions", questionsError);
    return NextResponse.json({ error: "Gagal memuat soal." }, { status: 500 });
  }

  const questionList = questions ?? [];

  if (questionList.length === 0) {
    return NextResponse.json({ error: "Assessment tidak memiliki soal." }, { status: 400 });
  }

  // 8. Validate that all question IDs are answered
  const missingQuestionIds = questionList
    .filter((q) => !(String(q.id) in answers))
    .map((q) => q.id);

  if (missingQuestionIds.length > 0) {
    return NextResponse.json(
      { error: `Semua soal harus dijawab. Soal belum dijawab: ${missingQuestionIds.join(", ")}` },
      { status: 400 }
    );
  }

  // 9. Compute score
  const totalQuestions = questionList.length;
  let correctCount = 0;
  for (const q of questionList) {
    if (answers[String(q.id)] === q.correct_option) {
      correctCount++;
    }
  }

  const score = computeScore(correctCount, totalQuestions);

  // 10. Compute attempt_number
  const attemptNumber = (attemptList.length + 1) as 1 | 2;

  // 11. Compute best_score
  const existingBest =
    attemptList.length > 0
      ? Math.max(...attemptList.map((a) => a.score as number))
      : 0;
  const bestScore = computeBestScore(existingBest, score);

  // 12. Insert attempt record
  const { error: insertError } = await supabaseAdmin
    .from("module_assessment_attempts")
    .insert({
      student_id: studentId,
      assessment_id: assessmentId,
      attempt_number: attemptNumber,
      score,
      best_score: bestScore,
      total_questions: totalQuestions,
      correct_count: correctCount,
      answers,
      submitted_at: new Date().toISOString(),
    });

  if (insertError) {
    console.error("POST /api/student/assessment/submit: error inserting attempt", insertError);
    // Return 500 with all computed data so the client can retry without re-answering
    return NextResponse.json(
      { error: insertError.message, score, best_score: bestScore, answers },
      { status: 500 }
    );
  }

  // 12b. Evaluate badges after successful attempt insert
  let newBadges: BadgeDefinition[] = [];
  try { newBadges = await evaluateBadges(studentId); } catch { newBadges = []; }

  // 13. Build per-question results
  const questionResults = buildQuestionResults(answers as Record<string, 'A' | 'B' | 'C' | 'D'>, questionList);

  // 14. Return AssessmentSubmitResult
  const result: AssessmentSubmitResult = {
    score,
    best_score: bestScore,
    attempt_number: attemptNumber,
    total_questions: totalQuestions,
    correct_count: correctCount,
    question_results: questionResults,
  };

  return NextResponse.json({ ...result, newBadges }, { status: 200 });
}
