// lib/moduleCompletion.ts
// Determines whether a student has completed all published topics in a module.
// Module_Completion = every published topic has a topic_progress row with
// non-null completed_at.

import { getSupabaseAdmin } from './supabaseAdmin';

export interface ModuleCompletionResult {
  moduleId: number;
  isComplete: boolean;
  publishedTopicCount: number;
  completedTopicCount: number;
}

/**
 * Pure helper — no Supabase dependency.
 * Returns true when a module has at least one published topic and every
 * published topic has been completed by the student.
 */
export function isModuleComplete(
  publishedTopicCount: number,
  completedTopicCount: number
): boolean {
  return publishedTopicCount > 0 && completedTopicCount === publishedTopicCount;
}

/**
 * Resolves Module_Completion for all given module IDs for a single student.
 * Returns a Map keyed by moduleId → ModuleCompletionResult.
 * On error, returns empty Map (graceful degradation).
 */
export async function resolveModuleCompletionMap(
  studentId: string,
  moduleIds: number[]
): Promise<Map<number, ModuleCompletionResult>> {
  if (moduleIds.length === 0) return new Map();

  try {
    const admin = getSupabaseAdmin();

    // Count published topics per module
    const { data: publishedTopics, error: topicsError } = await admin
      .from('topics')
      .select('id, module_id')
      .in('module_id', moduleIds)
      .eq('status', 'published');

    if (topicsError) {
      console.error('moduleCompletion: error fetching published topics', topicsError);
      return new Map();
    }

    const topics = publishedTopics ?? [];
    const topicIds = topics.map((t) => t.id);

    // topic_progress rows with non-null completed_at for this student
    let completedTopicIds = new Set<number>();
    if (topicIds.length > 0) {
      const { data: progress, error: progressError } = await admin
        .from('topic_progress')
        .select('topic_id')
        .eq('student_id', studentId)
        .in('topic_id', topicIds)
        .not('completed_at', 'is', null);

      if (progressError) {
        console.error('moduleCompletion: error fetching topic_progress', progressError);
      } else {
        completedTopicIds = new Set((progress ?? []).map((p) => p.topic_id as number));
      }
    }

    const result = new Map<number, ModuleCompletionResult>();

    for (const moduleId of moduleIds) {
      const published = topics.filter((t) => t.module_id === moduleId);
      const completed = published.filter((t) => completedTopicIds.has(t.id));
      result.set(moduleId, {
        moduleId,
        isComplete: isModuleComplete(published.length, completed.length),
        publishedTopicCount: published.length,
        completedTopicCount: completed.length,
      });
    }

    return result;
  } catch (err) {
    console.error('moduleCompletion: unexpected error', err);
    return new Map();
  }
}
