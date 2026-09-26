# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Unlocked Topic Without Joined Past Meeting Shows Quiz Card
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate that `PendingTasksSection` renders quiz cards for topics the student never attended
  - **Scoped PBT Approach**: Scope the property to the concrete failing case: an unlocked topic with a valid quiz whose `topic.id` is NOT in any joined past meeting's globalIndex mapping
  - Create `app/student/__tests__/pending-tasks-filter.test.ts`
  - Extract the `joinedPastTopicIds` derivation logic into a pure helper function `buildJoinedPastTopicIds(pastMeetings, allTopics)` at the top of `app/student/page.tsx` (or inline test the logic directly) so it can be unit-tested without mounting the full React component
  - Write a property-based test using `fast-check`:
    - Generate an array of `Topic` objects (length 1–10, each with a unique `id`)
    - Generate a `pastMeetings` array where every entry has `has_joined: false` OR `pastMeetings` is empty
    - Derive `joinedPastTopicIds` using the current (unfixed) logic — which is just `topic.isUnlocked` with no join check
    - Assert that `joinedPastTopicIds.has(topic.id)` returns `true` for any topic whose `id` is NOT covered by a joined meeting
    - **EXPECTED OUTCOME on unfixed code**: the Set is never built so all unlocked topics pass through → test FAILS (this proves the bug)
  - Document counterexamples found, e.g. `topic.id=1, pastMeetings=[]` → card would be rendered
  - Mark task complete when test is written, run (`npx vitest --run`), and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Correctly-Attended Topics Still Produce Quiz Cards
  - **IMPORTANT**: Follow observation-first methodology
  - Before touching the fix, observe on unfixed code:
    - `topic = { id: 3, isUnlocked: true, quiz: { id: 10, title: 'Quiz' } }`, `pastMeetings = [{ globalIndex: 2, meeting_students: [{ has_joined: true }] }]`, `allTopics` has 5 entries → `joinedPastTopicIds` should contain `topic.id` (allTopics[2 % 5])
    - Score/attempt dismissal: `score=65, attemptsUsed=1` → card shown; `score=70, attemptsUsed=1` → card hidden; `attemptsUsed=2` → card hidden
  - Write property-based tests using `fast-check` in the same `pending-tasks-filter.test.ts` file:
    - **P2a — join mapping correctness**: for all arrays of topics (length 1–20) and random valid `globalIndex` values with `has_joined: true`, verify `buildJoinedPastTopicIds` always contains `allTopics[globalIndex % allTopics.length].id`
    - **P2b — dismissal logic unchanged**: for all `(score, attemptsUsed)` pairs, verify the show condition `attemptsUsed < 2 && score < 70` is preserved exactly (no change to thresholds)
    - **P2c — absent meetings excluded**: for all past meetings with `has_joined: false`, verify the topic's id does NOT appear in `joinedPastTopicIds`
  - Run tests on UNFIXED code with `npx vitest --run`
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Fix: narrow pending-quiz cards to joined-past-meeting topics

  - [ ] 3.1 Add `pastMeetings` prop to `PendingTasksSection`
    - In `app/student/page.tsx`, update the `PendingTasksSection` function signature to accept `pastMeetings: Meeting[]` as a new prop
    - Add `pastMeetings: Meeting[]` to the destructured parameter list
    - Add `pastMeetings: Meeting[];` to the inline props type annotation
    - _Bug_Condition: isBugCondition(topic, pastMeetings) — topic.isUnlocked AND topic.id NOT IN joinedPastTopicIds_
    - _Expected_Behavior: quiz card rendered only when joinedPastTopicIds.has(topic.id) is true_
    - _Preservation: assessment cards, score/attempt dismissal logic, click handlers unchanged_
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.2 Build `joinedPastTopicIds` Set inside `PendingTasksSection`
    - Add the following block at the top of the `PendingTasksSection` function body, before the `pendingQuizzes` loop:
      ```ts
      const allTopics = modules.flatMap((m: any) => m.topics as Topic[]);
      const joinedPastTopicIds = new Set<number>(
        pastMeetings
          .filter(m => m.meeting_students?.[0]?.has_joined === true)
          .map(m => allTopics[m.globalIndex % allTopics.length]?.id)
          .filter((id): id is number => id !== undefined)
      );
      ```
    - This mirrors the same `globalIndex % allTopics.length` mapping already used in `StudentMeetingCard`
    - _Bug_Condition: joinedPastTopicIds is empty when pastMeetings is empty or all has_joined=false_
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Add join-check guard inside the pending-quiz loop
    - Inside the `for (const topic of (mod.topics || []))` loop, immediately after the existing guard:
      `if (!topic.isUnlocked || !topicQuiz) continue;`
      add the new guard on the next line:
      `if (!joinedPastTopicIds.has(topic.id)) continue;`
    - No other changes to the loop body (score/attempt dismissal, origin detection, card push)
    - _Bug_Condition: without this guard, any unlocked topic with a quiz passes through_
    - _Expected_Behavior: only topics in joinedPastTopicIds are added to pendingQuizzes_
    - _Preservation: all subsequent loop logic (origin badge, attemptsUsed, isPassed) is unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

  - [ ] 3.4 Pass `pastMeetings` at the call-site in `StudentDashboard`
    - In the `activeTab === "jadwal"` JSX block, update the `<PendingTasksSection ... />` element to add the new prop:
      `pastMeetings={data.pastMeetings || []}`
    - No other changes to the call-site
    - _Requirements: 2.1_

  - [ ] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Unlocked Topic Without Joined Past Meeting Shows Quiz Card
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - Run `npx vitest --run` and confirm the Property 1 test now passes
    - **EXPECTED OUTCOME**: Test PASSES (confirms the bug is fixed — unlocked-but-never-attended topics no longer produce quiz cards)
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Correctly-Attended Topics Still Produce Quiz Cards
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run `npx vitest --run` and confirm all Property 2 tests still pass
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in join-mapping, dismissal logic, or absent-meeting exclusion)

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run `npx vitest --run` one final time
  - Confirm the full test suite passes with zero failures
  - Ask the user if any questions arise before closing
