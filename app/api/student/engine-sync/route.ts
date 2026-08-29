// app/api/student/engine-sync/route.ts
// Receives postMessage events from lesson engine and persists to Supabase.
// POST /api/student/engine-sync

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    type: 'LESSON_COMPLETE' | 'QUIZ_SUBMITTED';
    topicId: string;
    studentId: string | null;
    payload: Record<string, unknown>;
  };

  const admin = getSupabaseAdmin();
  const studentId = user.id; // Always use authenticated session — never trust payload studentId

  if (body.type === 'LESSON_COMPLETE') {
    const xpEarned = typeof body.payload.xpEarned === 'number' ? body.payload.xpEarned : 0;
    const bestQuizScore = typeof body.payload.bestQuizScore === 'number' ? body.payload.bestQuizScore : 0;
    const { data: topic } = await admin.from('topics').select('id').eq('engine_topic_id', body.topicId).maybeSingle();
    if (!topic) return NextResponse.json({ ok: true, note: 'engine_topic_id not linked' });
    await admin.from('topic_progress').upsert(
      { student_id: studentId, topic_id: topic.id, engine_topic_id: body.topicId,
        xp_earned: xpEarned, best_quiz_score: bestQuizScore, completed_at: new Date().toISOString() },
      { onConflict: 'student_id,topic_id' }
    );
    return NextResponse.json({ ok: true });
  }

  if (body.type === 'QUIZ_SUBMITTED') {
    const score = typeof body.payload.score === 'number' ? body.payload.score : 0;
    const attemptNumber = typeof body.payload.attemptNumber === 'number' ? body.payload.attemptNumber : 1;
    const bestScore = typeof body.payload.bestScore === 'number' ? body.payload.bestScore : score;

    // Read totalQuestions from payload when available and valid.
    // Fall back to 5 for backward compatibility when the field is absent or malformed.
    const rawTotal = body.payload.totalQuestions;
    const totalQuestions =
      typeof rawTotal === 'number' && Number.isInteger(rawTotal) && rawTotal >= 1 && rawTotal <= 100
        ? rawTotal
        : 5;

    const { data: topic } = await admin.from('topics').select('id, quizzes(id)').eq('engine_topic_id', body.topicId).maybeSingle();
    const quizId = (topic?.quizzes as {id:number}[]|null)?.[0]?.id;
    if (!quizId) return NextResponse.json({ ok: true, note: 'no quiz linked' });
    await admin.from('quiz_attempts').upsert(
      { student_id: studentId, quiz_id: quizId, score: bestScore,
        total_questions: totalQuestions, attempts_count: attemptNumber, engine_sourced: true },
      { onConflict: 'student_id,quiz_id' }
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
}
