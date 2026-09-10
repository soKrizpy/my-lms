# Implementation Plan: Module Assessment (Tryout)

## Overview

Implements a module-level multiple-choice assessment ("Tryout") for the Bits2Bytes LMS. Admins author assessments inside the existing `/admin/modules/[id]/...` hierarchy; students take the assessment in a modal after completing all published topics in a module, with up to 2 attempts. Results are persisted and displayed on the student dashboard.

Implementation follows this dependency order: database schema → pure lib utilities → property-based + unit tests → admin server actions → admin UI → student API routes → dashboard extension → student UI → integration into existing components → integration + UI tests.

---

## Tasks

- [x] 1. Database migration — new tables and RLS
  - [x] 1.1 Create Supabase migration file `supabase/migrations/20250607_001_module_assessments.sql`
    - Write `CREATE TABLE IF NOT EXISTS` statements for `module_assessments`, `module_assessment_questions`, and `module_assessment_attempts` exactly as specified in the design's "Migration file" section
    - Include the `DO $$ BEGIN … END$$` guard blocks for unique constraints (`module_assessments_module_id_unique`, `module_assessment_attempts_unique`)
    - Enable RLS on all three tables and create `lms_service_role_all` policies scoped to `service_role`
    - _Requirements: 1.1, 9.1, 9.3_

- [x] 2. Pure lib utilities — types, scoring, validation, helpers, module completion
  - [x] 2.1 Add assessment TypeScript types to `lib/lmsData.ts`
    - Append `AssessmentRecord`, `AssessmentQuestionRecord`, `AssessmentQuestionPublic`, `AssessmentAttemptRecord`, `AssessmentSummary`, `AttemptScore`, `QuestionResult`, `AssessmentSubmitResult`, and `AssessmentState` union exactly as listed in the design's "Data Models" section
    - _Requirements: 1.1, 2.1, 4.3, 5.2, 6.1_

  - [x] 2.2 Add assessment data-access helpers to `lib/lmsData.ts`
    - `getAssessmentByModuleId(moduleId: number)` — select from `module_assessments` where `module_id = moduleId` using `getSupabaseAdmin()`, return `AssessmentRecord | null`
    - `getAssessmentQuestions(assessmentId: number)` — select all columns including `correct_option` from `module_assessment_questions` ordered by `order_index ASC`
    - `getAssessmentAttempts(studentId: string, assessmentId: number)` — select all columns from `module_assessment_attempts` for the given `(student_id, assessment_id)` pair ordered by `attempt_number ASC`
    - `getAssessmentSummariesForStudent(studentId: string, assessmentIds: number[])` — returns `AssessmentSummary[]` (attempt_count + best_score per assessment_id) by aggregating from `module_assessment_attempts`
    - _Requirements: 1.3, 4.1, 5.1, 6.1_

  - [x] 2.3 Create `lib/assessmentScoring.ts` with three pure functions
    - `computeScore(correctCount: number, totalQuestions: number): number` — returns `Math.round((correctCount / totalQuestions) * 100)`; input: both args integers, `totalQuestions > 0`
    - `computeBestScore(existingBest: number, newScore: number): number` — returns `Math.max(existingBest, newScore)`
    - `buildQuestionResults(answers: Record<string, 'A'|'B'|'C'|'D'>, questions: Array<{ id: number; question_text: string; correct_option: 'A'|'B'|'C'|'D' }>): QuestionResult[]` — maps each question to `{ question_id, question_text, selected_option, correct_option, is_correct }` where `is_correct = selected_option === correct_option`
    - Import `QuestionResult` from `lib/lmsData.ts`
    - _Requirements: 4.3, 4.4, 4.6_

  - [x] 2.4 Create `lib/assessmentValidation.ts` with two pure validation functions
    - `validateAssessmentTitle(title: string): { valid: true } | { valid: false; error: string }` — trims input; returns error if blank or longer than 255 characters
    - `validateQuestionInput(input: { question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string }): { valid: true } | { valid: false; errors: Record<string, string> }` — validates field lengths (question 1–500, options 1–200), all four options distinct, correct_option ∈ {A,B,C,D}
    - _Requirements: 1.4, 1.7, 2.1, 2.3, 2.4, 2.6_

  - [x] 2.5 Create `lib/assessmentHelpers.ts` with three pure helper functions
    - `getAssessmentActionLabel(attemptCount: 0 | 1): string` — returns `'Mulai Tryout'` when 0, `'Ulangi Tryout'` when 1
    - `formatAttemptLabel(attemptCount: 0 | 1): string` — returns `'Percobaan ${attemptCount + 1} dari 2'`
    - `sortStudentResults<T extends { attempt_count: number; best_score: number }>(results: T[]): T[]` — returns a new array: students with `attempt_count > 0` first, within each group sorted by `best_score` descending; does not mutate input
    - _Requirements: 5.2, 5.5, 7.3_

  - [x] 2.6 Create `lib/moduleCompletion.ts`
    - Export `isModuleComplete(publishedTopicCount: number, completedTopicCount: number): boolean` — returns `publishedTopicCount > 0 && completedTopicCount === publishedTopicCount`
    - Export async `resolveModuleCompletionMap(studentId: string, moduleIds: number[]): Promise<Map<number, ModuleCompletionResult>>` exactly as specified in the design's "Module Completion Logic" section — queries `topics` (status = 'published') and `topic_progress` (non-null `completed_at`) via `getSupabaseAdmin()`; on any error returns empty Map
    - Export `ModuleCompletionResult` interface
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Property-based and unit tests for pure functions
  - [x] 3.1 Create `lib/__tests__/assessmentScoring.test.ts`
    - **Property 5: Score computation correctness** — use `fc.integer({min:1,max:20}).chain(total => fc.integer({min:0,max:total}).map(correct => ({correct,total})))`, assert `computeScore(correct,total) === Math.round((correct/total)*100)` and result ∈ [0,100]; 100 runs
    - **Property 6: Best score is running maximum** — use two `fc.integer({min:0,max:100})` arbitraries `s1,s2`, assert `computeBestScore(s1,s2) === Math.max(s1,s2)`; 100 runs
    - **Property 7: Question results reflect correctness accurately** — generate arbitrary answers and correct-option maps for 1–20 questions, assert every item in `buildQuestionResults(...)` has `is_correct = (selected === correct)` and `correct_option` is present on every item where `is_correct === false`; 100 runs
    - _Requirements: 4.3, 4.4, 4.6_

  - [ ]* 3.2 Create `lib/__tests__/assessmentValidation.test.ts`
    - **Property 1: Blank titles rejected** — `fc.stringMatching(/^\s*$/)`, assert `validateAssessmentTitle(s).valid === false`
    - **Property 2: Over-length titles rejected** — `fc.string({minLength:256,maxLength:512})` (no leading/trailing space), assert `validateAssessmentTitle(s).valid === false`
    - **Property 3a: Valid question input accepted** — generate all fields within length bounds + all four options distinct + correct_option ∈ {A,B,C,D}, assert `validateQuestionInput(input).valid === true`; 100 runs
    - **Property 3b: Invalid question input rejected** — at least one field blank or over-limit or two options identical, assert `validateQuestionInput(input).valid === false`; 100 runs
    - _Requirements: 1.4, 1.7, 2.1, 2.3, 2.4, 2.6_

  - [ ]* 3.3 Create `lib/__tests__/assessmentHelpers.test.ts`
    - **Property 9a:** `getAssessmentActionLabel(0) === 'Mulai Tryout'` and `getAssessmentActionLabel(1) === 'Ulangi Tryout'`
    - **Property 9b:** `formatAttemptLabel(0) === 'Percobaan 1 dari 2'` and `formatAttemptLabel(1) === 'Percobaan 2 dari 2'`
    - **Property 12:** generate heterogeneous result arrays, assert `sortStudentResults` always places `attempt_count > 0` entries before `attempt_count === 0` entries, and within each group entries are in non-increasing `best_score` order; assert input array is not mutated; 100 runs
    - _Requirements: 5.2, 5.5, 7.3_

  - [ ]* 3.4 Create `lib/__tests__/moduleCompletion.test.ts`
    - **Property 4a:** `fc.integer({min:1,max:50}).chain(n => fc.integer({min:0,max:n-1}).map(m => ({n,m})))`, assert `isModuleComplete(n,m) === false`
    - **Property 4b:** `fc.integer({min:1,max:50}).map(n => ({n}))`, assert `isModuleComplete(n,n) === true`
    - **Property 4c:** assert `isModuleComplete(0,0) === false`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Admin server actions
  - [x] 4.1 Create `app/admin/modules/[id]/assessment/actions.ts`
    - Implement `createAssessmentAction(formData: FormData): Promise<ActionResult>` — trim and validate title via `validateAssessmentTitle`; call `getSupabaseAdmin()` to insert into `module_assessments`; call `revalidatePath('/admin/modules/[id]/assessment')`; map unique-constraint violation to `{ error: 'Modul ini sudah memiliki assessment.' }`
    - Implement `updateAssessmentAction(formData: FormData): Promise<ActionResult>` — validate title; update `module_assessments` by id; revalidate path
    - Implement `deleteAssessmentAction(formData: FormData): Promise<ActionResult>` — delete assessment by id (cascade handles questions + attempts); revalidate path
    - Implement `addQuestionAction(formData: FormData): Promise<ActionResult>` — validate via `validateQuestionInput`; check current count < 20 (return `{ error: 'Batas 20 soal tercapai.' }` if at limit); compute `order_index = MAX(order_index)+1` within the assessment (default 0); insert into `module_assessment_questions`; revalidate path
    - Implement `updateQuestionAction(formData: FormData): Promise<ActionResult>` — validate via `validateQuestionInput`; update record by id; revalidate path
    - Implement `deleteQuestionAction(formData: FormData): Promise<ActionResult>` — delete record by id; revalidate path
    - All actions: `'use server'`; return `{ success: true }` or `{ error: string }`
    - _Requirements: 1.2, 1.4, 1.5, 1.6, 1.7, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9_

- [x] 5. Admin UI components and page
  - [x] 5.1 Create `app/admin/modules/[id]/assessment/page.tsx` (Server Component)
    - Parse and validate `params.id` (redirect to 404 if missing or non-integer) using the same pattern as `app/admin/modules/[id]/topics/page.tsx`
    - Fetch module with `getModuleById`; return 404 if null
    - Fetch assessment with `getAssessmentByModuleId`
    - If no assessment: render `<CreateAssessmentForm moduleId={...} />`
    - If assessment exists: render `<AssessmentHeader>`, `<QuestionCountBadge count={...} />` (warning if < 10), `<AssessmentQuestionList questions={...} assessmentId={...} />`, and `<AddAssessmentQuestionForm assessmentId={...} disabled={count >= 20} />`
    - _Requirements: 1.3, 8.1, 8.2, 8.4, 8.5_

  - [x] 5.2 Create `app/admin/modules/[id]/assessment/CreateAssessmentForm.tsx` (Client Component)
    - Form with a single title text input and submit button
    - Calls `createAssessmentAction`; displays inline error on failure
    - Shows loading state during submission
    - _Requirements: 1.2, 1.4, 1.7_

  - [x] 5.3 Create `app/admin/modules/[id]/assessment/AddAssessmentQuestionForm.tsx` (Client Component)
    - Fields: `question_text` (textarea), `option_a` through `option_d` (text inputs), `correct_option` (radio group A/B/C/D)
    - Disabled entirely when `props.disabled === true`; shows "Batas 20 soal tercapai" message when disabled
    - Calls `addQuestionAction`; displays field-level validation errors returned from the action
    - Resets form to blank state on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.9_

  - [x] 5.4 Create `app/admin/modules/[id]/assessment/AssessmentQuestionList.tsx` (Client Component)
    - Renders list of questions each showing question text, options A–D, correct-option badge, and Edit/Delete controls
    - "Edit" opens `<EditQuestionModal />`; "Delete" submits `deleteQuestionAction`
    - Displays current question count badge: green if ≥ 10, amber if < 10
    - _Requirements: 2.5, 2.7, 2.8, 7.5_

  - [x] 5.5 Create `app/admin/modules/[id]/assessment/EditQuestionModal.tsx` (Client Component)
    - Modal pre-populated with existing question data
    - Same field layout as `AddAssessmentQuestionForm`
    - Calls `updateQuestionAction` on submit; shows field-level errors on failure
    - Closes modal on success
    - _Requirements: 2.5, 2.6_

- [x] 6. Student API routes — assessment fetch and submit
  - [x] 6.1 Create `app/api/student/assessment/route.ts` — `GET /api/student/assessment`
    - Authenticate via `createClient()` → 401 if no user
    - Read `assessmentId` from query params → 400 if missing
    - Fetch assessment record → 404 if not found
    - Verify student is enrolled in the module (check `student_modules`) → 403 if not
    - Call `resolveModuleCompletionMap(studentId, [moduleId])` → 403 with `'Selesaikan semua topik terlebih dahulu'` if not complete
    - Check `getAssessmentAttempts` count < 2 → 403 if exhausted
    - Return `AssessmentQuestionPublic[]` (omit `correct_option`) ordered by `order_index ASC`
    - _Requirements: 3.2, 4.1, 5.1, 5.4_

  - [x] 6.2 Create `app/api/student/assessment/submit/route.ts` — `POST /api/student/assessment/submit`
    - Authenticate → 401 if no user
    - Parse `{ assessmentId, answers }` → 400 if missing
    - Fetch assessment → 404 if not found
    - Verify enrollment → 403 if not enrolled
    - Call `resolveModuleCompletionMap` → 403 if module not complete
    - Fetch existing attempts; if count ≥ 2 → 400 `'Batas percobaan tercapai'`
    - Fetch questions with `correct_option`; validate all question IDs answered → 400 if any missing
    - Call `computeScore`, `computeBestScore`; compute `attempt_number = existing_count + 1`
    - Insert `module_assessment_attempts` row with `answers` JSONB; on DB error → 500 with `{ error, score, best_score, answers }` for client retry
    - Call `buildQuestionResults`; return `AssessmentSubmitResult` (200)
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.4, 5.6, 9.1, 9.3, 9.4_

- [x] 7. Dashboard API extension — assessment summaries
  - [x] 7.1 Extend `app/api/student/dashboard/route.ts` to include `assessmentSummaries`
    - After the existing `moduleIds` array is built, call `resolveModuleCompletionMap(studentId, moduleIds)` (store result; this replaces the inline `isModuleComplete` calculation currently derived from `unlockedCount`)
    - Fetch `module_assessments` for all enrolled `moduleIds`
    - Call `getAssessmentSummariesForStudent(studentId, assessmentIds)` to get per-assessment attempt_count and best_score
    - Build `assessmentSummaries: AssessmentSummary[]` — one entry per module that has an assessment; default to `{ assessment_id, attempt_count: 0, best_score: 0 }` for modules with no attempts
    - Add `assessmentSummaries` to `responsePayload`; on any error default to `[]` and continue (graceful degradation matching existing route pattern)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 8. Student UI components
  - [x] 8.1 Create `components/quest-map/AssessmentNode.tsx` (Client Component)
    - Props: `assessmentState: AssessmentState`, `onOpen: () => void`
    - Locked state: greyed node with `🔒` icon and "Terkunci" pill — non-interactive; mirrors locked styling from `TopicNode`
    - `available` state (0 attempts): teal/sky node; action label from `getAssessmentActionLabel(0)` = "Mulai Tryout"
    - `available` state (1 attempt): amber node; action label from `getAssessmentActionLabel(1)` = "Ulangi Tryout"; small previous-score chip below
    - `exhausted` state: emerald node; displays `best_score` and both attempt scores; no action button
    - `no_assessment` state: render nothing (null)
    - Accessibility: `aria-label` on the button reflecting state and title
    - _Requirements: 3.1, 3.2, 5.2, 5.3, 5.5, 6.3, 6.4, 6.5, 6.8_

  - [x] 8.2 Create `components/assessment/AssessmentForm.tsx` (Client Component)
    - Props: `questions: AssessmentQuestionPublic[]`, `onSubmit: (answers: Record<string, 'A'|'B'|'C'|'D'>) => Promise<void>`, `isSubmitting: boolean`
    - Tracks answer selection in local state `Record<questionId, option>`
    - Renders each question with radio-group for A/B/C/D options using accessible `<fieldset>` + `<legend>`
    - Submit button disabled until every question has a selection or `isSubmitting === true`; shows "Mengirim..." during submit
    - _Requirements: 4.1, 4.2, 4.8_

  - [x] 8.3 Create `components/assessment/AssessmentResultScreen.tsx` (Client Component)
    - Props: `result: AssessmentSubmitResult`, `attemptCount: 1 | 2`, `onClose: () => void`
    - Shows `score` as integer `%`, `best_score` as integer `%`
    - Shows `formatAttemptLabel(attemptCount - 1)` or "Semua percobaan habis" when `attemptCount === 2`
    - Per-question table: question text, student's selected option, ✓/✗ indicator, correct answer shown only when `is_correct === false`
    - Close / "Kembali ke Dashboard" button
    - _Requirements: 4.5, 4.6, 5.3, 5.5_

  - [x] 8.4 Create `components/assessment/AssessmentModal.tsx` (Client Component)
    - Props: `assessmentId: number`, `assessmentTitle: string`, `attemptCount: 0 | 1`, `onClose: () => void`, `onSuccess: () => void`
    - Phase state machine: `'loading' | 'taking' | 'result'`
    - `loading` phase: fetch `GET /api/student/assessment?assessmentId=...`; show skeleton; on error show friendly message with retry; transition to `taking` on success
    - `taking` phase: render `<AssessmentForm>`; on submit call `POST /api/student/assessment/submit`; on 500 error keep in `taking` phase and show retry error preserving all selected answers; on success transition to `result`
    - `result` phase: render `<AssessmentResultScreen>`; on close call `onSuccess()` then `onClose()`
    - Prevents duplicate submissions: disables submit during in-flight POST
    - _Requirements: 4.2, 4.5, 4.6, 4.7, 4.8_

- [x] 9. Integration into existing components
  - [x] 9.1 Extend `components/quest-map/ModulePathSection.tsx` to append `AssessmentNode`
    - Add `assessmentState: AssessmentState` and `onOpenAssessment: () => void` to `ModulePathSectionProps`
    - After the last topic node row (both mobile and desktop layouts), add a connector line followed by `<AssessmentNode assessmentState={assessmentState} onOpen={onOpenAssessment} />`
    - Connector uses the same `var(--accent)` style as existing topic connectors
    - When `assessmentState.status === 'no_assessment'` render nothing (the node handles this)
    - _Requirements: 3.1, 3.2, 5.2, 5.3_

  - [x] 9.2 Extend `app/student/page.tsx` (or equivalent QuestMap parent component) to wire `AssessmentModal`
    - Read `assessmentSummaries` from dashboard response and derive `AssessmentState` per module using `assessmentSummaries` + `module.isModuleComplete`
    - Pass `assessmentState` and `onOpenAssessment` to each `<ModulePathSection>`
    - Maintain `activeAssessment: { assessmentId: number; title: string; attemptCount: 0|1 } | null` state
    - Render `<AssessmentModal>` when `activeAssessment !== null`; on `onSuccess` re-fetch dashboard data; on `onClose` clear `activeAssessment`
    - _Requirements: 3.5, 4.5, 6.1, 6.3, 6.4, 6.5_

  - [x] 9.3 Add assessment navigation link to `app/admin/modules/[id]/topics/page.tsx`
    - Add `<Link href={`/admin/modules/${moduleIdParam}/assessment`}>📋 Kelola Tryout</Link>` in the page heading section, consistent with existing layout structure
    - _Requirements: 8.3_

- [x] 10. Checkpoint — ensure all tests pass
  - Ensure all tests pass (`npm test`). Ask the user if questions arise.

- [x] 11. Integration and UI tests
  - [x] 11.1 Create `app/api/__tests__/assessmentSubmit.test.ts` — integration tests for submit route
    - Example test: POST with 2 existing attempts → 400 with error body; assert no third row inserted (mock Supabase admin client)
    - Example test: POST with valid body and 0 existing attempts → 200 with `AssessmentSubmitResult` shape; assert `attempt_number === 1`
    - Example test: POST with missing answer for one question → 400
    - _Requirements: 5.1, 5.4, 9.1_

  - [ ]* 11.2 Create `app/api/__tests__/assessmentAnswersRoundTrip.test.ts`
    - **Property 10: Answers round-trip integrity** — generate arbitrary valid answer maps, simulate insert + select cycle via mocked Supabase, assert returned `answers` JSONB is structurally equal to submitted map
    - _Requirements: 9.4_

  - [ ]* 11.3 Create `app/api/__tests__/dashboardAssessmentSummaries.test.ts`
    - **Property 11: Enrolled-student result isolation** — mock `student_modules` to exclude a given module; assert `assessmentSummaries` in response contains no entry for that module's assessment_id
    - _Requirements: 6.6_

  - [ ]* 11.4 Create UI tests in `components/__tests__/AssessmentNode.test.tsx`
    - `AssessmentNode` renders locked state (🔒 visible, no interactive button) when `status === 'locked'`
    - `AssessmentNode` renders "Mulai Tryout" button when `status === 'available'` and `attempt_count === 0`
    - `AssessmentNode` renders "Ulangi Tryout" button when `status === 'available'` and `attempt_count === 1`
    - `AssessmentNode` renders no action button when `status === 'exhausted'`
    - _Requirements: 3.1, 5.2, 5.3_

  - [ ]* 11.5 Create UI tests in `components/__tests__/AssessmentForm.test.tsx`
    - Submit button disabled when any question has no selection
    - Submit button enabled only when all questions have a selection
    - _Requirements: 4.2_

  - [ ]* 11.6 Create UI tests in `components/__tests__/AssessmentResultScreen.test.tsx`
    - Shows correct answer for wrong selections
    - Does not show correct answer when selection is correct
    - _Requirements: 4.6_

  - [ ]* 11.7 Create admin UI tests in `app/admin/__tests__/AddAssessmentQuestionForm.test.tsx`
    - Form disabled when `disabled === true`; disabling message visible
    - Field-level errors displayed when action returns errors
    - _Requirements: 2.9_

- [x] 12. Final checkpoint — ensure all tests pass
  - Ensure all tests pass (`npm test`). Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery
- Each task references specific requirements for full traceability
- The design's `Correctness Properties` section maps 1-to-1 to PBT sub-tasks in phase 3 and 11
- `fast-check` is already installed (`^4.9.0`); no additional test dependencies required
- `lib/moduleCompletion.ts` must be implemented before tasks 6, 7, and 9 — its `resolveModuleCompletionMap` function is the shared eligibility gate
- All admin server actions are `'use server'`; never called directly from API routes
- The dashboard route extension (task 7.1) extends — not replaces — the existing `isModuleComplete` calculation already present in that route; the new `resolveModuleCompletionMap` call supplements it for assessment unlocking
- Migration must be applied to Supabase (via Dashboard > SQL Editor) before any runtime code can execute; tasks 6 and 7 depend on the tables existing

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "3.4", "4.1"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "6.1", "6.2", "7.1"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 6, "tasks": ["8.4"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 8, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5", "11.6", "11.7"] }
  ]
}
```
