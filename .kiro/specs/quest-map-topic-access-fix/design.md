# Quest Map Topic Access Fix — Bugfix Design

## Overview

Topics authored directly in the LMS admin (with `lesson_content` in the database but no `engine_topic_id`) cannot be opened from the Quest Map. Clicking their node routes to `TopicLearningFlowModal` instead of the lesson player, because the `canStartEngine` guard in `TopicNode.tsx` requires `engine_topic_id !== null` — a condition that LMS-authored topics never satisfy.

The fix is a minimal two-expression change in a single file (`components/quest-map/TopicNode.tsx`): relax the `canStartEngine` guard to accept topics with `lesson_content` as an alternative to `engine_topic_id`, and extend the "⏳ Segera" (coming-soon) badge condition to match the same logic. No other files change.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a topic where `engine_topic_id` is null, `lesson_content` is non-null, `status` is `'published'`, and `isUnlocked` is true.
- **Property (P)**: The desired behavior when the bug condition holds — `canStartEngine` evaluates to `true`, causing a click to route to `/student/lesson/[topic.id]`.
- **Preservation**: Existing behavior for all topics that do NOT satisfy the bug condition must be byte-for-byte identical before and after the fix.
- **canStartEngine**: The boolean derived in `TopicNodeInner` that decides whether a node click calls `onStartLesson` (lesson player) or `onSelectTopic` (modal).
- **TopicNodeTopic**: The prop type describing a topic; relevant fields are `engine_topic_id`, `lesson_content`, `status`, and `isUnlocked`.
- **getTopicById**: The server-side data function in `lib/lmsData.ts` that accepts either a numeric `id` or a string `engine_topic_id` and returns the full topic row including `lesson_content`.

---

## Bug Details

### Bug Condition

The bug manifests when a topic has LMS-authored content (`lesson_content != null`) but no engine link (`engine_topic_id == null`). The `canStartEngine` guard treats `engine_topic_id !== null` as mandatory, so it always evaluates to `false` for these topics even when all other conditions (published, unlocked) are met. The "⏳ Segera" badge also fails to display for unpublished LMS-authored topics because it uses the same `engine_topic_id` gate.

**Formal Specification:**

```
FUNCTION isBugCondition(topic)
  INPUT: topic of type TopicNodeTopic
  OUTPUT: boolean

  RETURN topic.engine_topic_id = null
    AND  topic.lesson_content  ≠ null
    AND  topic.status          = 'published'
    AND  topic.isUnlocked      = true
END FUNCTION
```

### Examples

- **Triggers bug**: `{ engine_topic_id: null, lesson_content: {...}, status: 'published', isUnlocked: true }` → `canStartEngine` evaluates to `false` → modal opens instead of player
- **Triggers bug (badge)**: `{ engine_topic_id: null, lesson_content: {...}, status: 'draft', isUnlocked: true }` → neither canStartEngine nor the "⏳ Segera" badge shows
- **Does NOT trigger bug**: `{ engine_topic_id: 'beginner-html-01', lesson_content: null, status: 'published', isUnlocked: true }` → canStartEngine is `true` (pre-existing path, unaffected)
- **Does NOT trigger bug**: `{ engine_topic_id: null, lesson_content: null, isUnlocked: true }` → canStartEngine correctly `false`, modal opens for manual topic

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Topics with a valid `engine_topic_id` and published status must continue routing to the lesson player exactly as before.
- Topics with `engine_topic_id` set but `lesson_content` null and unpublished must continue showing "⏳ Segera".
- Topics with both `engine_topic_id` and `lesson_content` null (manual-only topics) must continue opening `TopicLearningFlowModal`.
- Locked topics (`state === 'locked'`) must continue to set `canStartEngine = false` regardless of content fields.
- The `onSelectTopic` / `TopicLearningFlowModal` flow for all non-engine, non-content topics must remain entirely unaffected.

**Scope:**
All inputs where `isBugCondition(topic)` returns `false` — i.e. the majority of all existing topics — must produce identical results from `canStartEngine` before and after the patch.

---

## Hypothesized Root Cause

1. **Overly strict engine_topic_id guard**: The `canStartEngine` expression was written when the lesson player was only reachable via an external lesson engine link. The condition `topic.engine_topic_id !== null` was a correct assumption at that time but was never updated when LMS-authored `lesson_content` became a first-class path to the player.

2. **Shared gate for two independent signals**: `engine_topic_id` (external engine link) and `lesson_content` (LMS-authored) are two orthogonal ways to make a lesson playable. The bug exists because the guard treats them as equivalent instead of as alternatives.

3. **"⏳ Segera" badge reuses the same faulty gate**: The badge condition `topic.engine_topic_id && !canStartEngine` copies the same `engine_topic_id` dependency, so unpublished LMS-authored topics silently show nothing instead of the coming-soon indicator.

4. **`getTopicById` is already capable**: The server-side `getTopicById(topicId)` already accepts a numeric ID string and returns `lesson_content`. The lesson player route (`/student/lesson/[topicId]`) already handles this correctly. The bug is entirely in the client-side routing decision, not in any server logic.

---

## Correctness Properties

Property 1: Bug Condition — LMS-Authored Published Topics Route to Lesson Player

_For any_ topic where the bug condition holds (`isBugCondition` returns true), the fixed `canStartEngine` expression SHALL evaluate to `true`, causing a node click to call `onStartLesson(String(topic.id))` and route the student to `/student/lesson/[topic.id]` instead of opening `TopicLearningFlowModal`.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Non-Buggy Topic Inputs Produce Identical canStartEngine Results

_For any_ topic where the bug condition does NOT hold (`isBugCondition` returns false), the fixed `canStartEngine` expression SHALL produce exactly the same boolean result as the original expression, preserving all existing routing behavior for engine-linked topics, manual topics, locked topics, and draft topics.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

---

## Fix Implementation

### Changes Required

**File**: `components/quest-map/TopicNode.tsx`

**Function**: `TopicNodeInner`

**Specific Changes:**

1. **Relax `canStartEngine` guard** — replace the `engine_topic_id !== null` exclusive check with an OR condition that accepts either `engine_topic_id` or `lesson_content`:

   ```ts
   // BEFORE (buggy)
   const canStartEngine =
     state !== 'locked' &&
     topic.engine_topic_id !== null &&
     (topic.status === 'published' || topic.lesson_content == null);

   // AFTER (fixed)
   const canStartEngine =
     state !== 'locked' &&
     (topic.engine_topic_id !== null || topic.lesson_content != null) &&
     (topic.status === 'published' || topic.lesson_content == null);
   ```

   The third line (`status === 'published' || lesson_content == null`) is unchanged. It continues to correctly handle the draft/unpublished gate: a topic with `lesson_content` that is not yet published stays `false`.

2. **Extend "⏳ Segera" badge condition** — mirror the same OR logic so that unpublished LMS-authored topics also display the coming-soon badge:

   ```tsx
   // BEFORE (buggy)
   {topic.engine_topic_id && !canStartEngine && state !== 'locked' && (
     <span ...>⏳ Segera</span>
   )}

   // AFTER (fixed)
   {(topic.engine_topic_id || topic.lesson_content != null) && !canStartEngine && state !== 'locked' && (
     <span ...>⏳ Segera</span>
   )}
   ```

No other files require changes.

---

## Testing Strategy

### Validation Approach

Testing follows a two-phase approach: first run exploratory tests against the unfixed code to confirm the root cause, then verify the fix satisfies the correctness properties and preserves all non-buggy behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples demonstrating the bug on the UNFIXED code. Confirm or refute the root cause hypothesis before applying the patch.

**Test Plan**: Render `TopicNodeInner` with topics matching `isBugCondition` and observe whether `onStartLesson` is called on click. Run on the unfixed `canStartEngine` expression to observe failures.

**Test Cases:**

1. **Published LMS-authored topic click** — render a topic with `{ engine_topic_id: null, lesson_content: {nodes: []}, status: 'published', isUnlocked: true }`, simulate a node click, assert `onStartLesson` is called (will FAIL on unfixed code — `onSelectTopic` is called instead)
2. **Draft LMS-authored topic badge** — render a topic with `{ engine_topic_id: null, lesson_content: {nodes: []}, status: 'draft', isUnlocked: true }`, assert the "⏳ Segera" span is present (will FAIL on unfixed code — badge does not render)
3. **canStartEngine evaluation check** — pass bug-condition props to the guard expression directly, assert result is `true` (will FAIL on unfixed code)

**Expected Counterexamples:**
- `onSelectTopic` is called instead of `onStartLesson` for published LMS-authored topics
- "⏳ Segera" badge is absent for unpublished LMS-authored topics
- Root cause confirmed: `engine_topic_id !== null` short-circuits the guard

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL topic WHERE isBugCondition(topic) DO
  result := canStartEngine_fixed(topic)
  ASSERT result = true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed expression produces the same result as the original.

**Pseudocode:**
```
FOR ALL topic WHERE NOT isBugCondition(topic) DO
  ASSERT canStartEngine_original(topic) = canStartEngine_fixed(topic)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- The input space has four independent boolean-like dimensions: `engine_topic_id` (null/non-null), `lesson_content` (null/non-null), `status` ('published'/'draft'/null), and `state` ('locked'/'unlocked'/'active'/'completed')
- That yields up to 32 combinations — PBT generates them all automatically
- It provides exhaustive coverage that spot checks miss

**Test Cases:**
1. **Engine-only topic preservation** — `{ engine_topic_id: 'x', lesson_content: null, status: 'published', isUnlocked: true }` → `canStartEngine` must remain `true`
2. **Engine-only unpublished preservation** — `{ engine_topic_id: 'x', lesson_content: null, status: 'draft', isUnlocked: true }` → `canStartEngine` must remain `false`, "⏳ Segera" must still show
3. **Manual topic (no content) preservation** — `{ engine_topic_id: null, lesson_content: null, isUnlocked: true }` → `canStartEngine` must remain `false`, modal must still open
4. **Locked topic preservation** — any topic with `state = 'locked'` → `canStartEngine` must remain `false`

### Unit Tests

- Test `canStartEngine` evaluation for each combination of `engine_topic_id`, `lesson_content`, `status`, and `state`
- Test that clicking a published LMS-authored topic node calls `onStartLesson` with `String(topic.id)`
- Test that clicking a manual topic (no content, no engine id) calls `onSelectTopic`
- Test that the "⏳ Segera" badge renders for unpublished LMS-authored topics and does not render for published ones

### Property-Based Tests

- Generate arbitrary `TopicNodeTopic` objects across all combinations of the four relevant fields and assert `canStartEngine` matches the expected truth table
- Generate all `¬isBugCondition` inputs and assert the fixed expression output equals the original expression output (preservation property)
- Generate all `isBugCondition` inputs and assert the fixed expression output is always `true` (fix property)

### Integration Tests

- Navigate to the Quest Map with a module containing an LMS-authored topic; click the node; assert the browser routes to `/student/lesson/[id]`
- Confirm the lesson player renders `lesson_content` nodes correctly for a topic with no `engine_topic_id`
- Confirm that a topic with neither `engine_topic_id` nor `lesson_content` still opens `TopicLearningFlowModal` after the fix
- Confirm that engine-linked topics continue to route to the lesson player unchanged
