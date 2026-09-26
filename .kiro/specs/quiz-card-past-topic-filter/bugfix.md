# Bugfix Requirements Document

## Introduction

The Student Dashboard's "Tugas Belum Selesai" (Pending Tasks) section shows quiz reminder cards
for topics the student has not yet attended. These cards should only appear for topics that belong
to a **past meeting the student actually joined** (`has_joined === true`). Showing the card for an
ongoing or upcoming class is premature and causes confusion.

The fix scope is limited to the `PendingTasksSection` component in
`app/student/page.tsx`. No API changes are required; the existing `pastMeetings` array already
carries the `meeting_students[].has_joined` flag and the `globalIndex` needed to resolve which
topic each meeting maps to.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a topic is `isUnlocked` AND has a quiz AND the student has fewer than 2 attempts AND no score ≥ 70, THEN the system renders a pending-quiz card for that topic regardless of whether the student has attended a class for it.

1.2 WHEN a topic belongs to the current (live or upcoming) meeting, THEN the system still renders a pending-quiz card because `isUnlocked` alone does not exclude current/future meetings.

1.3 WHEN a topic belongs to a past meeting that the student did NOT join (`has_joined === false`), THEN the system renders a pending-quiz card even though the student was absent.

### Expected Behavior (Correct)

2.1 WHEN a topic corresponds to a past meeting where `meeting_students[].has_joined === true` AND the student has fewer than 2 quiz attempts AND has no score ≥ 70, THEN the system SHALL render a pending-quiz card for that topic.

2.2 WHEN a topic's only associated meetings are current or future (not yet ended), THEN the system SHALL NOT render a pending-quiz card for that topic.

2.3 WHEN a topic belongs to a past meeting but `meeting_students[].has_joined === false`, THEN the system SHALL NOT render a pending-quiz card for that topic.

2.4 WHEN a student has a quiz score ≥ 80 for a topic, THEN the system SHALL NOT render a pending-quiz card for that topic (dismissed as complete).

2.5 WHEN a student has used 2 or more quiz attempts for a topic, THEN the system SHALL NOT render a pending-quiz card for that topic (regardless of score).

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a topic qualifies for a pending-quiz card (past joined class, score < 70, attempts < 2), THEN the system SHALL CONTINUE TO display the quiz origin badge (Engine Lesson / Bulk CSV / Admin Manual), attempt counter, and XP reward label exactly as before.

3.2 WHEN the pending-quiz card is clicked, THEN the system SHALL CONTINUE TO either open the lesson engine (for `engineTopicId` topics) or navigate to the standalone quiz URL (for non-engine topics).

3.3 WHEN there are zero qualifying pending quizzes AND zero pending assessments, THEN the system SHALL CONTINUE TO render nothing (return `null`).

3.4 WHEN pending assessment cards are shown, THEN the system SHALL CONTINUE TO apply the existing assessment eligibility logic (module complete, attempts < 2, best score < 80) unchanged.

3.5 WHEN the `PendingTasksSection` is rendered on the Schedule (Jadwal) tab, THEN the system SHALL CONTINUE TO show the total pending count badge in the section header.

---

## Bug Condition Pseudocode

### Bug Condition Function

```pascal
FUNCTION isBugCondition(topic, pastMeetings, allTopics)
  INPUT: topic — a topic object from the modules list
         pastMeetings — array of past Meeting objects (each with globalIndex and meeting_students)
         allTopics — flat array of all topics across all modules (in order)
  OUTPUT: boolean

  // The bug fires when we include a topic in pending cards WITHOUT verifying
  // it maps to a past meeting where the student actually joined.
  joinedPastTopicIds ← SET of topic IDs mapped from past meetings where has_joined = true
  RETURN topic.id NOT IN joinedPastTopicIds
END FUNCTION
```

### Property: Fix Checking

```pascal
// For every topic rendered as a pending-quiz card, verify the student joined a past class for it
FOR ALL topic WHERE pendingQuizCard is rendered DO
  allTopics ← modules.flatMap(m => m.topics)
  joinedPastTopicIds ← pastMeetings
    .filter(m => m.meeting_students[0].has_joined = true)
    .map(m => allTopics[m.globalIndex % allTopics.length].id)
    .toSet()

  ASSERT topic.id IN joinedPastTopicIds
  ASSERT topic.quizAttempts < 2
  ASSERT topic.bestScore < 70  // show threshold
END FOR
```

### Property: Preservation Checking

```pascal
// For every topic that WAS correctly shown before, it should still be shown after the fix
FOR ALL topic WHERE NOT isBugCondition(topic, pastMeetings, allTopics) DO
  // i.e. the student DID join a past class for this topic
  ASSERT F(topic) = F'(topic)
  // rendering decision, origin badge, click handler, count badge are unchanged
END FOR
```

**Key Definitions:**
- **F**: `PendingTasksSection` logic before the fix — uses only `topic.isUnlocked`
- **F'**: `PendingTasksSection` logic after the fix — additionally cross-references `pastMeetings` with `has_joined === true`
