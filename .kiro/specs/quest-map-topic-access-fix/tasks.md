# Implementation Plan

- [ ] 0. Fix admin publish button — allow publishing topics without lesson_content
  - In `app/admin/modules/[id]/topics/TopicList.tsx`, the Publish/Unpublish button is only rendered when `Boolean(topic.lesson_content)` is truthy. This means manually-created topics (with a description but no lesson_content) can never be published from the admin, so students always see them as "⏳ Segera" or they fall into the modal.
  - Remove the `Boolean(topic.lesson_content)` gate on the publish form. All topics should be publishable regardless of whether lesson_content is set — the admin just needs to be able to set status = 'published'.
  - Also update the status badge logic in the same component: currently it only shows the Published/Draft badge when `topic.engine_topic_id` is set. Change it to show for ALL topics (engine-linked or manual).
  - BEFORE (publish form gate):
    ```tsx
    {Boolean(topic.lesson_content) && (
      <form action={...}>
    ```
  - AFTER (always show publish button):
    ```tsx
    <form action={...}>
    ```
  - BEFORE (status badge):
    ```tsx
    {topic.engine_topic_id && (
      <div className="flex items-center gap-1 mt-1 flex-wrap">
        <span>🔗 {topic.engine_topic_id}</span>
        {topic.lesson_content ? (
          <span ...>{topic.status === 'published' ? '✅ Published' : '⚠️ Draft'}</span>
        ) : (
          <span ...>belum ada konten</span>
        )}
      </div>
    )}
    ```
  - AFTER (show status for all topics, engine badge only when applicable):
    ```tsx
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {topic.engine_topic_id && (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <span>🔗</span>
          <code className="font-mono">{topic.engine_topic_id}</code>
        </span>
      )}
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
        topic.status === 'published'
          ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-green-300 dark:border-green-800'
          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      }`}>
        {topic.status === 'published'
          ? `✅ Published${topic.published_at ? ` · ${new Date(topic.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : ''}`
          : '⚠️ Draft — belum terlihat siswa'}
      </span>
    </div>
    ```
  - _Requirements: Admin can publish any topic regardless of content type_

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - LMS-Authored Published Topic canStartEngine
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case: `{ engine_topic_id: null, lesson_content: { nodes: [] }, status: 'published', isUnlocked: true }` with varying `topic.id` values
  - In `components/quest-map/learningFlow.test.ts`, add a test block that evaluates the `canStartEngine` expression directly against topics where `isBugCondition` returns true
  - Bug Condition from design: `topic.engine_topic_id = null AND topic.lesson_content ≠ null AND topic.status = 'published' AND topic.isUnlocked = true`
  - Assert that `canStartEngine` evaluates to `true` for these inputs (will FAIL on unfixed code because `engine_topic_id !== null` short-circuits to false)
  - Also assert the "⏳ Segera" badge condition: `(engine_topic_id || lesson_content != null)` — test with `{ engine_topic_id: null, lesson_content: {...}, status: 'draft', isUnlocked: true }` and assert the badge condition is truthy (will FAIL on unfixed code)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists)
  - Document counterexamples found (e.g., `canStartEngine` returns `false` for published LMS-authored topic; badge condition returns `false` for draft LMS-authored topic)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Buggy Topic Inputs Produce Identical canStartEngine Results
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for all inputs where `isBugCondition` returns false (i.e. `NOT (engine_topic_id = null AND lesson_content ≠ null AND status = 'published' AND isUnlocked = true)`)
  - In `components/quest-map/learningFlow.test.ts`, add a property-based test block covering all four combinations of the non-buggy input space: `engine_topic_id` (null/non-null) × `lesson_content` (null/non-null) × `status` ('published'/'draft') × `state` ('locked'/'unlocked'/'active'/'completed') — excluding the bug condition quadrant
  - Observe and record: engine-only published topic → `canStartEngine = true`; engine-only draft topic → `canStartEngine = false`; manual topic (both null) → `canStartEngine = false`; locked topic (any fields) → `canStartEngine = false`
  - Write property-based assertions capturing these observed results from Preservation Requirements in design (3.1–3.5)
  - Also test the "⏳ Segera" badge condition for preservation: `{ engine_topic_id: 'x', lesson_content: null, status: 'draft', isUnlocked: true }` → badge condition truthy; `{ engine_topic_id: null, lesson_content: null }` → badge condition falsy
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix topic access routing for LMS-authored topics

  - [ ] 3.1 Relax the `canStartEngine` guard in `components/quest-map/TopicNode.tsx`
    - Locate the `canStartEngine` constant in `TopicNodeInner` (around line 110)
    - Change `topic.engine_topic_id !== null` (exclusive) to `(topic.engine_topic_id !== null || topic.lesson_content != null)` (inclusive OR)
    - Full replacement — BEFORE:
      ```ts
      const canStartEngine =
        state !== 'locked' &&
        topic.engine_topic_id !== null &&
        (topic.status === 'published' || topic.lesson_content == null);
      ```
    - Full replacement — AFTER:
      ```ts
      const canStartEngine =
        state !== 'locked' &&
        (topic.engine_topic_id !== null || topic.lesson_content != null) &&
        (topic.status === 'published' || topic.lesson_content == null);
      ```
    - The third line (`topic.status === 'published' || topic.lesson_content == null`) is intentionally unchanged — it correctly gates unpublished LMS-authored topics to `false`
    - _Bug_Condition: isBugCondition(topic) where engine_topic_id = null AND lesson_content ≠ null AND status = 'published' AND isUnlocked = true_
    - _Expected_Behavior: canStartEngine evaluates to true, node click calls onStartLesson(String(topic.id)), routing to /student/lesson/[topic.id]_
    - _Preservation: All inputs where isBugCondition returns false must produce the same canStartEngine result as before the fix_
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.2 Extend the "⏳ Segera" badge condition in `components/quest-map/TopicNode.tsx`
    - Locate the "⏳ Segera" badge JSX (around line 215)
    - Change the gate from `topic.engine_topic_id` (exclusive) to `(topic.engine_topic_id || topic.lesson_content != null)` (inclusive OR)
    - Full replacement — BEFORE:
      ```tsx
      {topic.engine_topic_id && !canStartEngine && state !== 'locked' && (
      ```
    - Full replacement — AFTER:
      ```tsx
      {(topic.engine_topic_id || topic.lesson_content != null) && !canStartEngine && state !== 'locked' && (
      ```
    - _Bug_Condition: isBugCondition with status != 'published' — badge was not showing for unpublished LMS-authored topics_
    - _Expected_Behavior: "⏳ Segera" badge renders for topics where lesson_content is set but status is not 'published'_
    - _Preservation: Engine-only topics still show the badge under the same conditions as before_
    - _Requirements: 2.3, 3.2_

  - [ ] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - LMS-Authored Published Topic canStartEngine
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior: `canStartEngine = true` for `isBugCondition` inputs
    - When this test passes, it confirms the fixed expression correctly routes published LMS-authored topics to the lesson player
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Buggy Topic Inputs Produce Identical canStartEngine Results
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions for engine-linked topics, manual topics, locked topics, and draft topics)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite: `npx vitest --run components/quest-map/learningFlow.test.ts`
  - Ensure all tests pass; ask the user if questions arise
  - Confirm the two changed expressions in `components/quest-map/TopicNode.tsx` match the design exactly

- [ ] 5. Fix admin publish for topics without lesson_content — also fix for quizzes and assessments visibility
  - In `app/admin/modules/[id]/topics/actions.ts`, the `publishTopicAction` already works for any topic (no content gate). No change needed there.
  - In `app/admin/modules/[id]/topics/TopicList.tsx`:
    - Remove the `Boolean(topic.lesson_content)` wrapper around the publish form so ALL topics can be published
    - Update the status badge to show for all topics (not just engine-linked ones)
  - Quiz visibility: In the quiz tab of `app/admin/modules/[id]/topics/page.tsx`, show the topic's publish status badge next to each quiz link so admins can see at a glance which topics/quizzes are published
  - Assessment visibility: In the assessment tab, the question count warning (`< 10 soal`) is already correct. No change needed.
  - _Requirements: Admin publish parity across all topic types_
