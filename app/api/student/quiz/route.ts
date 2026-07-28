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

  // Calculate score
  let correct = 0;
  for (const q of questions) {
    const studentAnswer = answers[q.id];
    if (studentAnswer === q.correct_option) correct++;
  }

  const score = Math.round((correct / questions.length) * 100);

  // Save attempt
  const { error: attemptError } = await supabaseAdmin
    .from("quiz_attempts")
    .upsert({
      student_id: user.id,
      quiz_id: quizId,
      score,
      total_questions: questions.length,
    }, { onConflict: "student_id,quiz_id" });

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  return NextResponse.json({ score, total: questions.length, correct });
}

// GET /api/student/quiz?quizId=xxx - get quiz questions
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
  const { data: questions, error } = await supabaseAdmin
    .from("quiz_questions")
    .select("id, question_text, option_a, option_b, option_c, option_d")
    .eq("quiz_id", quizId)
    .order("id", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(questions || []);
}
