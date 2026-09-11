// POST /api/admin/students/[id]/quiz-score
// Emergency manual score entry for a student's quiz attempt.
// Body: { quiz_id: number, score: number, total_questions: number }

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;
    const supabase = auth.adminClient;
    const { id: studentId } = await params;

    const body = await request.json();
    const { quiz_id, score, total_questions } = body;

    if (!quiz_id || score === undefined || !total_questions) {
      return NextResponse.json(
        { error: "quiz_id, score, total_questions wajib diisi." },
        { status: 400 }
      );
    }

    // Check for an existing attempt
    const { data: existing } = await supabase
      .from("quiz_attempts")
      .select("id, score, attempts_count")
      .eq("student_id", studentId)
      .eq("quiz_id", quiz_id)
      .maybeSingle();

    const newScore = existing ? Math.max(existing.score, score) : score;
    const newCount = (existing?.attempts_count || 0) + 1;

    const { error } = await supabase
      .from("quiz_attempts")
      .upsert(
        {
          student_id: studentId,
          quiz_id,
          score: newScore,
          total_questions,
          attempts_count: Math.min(newCount, 2),
        },
        { onConflict: "student_id,quiz_id" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, score: newScore });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
