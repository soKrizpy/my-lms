// app/api/student/lesson-complete/route.ts
// POST — called when a student finishes all nodes in the lesson player.
// Awards exp_reward (→ topic_progress) and coins_reward (→ students.coins).
// Idempotent: re-completing the same topic never reduces coins/XP.

import { NextRequest } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const sup = await createClient();
  const { data: { user } } = await sup.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    topicId: number;
    expReward?: number;
    coinsReward?: number;
  };

  const { topicId, expReward = 0, coinsReward = 0 } = body;
  if (!topicId) return Response.json({ error: 'topicId required' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const studentId = user.id;

  // 1. Upsert topic_progress — preserve best_quiz_score if row already exists
  const { data: existing } = await admin
    .from('topic_progress')
    .select('xp_earned, best_quiz_score')
    .eq('student_id', studentId)
    .eq('topic_id', topicId)
    .maybeSingle();

  const newXp = Math.max(existing?.xp_earned ?? 0, expReward);
  await admin.from('topic_progress').upsert(
    {
      student_id: studentId,
      topic_id: topicId,
      xp_earned: newXp,
      best_quiz_score: existing?.best_quiz_score ?? 0,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,topic_id' }
  );

  // 2. Award coins only on first completion
  let coinsAwarded = 0;
  if (!existing && coinsReward > 0) {
    const { data: stu } = await admin
      .from('students')
      .select('coins')
      .eq('id', studentId)
      .maybeSingle();
    const newCoins = (stu?.coins ?? 0) + coinsReward;
    await admin.from('students').update({ coins: newCoins }).eq('id', studentId);
    coinsAwarded = coinsReward;
  }

  return Response.json({ ok: true, xpAwarded: newXp, coinsAwarded });
}
