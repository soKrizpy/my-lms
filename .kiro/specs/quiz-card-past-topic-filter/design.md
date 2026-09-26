# Quiz Card Past-Topic Filter Bugfix Design

## Overview

`PendingTasksSection` in `app/student/page.tsx` currently shows "Quiz Not Done Yet" cards for
**any unlocked topic** in the student's modules — including topics tied to upcoming or current
meetings the student has never attended. The fix narrows the pending-quiz list to only topics
that appear in a **past meeting** where `meeting_students[0].has_joined === true`, using the
same `globalIndex % allTopics.length` mapping that `StudentMeetingCard` already relies on.

No API changes are required. The `pastMeetings` data is already fetched in `StudentDashboard`
and available as `data.pastMeetings`; it just needs to be passed down as a new prop.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — `PendingTasksSection` renders a
  quiz card for a topic even though the student never joined a past meeting associated with
  that topic.
- **Property (P)**: The desired behavior — a quiz card is shown only when the student has
  genuinely attended (joined) a past class whose global index maps to that topic.
- **Preservation**: All existing score/attempt dismissal logic must remain unchanged:
  hide the card when `score >= 70` **or** `attempts >= 2`; show it when `score < 70`
  **and** `attempts < 2`.
- **PendingTasksSection**: The React component in `app/student/page.tsx` that renders
  pending quiz and assessment cards on the Schedule tab.
- **globalIndex**: Zero-based counter assigned to each `Meeting`, representing its position
  across all scheduled meetings. Maps to a topic via `allTopics[globalIndex % allTopics.length]`.
- **joinedPastTopicIds**: A `Set<number>` of `topic.id` values built from past meetings where
  `meeting_students[0].has_joined === true`.

## Bug Details

### Bug Condition

The bug manifests whenever `PendingTasksSection` renders and a topic is `isUnlocked` but
the student has never joined a past class for it. The component iterates `modules → topics`,
skips locked topics, but never checks whether the student actually attended a meeting that
corresponds to that topic.

**Formal Specification:**
```
FUNCTION isBugCondition(topic, pastMeetings)
  INPUT:
    topic        — a Topic object with { id, isUnlocked, quiz, ... }
    pastMeetings — Meeting[] with { globalIndex, meeting_students }
  OUTPUT: boolean

  allTopics   := flatMap(modules, m => m.topics)
  joinedIds   := { allTopics[m.globalIndex % allTopics.length].id
                   FOR m IN pastMeetings
                   WHERE m.meeting_students[0].has_joined === true }

  RETURN topic.isUnlocked
         AND topic.quiz IS NOT NULL
         AND topic.id NOT IN joinedIds
         AND quizCard would still be rendered   -- bug: shown without join check
END FUNCTION
```

### Examples

- **Bug case**: Student has Module 1, Topic A unlocked (admin unlocked it manually). No past
  meeting maps to Topic A. Card appears → **incorrect**, the student never sat that class.
- **Bug case**: A meeting is scheduled for next week; its topic is already unlocked from a
  previous enrolment. Card appears before the class runs → **incorrect**.
- **Fixed case**: Student attended Meeting #3 (globalIndex=2) which maps to Topic B
  (allTopics[2 % N]). Topic B has an incomplete quiz. Card appears → **correct**.
- **Edge case**: `pastMeetings` is empty. `joinedPastTopicIds` is an empty `Set`. No quiz
  cards rendered → **correct** (student has no attended history).
- **Edge case**: Multiple past meetings map to the same topic (e.g. multi-session meetings).
  The Set deduplicates; the topic appears once → **correct**.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Mouse clicks on quiz/assessment cards must continue to work exactly as before.
- Score/attempt dismissal logic is unchanged: hide when `score >= 70` OR `attempts >= 2`.
- Assessment (Tryout) cards are unaffected — they depend on `mod.isModuleComplete`, not on
  the join check, and must remain unchanged.
- The `globalIndex % allTopics.length` mapping logic in `StudentMeetingCard` must not be
  altered.
- All other tabs (Learning Path, Parent Hub) are unaffected.

**Scope:**
All inputs that do NOT satisfy the bug condition — i.e. topics that ARE correctly backed by
a joined past meeting — should be completely unaffected by this fix. This includes:
- Topics where the student joined the corresponding past meeting and has an incomplete quiz.
- Topics where the student already maxed out attempts (hidden by existing dismissal logic).
- Assessment / Tryout cards (separate pending list, different guard condition).

## Hypothesized Root Cause

Based on the bug description, the issue is:

1. **Missing join-check guard in the pending-quiz loop**: `PendingTasksSection` iterates
   `modules → topics` and only tests `topic.isUnlocked`. There is no cross-reference against
   `pastMeetings` to confirm the student actually attended a class for that topic. Any topic
   unlocked by other means (admin override, early unlock, previous enrolment) slips through.

2. **`pastMeetings` not passed as a prop**: The call-site in `StudentDashboard` passes
   `modules`, `quizAttempts`, `assessmentSummaries`, `onStartLesson`, `onGoToLearning` but
   not `pastMeetings`, so even if the guard existed it would have no data to work with.

3. **`joinedPastTopicIds` set never constructed**: The mapping `globalIndex % allTopics.length`
   exists in `StudentMeetingCard` but has never been replicated inside `PendingTasksSection`.

## Correctness Properties

Property 1: Bug Condition — Only Joined Topics Show Quiz Cards

_For any_ topic where `isBugCondition(topic, pastMeetings)` returns true (topic is unlocked,
has a quiz, but no past joined meeting maps to it), the fixed `PendingTasksSection` SHALL
**not** render a quiz card for that topic.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Legitimately Pending Quizzes Still Appear

_For any_ topic where the bug condition does NOT hold — i.e. at least one past meeting with
`has_joined === true` maps to the topic, and the quiz is still incomplete (`score < 70` AND
`attempts < 2`) — the fixed component SHALL still render a quiz card for that topic,
identical to what the original rendered.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

**File**: `app/student/page.tsx`

**Components affected**: `PendingTasksSection` (definition) and the call-site inside
`StudentDashboard` (JSX, `activeTab === "jadwal"` block).

**Specific Changes:**

1. **Add `pastMeetings` prop to `PendingTasksSection`**:
   ```ts
   function PendingTasksSection({
     modules,
     quizAttempts,
     assessmentSummaries,
     onStartLesson,
     onGoToLearning,
     pastMeetings,          // ← new
   }: {
     modules: any[];
     quizAttempts: any[];
     assessmentSummaries: any[];
     onStartLesson: (engineTopicId: string) => void;
     onGoToLearning: () => void;
     pastMeetings: Meeting[]; // ← new
   })
   ```

2. **Build `joinedPastTopicIds` set inside the component** (before the pending-quiz loop):
   ```ts
   const allTopics = modules.flatMap((m: any) => m.topics as Topic[]);
   const joinedPastTopicIds = new Set<number>(
     pastMeetings
       .filter(m => m.meeting_students?.[0]?.has_joined === true)
       .map(m => allTopics[m.globalIndex % allTopics.length]?.id)
       .filter((id): id is number => id !== undefined)
   );
   ```

3. **Add guard at the top of the pending-quiz loop body**:
   ```ts
   if (!joinedPastTopicIds.has(topic.id)) continue;
   ```
   This line is inserted right after the existing `if (!topic.isUnlocked || !topicQuiz) continue;`
   guard, replacing the implicit "any unlocked topic is fair game" assumption.

4. **Update the call-site in `StudentDashboard`** (`activeTab === "jadwal"` block):
   ```tsx
   <PendingTasksSection
     modules={data.modules || []}
     quizAttempts={data.quizAttempts || []}
     assessmentSummaries={data.assessmentSummaries || []}
     onStartLesson={(eid) => handleStartLesson(eid)}
     onGoToLearning={() => setActiveTab('learning')}
     pastMeetings={data.pastMeetings || []}   // ← new
   />
   ```

5. **No changes** to score/attempt dismissal logic, assessment cards, other props, or any
   other component.

## Testing Strategy

### Validation Approach

Two-phase: first surface counterexamples on unfixed code, then verify the fix works and
preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Confirm the bug by demonstrating that quiz cards appear for topics the student
never joined, before implementing the fix.

**Test Plan**: Mount `PendingTasksSection` with an unlocked module/topic that has no
corresponding joined past meeting. Assert that a quiz card is rendered (demonstrating the
bug on unfixed code).

**Test Cases**:
1. **Unlocked-but-never-attended**: Pass a topic with `isUnlocked: true` and a valid quiz,
   but `pastMeetings = []`. Expect a quiz card to appear on unfixed code.
2. **Admin-unlocked topic**: Pass a topic unlocked via admin override with no meeting
   history. Expect a card on unfixed code.
3. **Future meeting topic**: Pass a topic whose only meeting is upcoming (not in pastMeetings).
   Expect a card on unfixed code.
4. **`has_joined: false`**: Pass a past meeting where `has_joined === false`. Expect a card
   on unfixed code (student was absent but topic was unlocked separately).

**Expected Counterexamples**:
- Quiz cards rendered even though `pastMeetings` is empty or no meeting has `has_joined: true`.

### Fix Checking

**Goal**: Verify that after the fix, quiz cards appear only when a joined past meeting maps
to the topic.

**Pseudocode:**
```
FOR ALL (topic, pastMeetings) WHERE isBugCondition(topic, pastMeetings) DO
  result := render PendingTasksSection_fixed(topic, pastMeetings)
  ASSERT no quiz card for topic.id in result
END FOR
```

### Preservation Checking

**Goal**: Verify that topics correctly backed by a joined past meeting still show quiz cards
when the quiz is incomplete.

**Pseudocode:**
```
FOR ALL (topic, pastMeetings) WHERE NOT isBugCondition(topic, pastMeetings) DO
  ASSERT PendingTasksSection_original(topic, pastMeetings)
       = PendingTasksSection_fixed(topic, pastMeetings)
END FOR
```

**Testing Approach**: Property-based testing is recommended because:
- It generates many combinations of `globalIndex`, `allTopics.length`, and `has_joined` flag.
- It catches off-by-one errors in the `% allTopics.length` modulo mapping.
- It provides a strong guarantee that the Set construction is correct for all array lengths.

**Test Plan**: Observe behavior on unfixed code first for a topic with a valid joined meeting,
then write property-based tests confirming the same card appears after the fix.

**Test Cases**:
1. **Joined past meeting maps to topic**: `has_joined: true`, quiz incomplete → card still appears.
2. **Score exactly 70**: `score === 70`, `attempts === 1` → card hidden (existing dismissal logic).
3. **Two attempts used**: `attempts === 2` → card hidden regardless of score.
4. **Multiple meetings, same topic**: Two past joined meetings map to same topic → one card.
5. **Assessment card unchanged**: Module complete, assessment pending → card shown (unaffected).

### Unit Tests

- Render `PendingTasksSection` with `pastMeetings = []` and an unlocked topic → no quiz card.
- Render with a joined past meeting mapping to the topic → quiz card present.
- Render with `has_joined: false` on all past meetings → no quiz card.
- `globalIndex % allTopics.length` boundary: `globalIndex === allTopics.length` → wraps
  back to first topic.

### Property-Based Tests

- Generate random `allTopics` arrays (length 1–20) and random `globalIndex` values; verify
  `joinedPastTopicIds` always contains the correct `topic.id`.
- Generate random `has_joined` booleans for a list of past meetings; verify only `true` ones
  contribute to `joinedPastTopicIds`.
- Generate random score/attempt values; verify dismissal logic is unchanged (score < 70 AND
  attempts < 2 → shown; otherwise hidden).

### Integration Tests

- Full dashboard render: student with 3 past meetings (2 joined, 1 absent) + 1 upcoming →
  only 2 quiz cards at most (for the 2 joined meetings' topics).
- Admin-unlocked topic with no meeting history → no quiz card in pending section.
- Switching tabs (Schedule → Learning Path → Schedule) → pending section re-renders
  correctly with the same filtered set.
