import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { resolveTopicUnlockMap } from "../../../../lib/topicUnlock";

type QuizAccess = {
  id: number;
  title: string;
  topic_id: number;
  topics: {
    title: string;
    engine_topic_id: string | null;
    module_id: number;
    status: "draft" | "published";
    modules: { title: string } | null;
  } | null;
};

/**
 * A quiz ID is untrusted input. Verify the complete student-facing path before
 * exposing questions or accepting an attempt, rather than relying on the
 * dashboard to hide inaccessible quizzes.
 */
async function getAccessibleQuiz(studentId: string, quizId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("quizzes")
    .select("id, title, topic_id, topics!inner(title, engine_topic_id, module_id, status, modules(title))")
    .eq("id", quizId)
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  }

  const quiz = data as QuizAccess | null;
  if (!quiz || !quiz.topics || quiz.topics.status !== "published") {
    return { error: NextResponse.json({ error: "Quiz tidak ditemukan." }, { status: 404 }) };
  }

  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from("student_modules")
    .select("student_id")
    .eq("student_id", studentId)
    .eq("module_id", quiz.topics.module_id)
    .eq("status", "active")
    .maybeSingle();

  if (enrollmentError) {
    return { error: NextResponse.json({ error: enrollmentError.message }, { status: 500 }) };
  }
  if (!enrollment) {
    return { error: NextResponse.json({ error: "Kamu tidak dapat mengakses quiz ini." }, { status: 403 }) };
  }

  const unlockMap = await resolveTopicUnlockMap(studentId, [quiz.topics.module_id]);
  if (!unlockMap.get(quiz.topic_id)?.isUnlocked) {
    return { error: NextResponse.json({ error: "Topik quiz ini belum terbuka." }, { status: 403 }) };
  }

  return { quiz };
}

// POST /api/student/quiz - submit quiz answers
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { quizId: rawQuizId, answers } = body; // answers: { questionId: "A" | "B" | "C" | "D" }
  const quizId = Number(rawQuizId);

  if (!Number.isInteger(quizId) || quizId <= 0 || !answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "Missing quizId or answers" }, { status: 400 });
  }

  const access = await getAccessibleQuiz(user.id, quizId);
  if ("error" in access) return access.error;

  const supabaseAdmin = getSupabaseAdmin();

  // Get quiz questions
  const { data: questions } = await supabaseAdmin
    .from("quiz_questions")
    .select("id, correct_option")
    .eq("quiz_id", quizId);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Quiz tidak ditemukan." }, { status: 404 });
  }

  // Check existing attempt
  const { data: existingAttempt } = await supabaseAdmin
    .from("quiz_attempts")
    .select("id, score, attempts_count")
    .eq("student_id", user.id)
    .eq("quiz_id", quizId)
    .single();

  if (existingAttempt && existingAttempt.attempts_count >= 2) {
    return NextResponse.json({ error: "Kamu sudah mencapai batas maksimal 2 kali percobaan." }, { status: 400 });
  }

  // Calculate score
  let correct = 0;
  for (const q of questions) {
    const studentAnswer = answers[q.id];
    if (studentAnswer === q.correct_option) correct++;
  }

  const score = Math.round((correct / questions.length) * 100);
  const bestScore = existingAttempt ? Math.max(existingAttempt.score, score) : score;
  const newAttemptsCount = (existingAttempt?.attempts_count || 0) + 1;

  // Save attempt (upsert)
  const { error: attemptError } = await supabaseAdmin
    .from("quiz_attempts")
    .upsert({
      student_id: user.id,
      quiz_id: quizId,
      score: bestScore,
      total_questions: questions.length,
      attempts_count: newAttemptsCount
    }, { onConflict: "student_id,quiz_id" });

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  // Return correct answers for the student to review
  const correctAnswers = questions.reduce((acc: any, q: any) => {
    acc[q.id] = q.correct_option;
    return acc;
  }, {});

  return NextResponse.json({ score, bestScore, total: questions.length, correct, correctAnswers, attemptsCount: newAttemptsCount });
}

// GET /api/student/quiz?quizId=xxx - get quiz questions & metadata
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const quizId = Number(searchParams.get("quizId"));

  if (!Number.isInteger(quizId) || quizId <= 0) {
    return NextResponse.json({ error: "Missing or invalid quizId" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const access = await getAccessibleQuiz(user.id, quizId);
  if ("error" in access) return access.error;
  const quizData = access.quiz;

  // Fetch attempt history for student
  const { data: existingAttempt } = await supabaseAdmin
    .from("quiz_attempts")
    .select("score, attempts_count")
    .eq("student_id", user.id)
    .eq("quiz_id", quizId)
    .maybeSingle();

  // Fetch questions
  const { data: questions, error } = await supabaseAdmin
    .from("quiz_questions")
    .select("id, question_text, option_a, option_b, option_c, option_d")
    .eq("quiz_id", quizId)
    .order("id", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    quiz: {
      id: quizData.id,
      title: quizData.title,
      topicTitle: quizData.topics?.title ?? "Topik Quiz",
      moduleTitle: quizData.topics?.modules?.title ?? "Modul",
      engineTopicId: quizData.topics?.engine_topic_id ?? null,
    },
    attempt: existingAttempt ? {
      attemptsCount: existingAttempt.attempts_count ?? 1,
      score: existingAttempt.score ?? 0,
    } : { attemptsCount: 0, score: 0 },
    questions: questions || [],
  });
}
