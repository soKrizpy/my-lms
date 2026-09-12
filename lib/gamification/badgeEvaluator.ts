// lib/gamification/badgeEvaluator.ts
// Server-side badge evaluation and persistence.
// Checks all 7 badge conditions for a student, inserts newly earned badges,
// and returns the BadgeDefinition[] of newly awarded badges.

import { getSupabaseAdmin } from '../supabaseAdmin';
import { BADGE_CATALOG, type BadgeDefinition } from './badgeCatalog';
import { resolveModuleCompletionMap } from '../moduleCompletion';

/**
 * Evaluates all 7 badge conditions for a student.
 * Inserts newly earned badges into student_badges (ignoring duplicates via upsert).
 * Returns the array of newly-earned BadgeDefinition objects.
 * On any DB error, logs and returns [] to avoid blocking the caller.
 */
export async function evaluateBadges(studentId: string): Promise<BadgeDefinition[]> {
  try {
    const admin = getSupabaseAdmin();

    // 1. Already earned badges → Set<string>
    const { data: earnedRows } = await admin
      .from('student_badges')
      .select('badge_id')
      .eq('student_id', studentId);
    const alreadyEarned = new Set((earnedRows ?? []).map((r) => r.badge_id as string));

    // 2. Completed topics count
    const { data: topicRows } = await admin
      .from('topic_progress')
      .select('topic_id')
      .eq('student_id', studentId)
      .not('completed_at', 'is', null);
    const completedTopicsCount = (topicRows ?? []).length;

    // 3. Quiz scores from topic quizzes and the lesson engine. Engine lessons
    // do not always have a separate LMS quiz row, but their best-of-two score
    // is persisted in topic_progress on completion.
    const { data: quizRows } = await admin
      .from('quiz_attempts')
      .select('score')
      .eq('student_id', studentId);
    const quizScores = (quizRows ?? []).map((r) => r.score as number);
    const { data: engineProgressRows } = await admin
      .from('topic_progress')
      .select('best_quiz_score')
      .eq('student_id', studentId)
      .not('completed_at', 'is', null);
    const engineQuizScores = (engineProgressRows ?? []).map(
      (r) => r.best_quiz_score as number,
    );

    // 4. Assessment best scores, grouped by assessment_id (max per group)
    const { data: assessmentRows } = await admin
      .from('module_assessment_attempts')
      .select('assessment_id, best_score')
      .eq('student_id', studentId);
    const assessmentBestScores = new Map<number, number>();
    for (const row of (assessmentRows ?? [])) {
      const cur = assessmentBestScores.get(row.assessment_id as number) ?? 0;
      assessmentBestScores.set(
        row.assessment_id as number,
        Math.max(cur, row.best_score as number),
      );
    }

    // 5. Module completion count via resolveModuleCompletionMap
    const { data: moduleRows } = await admin
      .from('student_modules')
      .select('module_id')
      .eq('student_id', studentId);
    const moduleIds = (moduleRows ?? []).map((r) => r.module_id as number);
    const completionMap =
      moduleIds.length > 0
        ? await resolveModuleCompletionMap(studentId, moduleIds)
        : new Map();
    const completedModulesCount = [...completionMap.values()].filter((v) => v.isComplete).length;

    // Badge condition evaluation
    const allScores = [
      ...quizScores,
      ...engineQuizScores,
      ...Array.from(assessmentBestScores.values()),
    ];
    const highScoreCount =
      quizScores.filter((s) => s >= 90).length +
      engineQuizScores.filter((s) => s >= 90).length +
      [...assessmentBestScores.values()].filter((s) => s >= 90).length;

    const conditions: Record<string, boolean> = {
      'first-lesson':     completedTopicsCount >= 1,
      'lesson-streak-3':  completedTopicsCount >= 3,
      'lesson-streak-10': completedTopicsCount >= 10,
      'perfect-quiz':     allScores.some((s) => s === 100),
      'first-module':     completedModulesCount >= 1,
      'quiz-master':      highScoreCount >= 5,
      'tryout-ace':       [...assessmentBestScores.values()].some((s) => s >= 80),
    };

    // Collect badges whose condition is met and not already earned
    const newBadgeDefs = BADGE_CATALOG.filter(
      (b) => conditions[b.id] && !alreadyEarned.has(b.id),
    );

    // Persist newly earned badges (upsert, ignore duplicates for safety)
    if (newBadgeDefs.length > 0) {
      await admin
        .from('student_badges')
        .upsert(
          newBadgeDefs.map((b) => ({ student_id: studentId, badge_id: b.id })),
          { onConflict: 'student_id,badge_id', ignoreDuplicates: true },
        );
    }

    return newBadgeDefs;
  } catch (err) {
    console.error('badgeEvaluator:', err);
    return [];
  }
}
