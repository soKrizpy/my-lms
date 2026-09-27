# Bugfix Requirements Document

## Introduction

Students cannot open lessons for manually-authored topics from the Quest Map. When a topic has `lesson_content` stored directly in the LMS database but no `engine_topic_id` (i.e. it was created by a teacher in the LMS admin, not linked to the external lesson engine), clicking the topic node opens an in-page modal (`TopicLearningFlowModal`) instead of routing to the lesson player (`/student/lesson/[topicId]`). The modal has no mechanism to render the rich `lesson_content` payload from the database, so students either see fallback/empty content or cannot start the lesson at all.

The root cause is the `canStartEngine` guard in `TopicNode.tsx`:

```ts
const canStartEngine =
  state !== 'locked' &&
  topic.engine_topic_id !== null &&   // ← incorrectly required
  (topic.status === 'published' || topic.lesson_content == null);
```

The `topic.engine_topic_id !== null` condition is too strict. A topic with `lesson_content` in the DB and a numeric `topic.id` is fully servable by the lesson player (`getTopicById` accepts a numeric ID and returns `lesson_content`), yet the guard short-circuits to `false`, bypassing the player entirely.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a topic has `lesson_content` set (non-null) AND `engine_topic_id` is null AND `status` is `'published'` THEN the system sets `canStartEngine = false` and routes the click to `TopicLearningFlowModal` instead of the lesson player

1.2 WHEN `canStartEngine` is false for a published LMS-authored topic THEN the system displays a `TopicLearningFlowModal` that does not render the topic's `lesson_content`, showing only fallback or empty content to the student

1.3 WHEN a topic has `lesson_content` set AND `engine_topic_id` is null AND `status` is not `'published'` (e.g. `'draft'` or null) THEN the system sets `canStartEngine = false` and silently falls through to `onSelectTopic`, with no "Coming Soon" badge shown (because the `engine_topic_id` null check also gates the "⏳ Segera" badge render)

### Expected Behavior (Correct)

2.1 WHEN a topic has `lesson_content` set AND `status` is `'published'` AND `state` is not `'locked'` THEN the system SHALL set `canStartEngine = true` and route the click to `/student/lesson/[topic.id]`, regardless of whether `engine_topic_id` is null or not

2.2 WHEN `canStartEngine` is true for a topic with `lesson_content` but no `engine_topic_id` THEN the system SHALL pass `String(topic.id)` to `onStartLesson`, causing the lesson player to fetch the topic by numeric `id` and render `lesson_content` correctly

2.3 WHEN a topic has `lesson_content` set AND `engine_topic_id` is null AND `status` is NOT `'published'` THEN the system SHALL still set `canStartEngine = false` and SHALL display the "⏳ Segera" badge (coming-soon indicator) so students know the lesson is not yet available

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a topic has `engine_topic_id` set AND `status` is `'published'` AND `state` is not `'locked'` THEN the system SHALL CONTINUE TO set `canStartEngine = true` and route to the lesson player using `String(topic.id)` as before

3.2 WHEN a topic has `engine_topic_id` set AND `lesson_content` is null AND `status` is not `'published'` THEN the system SHALL CONTINUE TO set `canStartEngine = false` and display the "⏳ Segera" badge

3.3 WHEN a topic has `engine_topic_id` is null AND `lesson_content` is null THEN the system SHALL CONTINUE TO set `canStartEngine = false` and open `TopicLearningFlowModal` (manual topic with no content — modal handles external links, project links, etc.)

3.4 WHEN a topic `state` is `'locked'` THEN the system SHALL CONTINUE TO set `canStartEngine = false` regardless of `engine_topic_id` or `lesson_content`

3.5 WHEN `canStartEngine` is false and `onSelectTopic` is called THEN the system SHALL CONTINUE TO open `TopicLearningFlowModal` for locked topic preview and for topics with no engine or lesson content

---

## Bug Condition Pseudocode

**Bug Condition Function** — identifies inputs that trigger the bug:

```pascal
FUNCTION isBugCondition(topic)
  INPUT: topic of type TopicNodeTopic
  OUTPUT: boolean

  // Returns true when the topic has LMS-authored content ready for the player
  // but the current guard would incorrectly set canStartEngine = false
  RETURN topic.engine_topic_id = null
    AND topic.lesson_content ≠ null
    AND topic.status = 'published'
    AND topic.isUnlocked = true
END FUNCTION
```

**Property: Fix Checking** — for all buggy inputs, the fix must produce correct behavior:

```pascal
// Property: Fix Checking — published LMS topics must route to the lesson player
FOR ALL topic WHERE isBugCondition(topic) DO
  result ← canStartEngine'(topic)
  ASSERT result = true
END FOR
```

**Property: Preservation Checking** — non-buggy inputs must behave identically before and after fix:

```pascal
// Property: Preservation Checking
FOR ALL topic WHERE NOT isBugCondition(topic) DO
  ASSERT canStartEngine(topic) = canStartEngine'(topic)
END FOR
```
