// app/api/student/engine-sync/route.ts
// Receives postMessage events from lesson engine and persists to Supabase.
// POST /api/student/engine-sync
//
// UNIFIED SCORE RULE (Rule #4):
// Both topic_progress AND quiz_attempts are always kept in sync so that
// every component (Learning Path, Parent Hub meeting cards, badges) reads
// from the same source of truth regardless of how the score was entered.
//
//  LESSON_COMPLETE  → writes topic_progress  AND upserts quiz_attempts
//  QUIZ_SUBMITTED   → writes quiz_attempts   AND updates topic_progress.best_quiz_score
//  In both cases getOrCreateQuiz ensures a quizzes row always exists first.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getOrCreateQuiz } from '../../../../lib/lmsData';
import { evaluateBadges } from '../../../../lib/gamification/badgeEvaluator';
import type { BadgeDefinition } from '../../../../lib/gamification/badgeCatalog';

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

  // ── LESSON_COMPLETE ────────────────────────────────────────────────────────
  if (body.type === 'LESSON_COMPLETE') {
    const xpEarned = typeof body.payload.xpEarned === 'number' ? body.payload.xpEarned : 0;
    const bestQuizScore = typeof body.payload.bestQuizScore === 'number' ? body.payload.bestQuizScore : 0;

    // Resolve engine_topic_id → topics.id
    const { data: topic } = await admin
      .from('topics')
      .select('id, title')
      .eq('engine_topic_id', body.topicId)
      .maybeSingle();

    if (!topic) return NextResponse.json({ ok: true, note: 'engine_topic_id not linked' });

    // 1. Write topic_progress (XP + quiz score from engine)
    await admin.from('topic_progress').upsert(
      {
        student_id: studentId,
        topic_id: topic.id,
        engine_topic_id: body.topicId,
        xp_earned: xpEarned,
        best_quiz_score: bestQuizScore,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,topic_id' }
    );

    // 2. Ensure a quiz row exists for this topic, then mirror the score into
    //    quiz_attempts so the Learning Path + Parent Hub meeting cards both see it.
    if (bestQuizScore > 0) {
      const { data: quiz } = await getOrCreateQuiz(topic.id, `Quiz — ${topic.title ?? body.topicId}`);
      if (quiz) {
        // Fetch current attempt to keep the highest score across both systems
        const { data: existing } = await admin
          .from('quiz_attempts')
          .select('score, attempts_count')
          .eq('student_id', studentId)
          .eq('quiz_id', quiz.id)
          .maybeSingle();

        const currentBest = existing?.score ?? 0;
        const mergedBest = Math.max(currentBest, bestQuizScore);
        const attemptsCount = existing?.attempts_count ?? 1;

        await admin.from('quiz_attempts').upsert(
          {
            student_id: studentId,
            quiz_id: quiz.id,
            score: mergedBest,
            total_questions: 5, // engine lessons have 5 questions
            attempts_count: attemptsCount,
            engine_sourced: true,
          },
          { onConflict: 'student_id,quiz_id' }
        );
      }
    }

    let newBadges: BadgeDefinition[] = [];
    try { newBadges = await evaluateBadges(studentId); } catch { newBadges = []; }
    return NextResponse.json({ ok: true, newBadges });
  }

  // ── QUIZ_SUBMITTED ─────────────────────────────────────────────────────────
  if (body.type === 'QUIZ_SUBMITTED') {
    const score = typeof body.payload.score === 'number' ? body.payload.score : 0;
    const attemptNumber = typeof body.payload.attemptNumber === 'number' ? body.payload.attemptNumber : 1;
    const bestScore = typeof body.payload.bestScore === 'number' ? body.payload.bestScore : score;

    const rawTotal = body.payload.totalQuestions;
    const totalQuestions =
      typeof rawTotal === 'number' && Number.isInteger(rawTotal) && rawTotal >= 1 && rawTotal <= 100
        ? rawTotal
        : 5;

    // Resolve engine_topic_id → topics.id + title
    const { data: topic } = await admin
      .from('topics')
      .select('id, title')
      .eq('engine_topic_id', body.topicId)
      .maybeSingle();

    if (!topic) return NextResponse.json({ ok: true, note: 'engine_topic_id not linked' });

    // 1. Ensure quiz row exists (getOrCreateQuiz — never silently drop)
    const { data: quiz } = await getOrCreateQuiz(topic.id, `Quiz — ${topic.title ?? body.topicId}`);
    if (!quiz) return NextResponse.json({ ok: true, note: 'could not create quiz row' });

    // 2. Write quiz_attempts
    await admin.from('quiz_attempts').upsert(
      {
        student_id: studentId,
        quiz_id: quiz.id,
        score: bestScore,
        total_questions: totalQuestions,
        attempts_count: attemptNumber,
        engine_sourced: true,
      },
      { onConflict: 'student_id,quiz_id' }
    );

    // 3. Mirror into topic_progress so parent hub meeting cards + engine progress
    //    both show the same score. Only update if we have a better score.
    const { data: existingProgress } = await admin
      .from('topic_progress')
      .select('best_quiz_score, xp_earned')
      .eq('student_id', studentId)
      .eq('topic_id', topic.id)
      .maybeSingle();

    const currentBest = existingProgress?.best_quiz_score ?? 0;
    if (bestScore > currentBest) {
      await admin.from('topic_progress').upsert(
        {
          student_id: studentId,
          topic_id: topic.id,
          engine_topic_id: body.topicId,
          xp_earned: existingProgress?.xp_earned ?? 0,
          best_quiz_score: bestScore,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,topic_id' }
      );
    }

    let newBadges: BadgeDefinition[] = [];
    try { newBadges = await evaluateBadges(studentId); } catch { newBadges = []; }
    return NextResponse.json({ ok: true, newBadges });
  }

  return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
}
