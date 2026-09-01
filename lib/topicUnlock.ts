// lib/topicUnlock.ts
// Single source of truth for topic unlock status.
//
// A topic at position N (0-indexed, sorted by module_id asc → order_index asc)
// is unlocked if ANY of the following is true:
//   (a) The student's meeting at position N (sorted by meeting_date asc) has has_joined = true
//       — positional modulo: if there are more meetings than topics, index wraps
//   (b) There is a topic_progress row for this topic's engine_topic_id
//       — engine lesson completion also unlocks
//
// Used by:
//   - app/api/student/dashboard/route.ts
//   - app/api/admin/students/[id]/details/route.ts

import { getSupabaseAdmin } from './supabaseAdmin';

export interface TopicUnlockResult {
  topicId: number;
  engineTopicId: string | null;
  isUnlocked: boolean;
}

/**
 * Resolves unlock status for all topics across the given modules for a student.
 * Returns a Map keyed by topic.id → TopicUnlockResult.
 * On error, returns empty Map (graceful degradation).
 */
export async function resolveTopicUnlockMap(
  studentId: string,
  moduleIds: number[]
): Promise<Map<number, TopicUnlockResult>> {
  try {
    if (moduleIds.length === 0) return new Map();
    const admin = getSupabaseAdmin();

    // 1. All topics for these modules, sorted consistently (same order used everywhere)
    let topics: any[] = [];
    try {
      const { data, error } = await admin
        .from('topics')
        .select('id, module_id, order_index, engine_topic_id')
        .in('module_id', moduleIds)
        .order('module_id', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching topics:', error);
        return new Map();
      }
      topics = data ?? [];
    } catch (err) {
      console.error('Exception fetching topics:', err);
      return new Map();
    }

    if (topics.length === 0) return new Map();

    // 2. All meetings this student is assigned to, sorted by date
    let meetings: any[] = [];
    try {
      const { data, error } = await admin
        .from('meetings')
        .select('id, meeting_date, meeting_students!inner(student_id, has_joined)')
        .eq('meeting_students.student_id', studentId)
        .order('meeting_date', { ascending: true });

      if (error) {
        console.error('Error fetching meetings:', error);
        meetings = [];
      } else {
        meetings = data ?? [];
      }
    } catch (err) {
      console.error('Exception fetching meetings:', err);
      meetings = [];
    }

    // 3. Engine-completed topics for this student
    const engineTopicIds = topics
      .map((t) => t?.engine_topic_id)
      .filter(Boolean) as string[];

    let completedEngineTopicIds = new Set<string>();
    if (engineTopicIds.length > 0) {
      try {
        const { data, error } = await admin
          .from('topic_progress')
          .select('engine_topic_id')
          .eq('student_id', studentId)
          .in('engine_topic_id', engineTopicIds);

        if (error) {
          console.error('Error fetching topic progress:', error);
          completedEngineTopicIds = new Set();
        } else {
          completedEngineTopicIds = new Set(
            (data ?? []).map((p: any) => p?.engine_topic_id as string).filter(Boolean)
          );
        }
      } catch (err) {
        console.error('Exception fetching topic progress:', err);
        completedEngineTopicIds = new Set();
      }
    }

    // 4. Build result map
    const result = new Map<number, TopicUnlockResult>();
    const totalTopics = topics.length;
    const meetingsList = meetings;

    topics.forEach((topic, globalIndex) => {
      // Guard: ensure topic has required id property
      if (topic?.id == null) return;

      // Modulo: if there are more meetings than topics the extra meetings don't open new slots;
      // if there are more topics than meetings, topics beyond meeting count stay locked by join.
      const meetingIdx = totalTopics > 0 ? globalIndex % totalTopics : globalIndex;
      
      // Bounds checking: ensure meetingIdx is within array bounds
      const meeting = meetingIdx >= 0 && meetingIdx < meetingsList.length 
        ? meetingsList[meetingIdx] 
        : undefined;
      
      const unlockedByJoin: boolean =
        meeting?.meeting_students?.[0]?.has_joined === true;
      
      const unlockedByEngine: boolean =
        typeof topic?.engine_topic_id === 'string' && topic.engine_topic_id.length > 0
          ? completedEngineTopicIds.has(topic.engine_topic_id)
          : false;

      result.set(topic.id as number, {
        topicId: topic.id as number,
        engineTopicId: topic?.engine_topic_id ?? null,
        isUnlocked: unlockedByJoin || unlockedByEngine,
      });
    });

    return result;
  } catch (err) {
    // Catch-all for any unexpected errors
    console.error('Unexpected error in resolveTopicUnlockMap:', err);
    return new Map();
  }
}
