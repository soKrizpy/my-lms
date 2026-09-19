import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

// POST /api/student/quiz - submit quiz answers
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { quizId, answers } = body; // answers: { questionId: "A" | "B" | "C" | "D" }[]

  if (!quizId || !answers) {
    return NextResponse.json({ error: "Missing quizId or answers" }, { status: 400 });
  }

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
  const quizId = searchParams.get("quizId");

  if (!quizId) return NextResponse.json({ error: "Missing quizId" }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();

  // Fetch quiz metadata with topic and module title
  const { data: quizData } = await supabaseAdmin
    .from("quizzes")
    .select("id, title, topic_id, topics(title, engine_topic_id, modules(title))")
    .eq("id", quizId)
    .maybeSingle();

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
    quiz: quizData ? {
      id: quizData.id,
      title: quizData.title,
      topicTitle: (quizData as any).topics?.title ?? "Topik Quiz",
      moduleTitle: (quizData as any).topics?.modules?.title ?? "Modul",
      engineTopicId: (quizData as any).topics?.engine_topic_id ?? null,
    } : null,
    attempt: existingAttempt ? {
      attemptsCount: existingAttempt.attempts_count ?? 1,
      score: existingAttempt.score ?? 0,
    } : { attemptsCount: 0, score: 0 },
    questions: questions || [],
  });
}
