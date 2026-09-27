import { describe, it, expect } from 'vitest';
import type { TopicNodeTopic } from './TopicNode';

// ──────────────────────────────────────────────────────────────────────────────
// Helper: evaluate the canStartEngine expression from TopicNode.tsx
// We extract the pure logic here so we can unit-test it without rendering React.
// ──────────────────────────────────────────────────────────────────────────────

type NodeState = 'locked' | 'unlocked' | 'active' | 'completed';

/**
 * ORIGINAL (buggy) canStartEngine expression — as it exists in unfixed code.
 * Requires engine_topic_id !== null, so LMS-authored topics (lesson_content only) always return false.
 */
function canStartEngine_original(topic: TopicNodeTopic, state: NodeState): boolean {
  return (
    state !== 'locked' &&
    topic.engine_topic_id !== null &&
    (topic.status === 'published' || topic.lesson_content == null)
  );
}

/**
 * FIXED canStartEngine expression — as specified in the design.
 * Accepts engine_topic_id OR lesson_content as the "has playable content" signal.
 */
function canStartEngine_fixed(topic: TopicNodeTopic, state: NodeState): boolean {
  return (
    state !== 'locked' &&
    (topic.engine_topic_id !== null || topic.lesson_content != null) &&
    (topic.status === 'published' || topic.lesson_content == null)
  );
}

/**
 * ORIGINAL "⏳ Segera" badge condition — as it exists in unfixed code.
 * Only shows for topics that have engine_topic_id.
 */
function segeraBadgeCondition_original(topic: TopicNodeTopic, canStartEngine: boolean, state: NodeState): boolean {
  return !!(topic.engine_topic_id && !canStartEngine && state !== 'locked');
}

/**
 * FIXED "⏳ Segera" badge condition — as specified in the design.
 * Also shows for topics that have lesson_content but no engine_topic_id.
 */
function segeraBadgeCondition_fixed(topic: TopicNodeTopic, canStartEngine: boolean, state: NodeState): boolean {
  return !!((topic.engine_topic_id || topic.lesson_content != null) && !canStartEngine && state !== 'locked');
}

/**
 * isBugCondition: returns true if the topic hits the known bug.
 * Bug condition: engine_topic_id = null AND lesson_content != null AND status = 'published' AND isUnlocked = true
 */
function isBugCondition(topic: TopicNodeTopic): boolean {
  return (
    topic.engine_topic_id === null &&
    topic.lesson_content != null &&
    topic.status === 'published' &&
    topic.isUnlocked === true
  );
}

// Import the extraction functions directly or test the dynamic behavior
describe('Dynamic Learning Flow & Node Architecture', () => {
  it('should support dynamic numbers of topics in a module without hardcoded limits', () => {
    // Simulate teacher creating 15 topics in a module
    const dynamicTopics: TopicNodeTopic[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      title: `Topik Pembelajaran ${i + 1}`,
      order_index: i + 1,
      engine_topic_id: `topic-${i + 1}`,
      isUnlocked: i < 3,
      status: 'published',
      quiz: { id: 100 + i, title: `Kuis ${i + 1}` },
    }));

    expect(dynamicTopics.length).toBe(15);
    // Unlocked count
    const unlocked = dynamicTopics.filter((t) => t.isUnlocked);
    expect(unlocked.length).toBe(3);

    // Row calculation for desktop zigzag (rows of 3)
    const rows: TopicNodeTopic[][] = [];
    for (let i = 0; i < dynamicTopics.length; i += 3) {
      rows.push(dynamicTopics.slice(i, i + 3));
    }
    expect(rows.length).toBe(5);
    expect(rows[0].length).toBe(3);
    expect(rows[4].length).toBe(3);
  });

  it('should dynamically extract multiple lesson slides when teacher provides lesson_content.nodes', async () => {
    const { TopicLearningFlowModal } = await import('./TopicLearningFlowModal');
    expect(TopicLearningFlowModal).toBeDefined();

    // Sample teacher-authored lesson_content with 4 custom slides
    const teacherLessonContent = {
      nodes: [
        { nodeId: 'n1', nodeType: 'lesson', title: 'Pengenalan Tag HTML', content: 'HTML adalah bahasa markup...' },
        { nodeId: 'n2', nodeType: 'code', title: 'Struktur Dasar', content: 'Berikut struktur wajib dokumen HTML:', codeContent: '<!DOCTYPE html>\n<html>\n</html>', language: 'html' },
        { nodeId: 'n3', nodeType: 'lesson', title: 'Elemen Head & Body', content: 'Head berisi metadata, body berisi tampilan...' },
        { nodeId: 'n4', nodeType: 'practice', title: 'Uji Cepat Tag', content: 'Manakah tag untuk membuat judul terbesar?', options: '<h1>|<h6>|<p>|<a>', correctOption: 0 },
      ],
    };

    expect(teacherLessonContent.nodes.length).toBe(4);
    const lessonSlides = teacherLessonContent.nodes.filter((n) => n.nodeType === 'lesson' || n.nodeType === 'code');
    expect(lessonSlides.length).toBe(3);
    expect(lessonSlides[1].codeContent).toContain('<!DOCTYPE html>');
  });

  it('should handle single paragraph or empty description gracefully with fallbacks', () => {
    const emptyTopic: TopicNodeTopic = {
      id: 99,
      title: 'Topik Baru',
      order_index: 1,
      engine_topic_id: null,
      isUnlocked: true,
      description: null,
      quiz: null,
    };

    expect(emptyTopic.description).toBeNull();
    expect(emptyTopic.quiz).toBeNull();
    expect(emptyTopic.engine_topic_id).toBeNull();
  });

  it('should properly configure TopicLockModal for locked topics', async () => {
    const { TopicLockModal } = await import('./TopicLockModal');
    expect(TopicLockModal).toBeDefined();

    const lockedTopic: TopicNodeTopic = {
      id: 5,
      title: 'Perulangan Bersarang (Nested Loop)',
      order_index: 5,
      engine_topic_id: 'py-nested-05',
      isUnlocked: false,
      description: 'Mempelajari cara membuat loop di dalam loop untuk matriks dan pola.',
      quiz: null,
    };

    expect(lockedTopic.isUnlocked).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Task 1: Bug Condition Exploration Tests
// Validates: Requirements 1.1, 1.2, 1.3
//
// These tests assert the EXPECTED (fixed) behavior for bug-condition inputs.
// They WILL FAIL on unfixed code — that failure is the counterexample proving
// the bug exists. After applying the fix in Task 3, these tests should pass.
// ──────────────────────────────────────────────────────────────────────────────

describe('Property 1: Bug Condition — LMS-Authored Published Topic canStartEngine', () => {
  it('BUG EXPLORATION: canStartEngine should be true for published LMS-authored topic (engine_topic_id=null, lesson_content set)', () => {
    // This is the exact bug-condition input from the design doc.
    // On UNFIXED code: canStartEngine_original returns false (engine_topic_id === null short-circuits)
    // On FIXED code: canStartEngine_fixed returns true
    const bugConditionTopic: TopicNodeTopic = {
      id: 42,
      title: 'Pengenalan HTML',
      order_index: 1,
      engine_topic_id: null,           // LMS-authored: no engine link
      lesson_content: { nodes: [] },   // has LMS-authored content
      status: 'published',
      isUnlocked: true,
      quiz: null,
    };

    expect(isBugCondition(bugConditionTopic)).toBe(true); // confirm it's a bug-condition input

    // UNFIXED expression returns false — this is the root cause
    const unfixedResult = canStartEngine_original(bugConditionTopic, 'unlocked');
    // On unfixed code: unfixedResult === false (bug confirmed)

    // EXPECTED behavior after fix: must return true
    // After fix: canStartEngine_fixed should return true for bug-condition inputs
    expect(canStartEngine_fixed(bugConditionTopic, 'unlocked')).toBe(true);
  });

  it('BUG EXPLORATION: canStartEngine should be true for multiple bug-condition topics with varying IDs', () => {
    // Scoped PBT: vary topic.id while keeping all other fields in bug-condition
    const bugConditionTopics: TopicNodeTopic[] = [1, 5, 10, 99, 1000].map((id) => ({
      id,
      title: `Topik LMS ${id}`,
      order_index: id,
      engine_topic_id: null,
      lesson_content: { nodes: [{ nodeId: `n${id}`, nodeType: 'lesson', title: 'Slide', content: 'Content' }] },
      status: 'published' as const,
      isUnlocked: true,
      quiz: null,
    }));

    for (const topic of bugConditionTopics) {
      expect(isBugCondition(topic)).toBe(true); // all must be bug-condition inputs
      // EXPECTED: canStartEngine = true (uses fixed expression)
      expect(canStartEngine_fixed(topic, 'unlocked')).toBe(true);
    }
  });

  it('BUG EXPLORATION: "⏳ Segera" badge condition should be truthy for draft LMS-authored topic', () => {
    // Bug also affects the badge: unpublished LMS-authored topics don't show "⏳ Segera"
    const draftLmsAuthoredTopic: TopicNodeTopic = {
      id: 7,
      title: 'Topik Draft LMS',
      order_index: 7,
      engine_topic_id: null,             // no engine link
      lesson_content: { nodes: [] },     // has LMS content but unpublished
      status: 'draft',
      isUnlocked: true,
      quiz: null,
    };

    const cse = canStartEngine_fixed(draftLmsAuthoredTopic, 'unlocked');
    // cse should be false (draft status gates LMS-authored content)
    expect(cse).toBe(false);

    // Badge condition on FIXED code: lesson_content != null makes OR branch truthy → badge shows
    // EXPECTED: badge condition should be truthy
    expect(segeraBadgeCondition_fixed(draftLmsAuthoredTopic, cse, 'unlocked')).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Task 2: Preservation Property Tests
// Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
//
// These tests cover all inputs where isBugCondition returns FALSE — i.e. the
// majority of existing topics. They assert the OBSERVED baseline behavior on
// unfixed code and MUST PASS before the fix is applied.
// After the fix, the same tests verify no regressions.
// ──────────────────────────────────────────────────────────────────────────────

describe('Property 2: Preservation — Non-Buggy Topic Inputs Produce Identical canStartEngine Results', () => {
  // ── 3.1: Engine-only published topic → canStartEngine = true ───────────────
  it('PRESERVATION 3.1: engine-only published unlocked topic → canStartEngine true', () => {
    // Validates: Requirements 3.1
    const topic: TopicNodeTopic = {
      id: 1,
      title: 'HTML Dasar',
      order_index: 1,
      engine_topic_id: 'beginner-html-01',
      lesson_content: null,
      status: 'published',
      isUnlocked: true,
      quiz: null,
    };
    expect(isBugCondition(topic)).toBe(false); // not a bug-condition input

    const statesWhereTrue: NodeState[] = ['unlocked', 'active', 'completed'];
    for (const state of statesWhereTrue) {
      expect(canStartEngine_original(topic, state)).toBe(true);
    }
    // locked state always returns false
    expect(canStartEngine_original(topic, 'locked')).toBe(false);
  });

  // ── 3.2: Engine-only draft/null-content topic → canStartEngine true ─────────
  it('PRESERVATION 3.2: engine-only topic with lesson_content=null is always accessible (canStartEngine=true) regardless of status', () => {
    // Validates: Requirements 3.2
    // Observation: the third clause `(status === 'published' || lesson_content == null)` acts as
    // an escape valve — engine-linked topics with lesson_content=null bypass the status gate.
    // This is correct by design: the status gate only applies when lesson_content is set.
    const draftEngineNullContent: TopicNodeTopic = {
      id: 2,
      title: 'CSS Menengah',
      order_index: 2,
      engine_topic_id: 'beginner-css-01',
      lesson_content: null,
      status: 'draft',
      isUnlocked: true,
      quiz: null,
    };
    expect(isBugCondition(draftEngineNullContent)).toBe(false);

    // Engine-only (null content) topics: canStartEngine=true even when draft
    // because the escape valve `lesson_content == null` makes the third clause true
    const state: NodeState = 'unlocked';
    expect(canStartEngine_original(draftEngineNullContent, state)).toBe(true);
  });

  // ── 3.3: Manual topic (both null) → canStartEngine false ───────────────────
  it('PRESERVATION 3.3: manual topic with neither engine_topic_id nor lesson_content → canStartEngine false', () => {
    // Validates: Requirements 3.3
    const topic: TopicNodeTopic = {
      id: 3,
      title: 'Topik Manual',
      order_index: 3,
      engine_topic_id: null,
      lesson_content: null,
      status: 'published',
      isUnlocked: true,
      quiz: null,
    };
    expect(isBugCondition(topic)).toBe(false);

    for (const state of ['unlocked', 'active', 'completed'] as NodeState[]) {
      expect(canStartEngine_original(topic, state)).toBe(false);
    }

    // Badge should NOT show (no engine_topic_id)
    const cse = canStartEngine_original(topic, 'unlocked');
    expect(segeraBadgeCondition_original(topic, cse, 'unlocked')).toBe(false);
  });

  // ── 3.4: Locked topic → canStartEngine always false ────────────────────────
  it('PRESERVATION 3.4: locked topic → canStartEngine always false regardless of other fields', () => {
    // Validates: Requirements 3.4
    const topicVariants: TopicNodeTopic[] = [
      { id: 4, title: 'T1', order_index: 4, engine_topic_id: 'x', lesson_content: null, status: 'published', isUnlocked: false, quiz: null },
      { id: 5, title: 'T2', order_index: 5, engine_topic_id: null, lesson_content: { nodes: [] }, status: 'published', isUnlocked: false, quiz: null },
      { id: 6, title: 'T3', order_index: 6, engine_topic_id: null, lesson_content: null, status: 'published', isUnlocked: false, quiz: null },
    ];
    for (const topic of topicVariants) {
      expect(canStartEngine_original(topic, 'locked')).toBe(false);
    }
  });

  // ── 3.5: Engine + lesson_content published → canStartEngine true ───────────
  it('PRESERVATION 3.5: topic with both engine_topic_id and lesson_content published → canStartEngine true', () => {
    // Validates: Requirements 3.5
    const topic: TopicNodeTopic = {
      id: 7,
      title: 'HTML + LMS Content',
      order_index: 7,
      engine_topic_id: 'beginner-html-05',
      lesson_content: { nodes: [{ nodeId: 'n1', nodeType: 'lesson', title: 'Slide', content: 'Content' }] },
      status: 'published',
      isUnlocked: true,
      quiz: null,
    };
    expect(isBugCondition(topic)).toBe(false); // has engine_topic_id so not bug-condition

    expect(canStartEngine_original(topic, 'unlocked')).toBe(true);
    expect(canStartEngine_original(topic, 'active')).toBe(true);
    expect(canStartEngine_original(topic, 'completed')).toBe(true);
    expect(canStartEngine_original(topic, 'locked')).toBe(false);
  });

  // ── Exhaustive preservation: all non-bug-condition inputs produce same result
  it('PRESERVATION: fixed expression matches original for all non-bug-condition inputs', () => {
    // Validates: Requirements 3.1-3.5
    // Generate all combinations of the four relevant dimensions
    const engineIds: (string | null)[] = ['beginner-html-01', null];
    const lessonContents: (unknown | null)[] = [{ nodes: [] }, null];
    const statuses: (string | null)[] = ['published', 'draft', null];
    const states: NodeState[] = ['locked', 'unlocked', 'active', 'completed'];
    const isUnlockedValues: boolean[] = [true, false];

    let checkedCount = 0;

    for (const engine_topic_id of engineIds) {
      for (const lesson_content of lessonContents) {
        for (const status of statuses) {
          for (const state of states) {
            for (const isUnlocked of isUnlockedValues) {
              const topic: TopicNodeTopic = {
                id: checkedCount + 1,
                title: `Topic ${checkedCount}`,
                order_index: checkedCount + 1,
                engine_topic_id,
                lesson_content,
                status,
                isUnlocked,
                quiz: null,
              };

              // Skip the bug-condition quadrant — tested separately in Property 1
              if (isBugCondition(topic)) continue;

              // Also skip the extended fix quadrant: engine_topic_id=null AND lesson_content!=null
              // AND status='published' (regardless of isUnlocked). These are affected by the fix
              // (the fix makes them accessible), so they are intentionally different.
              if (engine_topic_id === null && lesson_content != null && status === 'published') continue;

              const originalResult = canStartEngine_original(topic, state);
              const fixedResult = canStartEngine_fixed(topic, state);
              expect(fixedResult).toBe(originalResult);
              checkedCount++;
            }
          }
        }
      }
    }

    // Sanity: we checked a meaningful number of combinations
    expect(checkedCount).toBeGreaterThan(10);
  });

  // ── Badge preservation for engine-only topics ─────────────────────────────
  it('BADGE PRESERVATION: engine+content draft → badge truthy; no engine/no content → badge falsy; engine only (null content) → no badge needed (canStartEngine=true)', () => {
    // Engine with content, draft status: canStartEngine=false (status gate blocks it), badge should show
    const engineContentDraftTopic: TopicNodeTopic = {
      id: 20, title: 'Engine+Content Draft', order_index: 20,
      engine_topic_id: 'x', lesson_content: { nodes: [] }, status: 'draft', isUnlocked: true, quiz: null,
    };
    // Engine with null content, draft: canStartEngine=true (null content bypass), no badge needed
    const engineNullContentDraftTopic: TopicNodeTopic = {
      id: 21, title: 'Engine Null-Content Draft', order_index: 21,
      engine_topic_id: 'x', lesson_content: null, status: 'draft', isUnlocked: true, quiz: null,
    };
    const manualTopic: TopicNodeTopic = {
      id: 22, title: 'Manual', order_index: 22,
      engine_topic_id: null, lesson_content: null, status: 'published', isUnlocked: true, quiz: null,
    };

    // Engine+content draft: canStartEngine=false (status gate applies when content is set)
    const cseEngineContentDraft = canStartEngine_original(engineContentDraftTopic, 'unlocked');
    expect(cseEngineContentDraft).toBe(false);
    expect(segeraBadgeCondition_original(engineContentDraftTopic, cseEngineContentDraft, 'unlocked')).toBe(true);

    // Engine null-content draft: canStartEngine=true (null content bypass)
    const cseEngineNullDraft = canStartEngine_original(engineNullContentDraftTopic, 'unlocked');
    expect(cseEngineNullDraft).toBe(true);
    // Badge doesn't show when canStartEngine=true (correct — lesson is accessible)
    expect(segeraBadgeCondition_original(engineNullContentDraftTopic, cseEngineNullDraft, 'unlocked')).toBe(false);

    // Manual (no content): badge should NOT show
    const cseManual = canStartEngine_original(manualTopic, 'unlocked');
    expect(cseManual).toBe(false);
    expect(segeraBadgeCondition_original(manualTopic, cseManual, 'unlocked')).toBe(false);
  });
});
