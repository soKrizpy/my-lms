# Design Document: Module Assessment (Tryout)

## Overview

The Module Assessment (Tryout) feature adds a module-level final multiple-choice test to the Bits2Bytes LMS. Each module has exactly one assessment, authored by an admin through the existing LMS admin panel. A student may attempt the assessment up to 2 times, but only after completing every published topic in the module. Results — attempt scores and best score — are persisted per student per module and surfaced on the student dashboard.

### Design goals

- Zero friction for admins: authoring fits inside the existing `/admin/modules/[id]/...` routing hierarchy.
- No new lesson engine involvement: the assessment UI is built inside the LMS, not inside the engine iframe.
- Consistent data patterns: new tables mirror the shape of `quizzes`/`quiz_questions`/`quiz_attempts`.
- Safe for partial rollout: a module without an assessment record simply has no tryout entry point; nothing breaks.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  Admin UI (React Server Components + Server Actions)                 │
│  /admin/modules/[id]/assessment/page.tsx                             │
│  /admin/modules/[id]/assessment/actions.ts                           │
└─────────────────────┬────────────────────────────────────────────────┘
                      │ Server Actions (revalidatePath)
┌─────────────────────▼────────────────────────────────────────────────┐
│  Data access layer  lib/lmsData.ts  (assessment helpers)             │
│  lib/moduleCompletion.ts  (isModuleComplete, resolveAssessmentState) │
└─────────────────────┬────────────────────────────────────────────────┘
                      │ getSupabaseAdmin()  service-role
┌─────────────────────▼────────────────────────────────────────────────┐
│  Supabase Postgres                                                    │
│  module_assessments · module_assessment_questions                    │
│  module_assessment_attempts                                          │
└───────────────────────────────────────────────────────────────────────┘
                      ▲
┌─────────────────────┴────────────────────────────────────────────────┐
│  Student API layer                                                    │
│  GET  /api/student/dashboard  (extended with assessment summaries)   │
│  GET  /api/student/assessment?assessmentId=…  (fetch questions)      │
│  POST /api/student/assessment/submit  (submit attempt)               │
└─────────────────────┬────────────────────────────────────────────────┘
                      │ auth via createClient() (user JWT)
┌─────────────────────▼────────────────────────────────────────────────┐
│  Student UI  app/student/page.tsx  (extended)                        │
│  components/quest-map/AssessmentNode.tsx  (entry point node)         │
│  components/assessment/AssessmentModal.tsx  (take / view results)    │
└──────────────────────────────────────────────────────────────────────┘
```

### Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| Student UI: full page vs modal | **Modal** | Consistent with the existing `TopicLearningFlowModal` / `QuizModal` pattern; no navigation away from the dashboard. |
| Assessment entry point | **AssessmentNode** appended to `ModulePathSection` after all topic nodes | Natural end-of-module position; reuses the existing zigzag node layout. |
| Module completion check location | **New `lib/moduleCompletion.ts`** | Keeps `topicUnlock.ts` focused on topic-level unlock; module-level completion is a different concern. |
| `best_score` storage | **Column on `module_assessment_attempts`** (updated on each insert) | Mirrors `quiz_attempts.score` which already stores the running best. Avoids a view/function dependency. |
| Question order | **`order_index` column on `module_assessment_questions`**, set at insert time (auto-incrementing within the assessment) | Stable and deterministic across attempts; no shuffle required. |

---

## Database Schema

### New tables

#### `module_assessments`

One row per module. Holds the assessment title only; question management is separate.

```sql
CREATE TABLE public.module_assessments (
  id          SERIAL PRIMARY KEY,
  module_id   INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT module_assessments_module_id_unique UNIQUE (module_id)
);
```

#### `module_assessment_questions`

Multiple-choice questions belonging to one assessment.

```sql
CREATE TABLE public.module_assessment_questions (
  id              SERIAL PRIMARY KEY,
  assessment_id   INTEGER NOT NULL REFERENCES public.module_assessments(id) ON DELETE CASCADE,
  question_text   TEXT    NOT NULL CHECK (char_length(question_text) BETWEEN 1 AND 500),
  option_a        TEXT    NOT NULL CHECK (char_length(option_a)  BETWEEN 1 AND 200),
  option_b        TEXT    NOT NULL CHECK (char_length(option_b)  BETWEEN 1 AND 200),
  option_c        TEXT    NOT NULL CHECK (char_length(option_c)  BETWEEN 1 AND 200),
  option_d        TEXT    NOT NULL CHECK (char_length(option_d)  BETWEEN 1 AND 200),
  correct_option  TEXT    NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `module_assessment_attempts`

One row per student per attempt (max 2). Stores the student's answers as JSONB for full auditability.

```sql
CREATE TABLE public.module_assessment_attempts (
  id              SERIAL PRIMARY KEY,
  student_id      UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id   INTEGER NOT NULL REFERENCES public.module_assessments(id) ON DELETE CASCADE,
  attempt_number  SMALLINT NOT NULL CHECK (attempt_number BETWEEN 1 AND 2),
  score           SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  best_score      SMALLINT NOT NULL CHECK (best_score BETWEEN 0 AND 100),
  total_questions SMALLINT NOT NULL,
  correct_count   SMALLINT NOT NULL,
  -- JSONB map: { "<question_id>": "A" | "B" | "C" | "D" }
  answers         JSONB   NOT NULL DEFAULT '{}',
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT module_assessment_attempts_unique
    UNIQUE (student_id, assessment_id, attempt_number)
);
```

### Migration file

`supabase/migrations/20250607_001_module_assessments.sql`

```sql
-- Migration: Module Assessment (Tryout) tables
-- Applied via: Supabase Dashboard > SQL Editor
-- Status: PENDING

-- ── New tables ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.module_assessments (
  id         SERIAL PRIMARY KEY,
  module_id  INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'module_assessments_module_id_unique'
  ) THEN
    ALTER TABLE public.module_assessments
      ADD CONSTRAINT module_assessments_module_id_unique UNIQUE (module_id);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.module_assessment_questions (
  id             SERIAL PRIMARY KEY,
  assessment_id  INTEGER NOT NULL REFERENCES public.module_assessments(id) ON DELETE CASCADE,
  question_text  TEXT    NOT NULL CHECK (char_length(question_text) BETWEEN 1 AND 500),
  option_a       TEXT    NOT NULL CHECK (char_length(option_a)  BETWEEN 1 AND 200),
  option_b       TEXT    NOT NULL CHECK (char_length(option_b)  BETWEEN 1 AND 200),
  option_c       TEXT    NOT NULL CHECK (char_length(option_c)  BETWEEN 1 AND 200),
  option_d       TEXT    NOT NULL CHECK (char_length(option_d)  BETWEEN 1 AND 200),
  correct_option TEXT    NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  order_index    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.module_assessment_attempts (
  id              SERIAL PRIMARY KEY,
  student_id      UUID     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id   INTEGER  NOT NULL REFERENCES public.module_assessments(id) ON DELETE CASCADE,
  attempt_number  SMALLINT NOT NULL CHECK (attempt_number BETWEEN 1 AND 2),
  score           SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  best_score      SMALLINT NOT NULL CHECK (best_score BETWEEN 0 AND 100),
  total_questions SMALLINT NOT NULL,
  correct_count   SMALLINT NOT NULL,
  answers         JSONB    NOT NULL DEFAULT '{}',
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'module_assessment_attempts_unique'
  ) THEN
    ALTER TABLE public.module_assessment_attempts
      ADD CONSTRAINT module_assessment_attempts_unique
        UNIQUE (student_id, assessment_id, attempt_number);
  END IF;
END$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.module_assessments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_assessment_attempts  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='module_assessments'
                 AND policyname='lms_service_role_all') THEN
    CREATE POLICY "lms_service_role_all" ON public.module_assessments
      TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='module_assessment_questions'
                 AND policyname='lms_service_role_all') THEN
    CREATE POLICY "lms_service_role_all" ON public.module_assessment_questions
      TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='module_assessment_attempts'
                 AND policyname='lms_service_role_all') THEN
    CREATE POLICY "lms_service_role_all" ON public.module_assessment_attempts
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;
```

---

## Data Models

Add to `lib/lmsData.ts`:

```typescript
// ── Module Assessment types ──────────────────────────────────────────────────

export type AssessmentRecord = {
  id: number;
  module_id: number;
  title: string;
  created_at: string;
};

export type AssessmentQuestionRecord = {
  id: number;
  assessment_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  order_index: number;
  created_at: string;
};

// Question as returned to the student (no correct_option field)
export type AssessmentQuestionPublic = Omit<AssessmentQuestionRecord, 'correct_option' | 'created_at'>;

export type AssessmentAttemptRecord = {
  id: number;
  student_id: string;
  assessment_id: number;
  attempt_number: 1 | 2;
  score: number;          // 0–100
  best_score: number;     // 0–100, MAX of all attempts for this student+assessment
  total_questions: number;
  correct_count: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;  // { "<questionId>": "A"|"B"|"C"|"D" }
  submitted_at: string;
};

// Summary included in student dashboard response
export type AssessmentSummary = {
  assessment_id: number;
  attempt_count: number;   // 0, 1, or 2
  best_score: number;      // 0–100; 0 when attempt_count === 0
};

// Single attempt score shown on results/history screen
export type AttemptScore = {
  attempt_number: 1 | 2;
  score: number;
  submitted_at: string;
};

// Per-question result shown on the result screen after submission
export type QuestionResult = {
  question_id: number;
  question_text: string;
  selected_option: 'A' | 'B' | 'C' | 'D';
  correct_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
};

// Full result returned from POST /api/student/assessment/submit
export type AssessmentSubmitResult = {
  score: number;
  best_score: number;
  attempt_number: 1 | 2;
  total_questions: number;
  correct_count: number;
  question_results: QuestionResult[];
};

// State of an assessment from the student's perspective
export type AssessmentState =
  | { status: 'locked' }                                        // module not complete
  | { status: 'no_assessment' }                                 // module has no assessment yet
  | { status: 'available'; assessment_id: number; attempt_count: 0 | 1 }
  | { status: 'exhausted'; assessment_id: number; best_score: number; attempt_scores: AttemptScore[] };
```

---

## Module Completion Logic

New file: `lib/moduleCompletion.ts`

```typescript
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
        isComplete: published.length > 0 && completed.length === published.length,
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
```

**Pure helper exported for unit testing:**

```typescript
// lib/moduleCompletion.ts (pure helper — no Supabase dependency)
export function isModuleComplete(
  publishedTopicCount: number,
  completedTopicCount: number
): boolean {
  return publishedTopicCount > 0 && completedTopicCount === publishedTopicCount;
}
```

---

## API Routes

### `GET /api/student/assessment`

Returns the questions for an assessment (without `correct_option`). Called when the modal opens.

**Query params:** `assessmentId: number`

**Auth:** user JWT via `createClient()`

**Logic:**
1. Verify the requesting student is enrolled in the module that owns this assessment.
2. Verify Module_Completion (call `resolveModuleCompletionMap`); return 403 if not complete.
3. Verify attempt count < 2; return 403 if exhausted.
4. Return `AssessmentQuestionPublic[]` ordered by `order_index ASC`.

**Response:** `AssessmentQuestionPublic[]`

---

### `POST /api/student/assessment/submit`

Submits answers for an assessment and persists the attempt.

**Body:**
```json
{
  "assessmentId": 7,
  "answers": { "42": "B", "43": "A", "44": "D" }
}
```

**Auth:** user JWT via `createClient()`

**Logic:**

```
1. Authenticate user → studentId
2. Fetch assessment record; 404 if not found
3. Verify student is enrolled in module → 403 if not
4. Verify Module_Completion → 403 "Selesaikan semua topik terlebih dahulu"
5. Load existing attempts for (studentId, assessmentId)
6. If attempt_count >= 2 → 400 "Batas percobaan tercapai"
7. Fetch questions with correct_option
8. Validate: answers must include every question id; return 400 if missing
9. Compute correct_count, score = ROUND((correct_count / total) * 100)
10. Compute attempt_number = existing_count + 1
11. Compute best_score = MAX(highest previous score, new score)
12. Insert module_assessment_attempts row
    - On DB error → 500, return {error, score, best_score, answers} so client can retry
13. Build question_results array
14. Return AssessmentSubmitResult (200)
```

**Response:** `AssessmentSubmitResult`

**Error responses:**

| Status | Condition |
|---|---|
| 400 | Missing fields, unanswered questions, attempt limit reached |
| 401 | Unauthenticated |
| 403 | Not enrolled, module not complete |
| 404 | Assessment not found |
| 500 | DB error on insert |

---

### `GET /api/student/dashboard` (extension)

Two additions to the existing handler:

1. After fetching `studentModules`, call `resolveModuleCompletionMap(studentId, moduleIds)`.
2. Fetch `module_assessments` for all enrolled module IDs.
3. Fetch `module_assessment_attempts` for this student scoped to those assessment IDs.
4. Build `AssessmentSummary[]` per module (attempt_count, best_score).
5. Attach `assessmentSummaries: AssessmentSummary[]` to the response payload.

The per-module `assessmentState` (locked / available / exhausted) is computed client-side from `AssessmentSummary` + the module's `isModuleComplete` flag that is already in the response.

---

### Admin Server Actions

File: `app/admin/modules/[id]/assessment/actions.ts`

```typescript
// "use server"

export async function createAssessmentAction(formData: FormData): Promise<ActionResult>
export async function updateAssessmentAction(formData: FormData): Promise<ActionResult>
export async function deleteAssessmentAction(formData: FormData): Promise<ActionResult>

export async function addQuestionAction(formData: FormData): Promise<ActionResult>
export async function updateQuestionAction(formData: FormData): Promise<ActionResult>
export async function deleteQuestionAction(formData: FormData): Promise<ActionResult>
```

Each action:
- Reads and trims `FormData` fields.
- Validates inputs (length limits, non-empty, distinct options, correct_option ∈ {A,B,C,D}).
- Calls `getSupabaseAdmin()` and performs the operation.
- Calls `revalidatePath('/admin/modules/[id]/assessment')` on success.
- Returns `{ success: true }` or `{ error: string }`.

`addQuestionAction` also:
- Checks the current question count for the assessment. If already at 20, returns `{ error: 'Batas 20 soal tercapai.' }`.
- Sets `order_index` = `(SELECT MAX(order_index) + 1 FROM module_assessment_questions WHERE assessment_id = ?)`, defaulting to 0.

---

## Components and Interfaces

### Admin UI

```
app/admin/modules/[id]/assessment/
├── page.tsx                         (Server Component)
│   ├── Reads moduleId from params
│   ├── Fetches module + assessment via lmsData helpers
│   ├── If no assessment → renders <CreateAssessmentForm />
│   └── If assessment exists → renders:
│       ├── <AssessmentHeader title={...} moduleTitle={...} />
│       ├── <QuestionCountBadge count={...} />   (warns if < 10)
│       ├── <AssessmentQuestionList questions={...} assessmentId={...} />
│       │   └── <AssessmentQuestionItem> × N
│       │       ├── inline display of question + options
│       │       ├── <EditQuestionModal /> (client, triggered by "Edit" button)
│       │       └── delete form (server action)
│       └── <AddAssessmentQuestionForm assessmentId={...} disabled={count >= 20} />
│
├── CreateAssessmentForm.tsx          (Client Component)
├── AddAssessmentQuestionForm.tsx     (Client Component)
├── AssessmentQuestionList.tsx        (Client Component — optimistic updates)
├── EditQuestionModal.tsx             (Client Component)
└── actions.ts                        (Server Actions)
```

Link added to: `app/admin/modules/[id]/topics/page.tsx`
```tsx
<Link href={`/admin/modules/${moduleId}/assessment`}>
  📋 Kelola Tryout
</Link>
```

### Student UI

```
components/
├── quest-map/
│   ├── ModulePathSection.tsx        (extended — appends AssessmentNode after topics)
│   └── AssessmentNode.tsx           (new Client Component)
│       ├── Props: assessmentState, onOpen
│       ├── Locked state: greyed-out node with 🔒
│       ├── Available (0 attempts): "Mulai Tryout" button
│       ├── Available (1 attempt):  "Ulangi Tryout" button + previous score chip
│       └── Exhausted (2 attempts): score display only, no button
│
└── assessment/
    ├── AssessmentModal.tsx           (new Client Component — full modal)
    │   ├── Phase: "loading"   → skeleton
    │   ├── Phase: "taking"    → AssessmentForm
    │   └── Phase: "result"    → AssessmentResultScreen
    ├── AssessmentForm.tsx            (new Client Component)
    │   ├── Renders all questions with radio groups
    │   ├── Tracks answers in local state: Record<questionId, option>
    │   ├── Disables submit until all questions answered
    │   └── Calls POST /api/student/assessment/submit on submit
    └── AssessmentResultScreen.tsx    (new Client Component)
        ├── Shows score % and best score %
        ├── Shows "Percobaan N dari 2" or "Semua percobaan habis"
        └── Per-question: selected answer, ✓/✗ indicator, correct answer if wrong
```

---

## Data Flow Diagrams

### Admin: Creating an assessment and adding questions

```
Admin
  │  navigates to /admin/modules/[id]/assessment
  ▼
page.tsx (Server)
  │  getAssessmentByModuleId(moduleId)
  │  → null
  ▼
renders <CreateAssessmentForm />
  │
  │  submits title
  ▼
createAssessmentAction(formData)
  │  validate title (non-empty, ≤255 chars)
  │  INSERT INTO module_assessments
  │  revalidatePath(...)
  ▼
page.tsx re-renders with new assessment
  │
  │  Admin adds question
  ▼
addQuestionAction(formData)
  │  validate all fields
  │  check current count < 20
  │  INSERT INTO module_assessment_questions
  │  revalidatePath(...)
  ▼
Question list refreshes (server revalidation)
```

### Student: Taking the assessment

```
Student dashboard loads
  │
  ▼
GET /api/student/dashboard
  │  resolveModuleCompletionMap(studentId, moduleIds)
  │  fetch module_assessments for enrolled modules
  │  fetch module_assessment_attempts for student
  │  build assessmentSummaries[]
  ▼
Client: QuestMap renders ModulePathSection
  │  assessmentState computed from:
  │    module.isModuleComplete + assessmentSummary
  ▼
AssessmentNode rendered (locked / available / exhausted)
  │
  │  Student clicks "Mulai Tryout"
  ▼
AssessmentModal opens (phase: "loading")
  │
  ▼
GET /api/student/assessment?assessmentId=N
  │  verify enrollment + module completion + attempt count
  ▼
AssessmentModal phase: "taking"
  │  Student selects answers
  │  Submit button enabled only when all answered
  │
  │  Student submits
  ▼
POST /api/student/assessment/submit
  │  { assessmentId, answers }
  │  verify enrollment + completion + attempt limit
  │  fetch questions with correct_option
  │  compute score
  │  INSERT module_assessment_attempts
  │  return AssessmentSubmitResult
  ▼
AssessmentModal phase: "result"
  │  Shows score, best score, per-question breakdown
  │
  ▼
onClose → parent calls onRefresh() → dashboard re-fetches
```

### Module_Completion evaluation

```
resolveModuleCompletionMap(studentId, moduleIds)
  │
  ├─ SELECT id, module_id FROM topics
  │    WHERE module_id IN (...) AND status = 'published'
  │
  └─ SELECT topic_id FROM topic_progress
       WHERE student_id = ? AND topic_id IN (...) AND completed_at IS NOT NULL
  │
  ▼
for each moduleId:
  published_count  = count of topics where module_id = moduleId
  completed_count  = count of topic_progress rows for those topic ids
  isComplete       = published_count > 0 AND completed_count == published_count
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Blank assessment titles are rejected

*For any* string composed entirely of whitespace characters (or the empty string), `createAssessmentAction` and `updateAssessmentAction` SHALL return a validation error and SHALL NOT insert or update any record.

**Validates: Requirements 1.4**

---

### Property 2: Over-length assessment titles are rejected

*For any* title string whose length exceeds 255 characters, `createAssessmentAction` SHALL return a validation error and SHALL NOT insert any record.

**Validates: Requirements 1.7**

---

### Property 3: Valid question submission succeeds; invalid question submission fails

*For any* question submission where all fields are within their character limits (question text 1–500, options 1–200), all four option texts are distinct, and `correct_option` is in {A,B,C,D}: `addQuestionAction` and `updateQuestionAction` SHALL accept the submission.

*For any* question submission where at least one required field is empty, exceeds its character limit, or two or more option texts are identical: the action SHALL return a validation error and SHALL NOT insert or update any record.

**Validates: Requirements 2.1, 2.3, 2.4, 2.6**

---

### Property 4: Module completion gate

*For any* module with N published topics (N ≥ 1) and a student with M completed topics (M < N): `isModuleComplete(N, M)` SHALL return `false`, and the assessment entry point SHALL be rendered in a locked state.

*For any* module with N published topics (N ≥ 1) and a student with exactly N completed topics: `isModuleComplete(N, N)` SHALL return `true`, and the assessment entry point SHALL be rendered in an unlocked state.

*For any* module with 0 published topics: `isModuleComplete(0, 0)` SHALL return `false`.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

---

### Property 5: Score computation correctness

*For any* set of answers (correct_count correct, total − correct_count wrong, total > 0): `computeScore(correct_count, total)` SHALL return `Math.round((correct_count / total) * 100)`, and the result SHALL always be an integer in the range 0–100 inclusive.

**Validates: Requirements 4.3**

---

### Property 6: Best score is the running maximum

*For any* sequence of attempt scores s₁, s₂ submitted by a student for the same assessment: after both attempts are persisted, `best_score` in the stored records SHALL equal `Math.max(s₁, s₂)`.

**Validates: Requirements 4.4, 6.2**

---

### Property 7: Result items reflect correctness accurately

*For any* answers map and correct_answers map, `buildQuestionResults(answers, correctAnswers)` SHALL return an array where every item has `is_correct = (selected_option === correct_option)`, and `correct_answer` is included in every item where `is_correct === false`.

**Validates: Requirements 4.6**

---

### Property 8: Attempt limit is enforced for any student

*For any* student with exactly 2 existing `module_assessment_attempts` records for a given assessment: a call to `POST /api/student/assessment/submit` SHALL return a 400-level error and SHALL NOT insert a third attempt record.

**Validates: Requirements 5.1, 5.4**

---

### Property 9: Assessment UI action label reflects attempt count

*For any* attempt count c ∈ {0, 1}: `getAssessmentActionLabel(c)` SHALL return `"Mulai Tryout"` when `c === 0` and `"Ulangi Tryout"` when `c === 1`.

*For any* attempt count c ∈ {0, 1}: `formatAttemptLabel(c)` SHALL return `"Percobaan ${c + 1} dari 2"`.

**Validates: Requirements 5.2, 5.5**

---

### Property 10: Answers round-trip integrity

*For any* valid answers map submitted to `POST /api/student/assessment/submit` and successfully persisted: a subsequent SELECT of that `module_assessment_attempts` row SHALL return an `answers` JSONB value that is structurally equal to the submitted map (same keys, same values).

**Validates: Requirements 9.4**

---

### Property 11: Enrolled-student result isolation

*For any* student S and any module M where S is not enrolled (no `student_modules` row for S, M): the `assessmentSummaries` array in the dashboard response for S SHALL not contain an entry whose `assessment_id` belongs to module M.

**Validates: Requirements 6.6**

---

### Property 12: Admin results sorted correctly

*For any* array of student result objects with heterogeneous `attempt_count` and `best_score` values: `sortStudentResults(results)` SHALL return a new array where all results with `attempt_count > 0` precede all results with `attempt_count === 0`, and within each group, results are ordered by `best_score` descending.

**Validates: Requirements 7.3**

---

## Error Handling

### Admin actions

All server actions return `{ success: true }` or `{ error: string }`. Client components display the error message inline adjacent to the relevant field. No partial state is persisted on validation failure.

DB-level constraint violations (unique constraint on `module_id`) are mapped to human-readable Indonesian messages rather than exposing Postgres error codes.

### Student API routes

| Layer | Strategy |
|---|---|
| Auth failure | 401 JSON; client redirects to `/login` |
| Enrollment/completion gate | 403 JSON with `reason` field; modal shows a friendly message |
| Attempt limit reached | 400 JSON; `AssessmentNode` re-renders as exhausted |
| DB error on attempt insert | 500 JSON with `{ error, score, best_score, answers }`; modal retains all state so the student can retry submission without re-answering |
| Dashboard assessment fetch failure | Graceful degradation: `assessmentSummaries` defaults to `[]`; the dashboard still loads; assessment nodes show as locked until next refresh |
| Module completion check failure | Graceful degradation: assessment node shows as locked; no silent data loss |

### Student UI (AssessmentModal)

The modal maintains three local states: `phase: 'loading' | 'taking' | 'result'` plus `submittedResult` and `submissionError`. On submission failure the modal stays in `'taking'` phase with `submissionError` displayed, preserving all selected answers so the student can retry immediately.

Duplicate submission within the same session is prevented by transitioning to `'result'` phase on the first successful response and disabling the submit button with a "Mengirim..." loading state during the POST request.

---

## Testing Strategy

The testing approach combines property-based tests for pure logic (score computation, validation, sorting, label formatting, completion gate) with example-based integration tests for API routes and the database persistence layer.

### Unit / property tests (Vitest)

Located in `lib/__tests__/` and `app/__tests__/`.

**Property-based library:** `fast-check` (`npm install --save-dev fast-check`)

Each property maps directly to the Correctness Properties section above. Minimum 100 iterations per property run.

```typescript
// Example tag format for traceability:
// Feature: module-assessment, Property 5: Score computation correctness
it('Property 5: score is always ROUND((correct/total)*100) in [0,100]', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 20 }).chain((total) =>
        fc.integer({ min: 0, max: total }).map((correct) => ({ correct, total }))
      ),
      ({ correct, total }) => {
        const result = computeScore(correct, total);
        expect(result).toBe(Math.round((correct / total) * 100));
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }
    ),
    { numRuns: 100 }
  );
});
```

Pure functions to extract and test independently:

| Function | Source | Properties tested |
|---|---|---|
| `isModuleComplete(published, completed)` | `lib/moduleCompletion.ts` | Property 4 |
| `computeScore(correct, total)` | `lib/assessmentScoring.ts` (new) | Property 5 |
| `computeBestScore(existing, newScore)` | `lib/assessmentScoring.ts` (new) | Property 6 |
| `buildQuestionResults(answers, correctAnswers)` | `lib/assessmentScoring.ts` (new) | Property 7 |
| `getAssessmentActionLabel(attemptCount)` | `lib/assessmentHelpers.ts` (new) | Property 9 |
| `formatAttemptLabel(attemptCount)` | `lib/assessmentHelpers.ts` (new) | Property 9 |
| `sortStudentResults(results)` | `lib/assessmentHelpers.ts` (new) | Property 12 |
| `validateAssessmentTitle(title)` | `lib/assessmentValidation.ts` (new) | Properties 1, 2 |
| `validateQuestionInput(input)` | `lib/assessmentValidation.ts` (new) | Property 3 |

### Integration / example tests

Located in `app/api/__tests__/`.

| Test | Type | Validates |
|---|---|---|
| `POST /api/student/assessment/submit` with 2 existing attempts → 400 | Example | Req 5.1, Property 8 |
| Assessment answers JSONB round-trip | Example (with Supabase mock) | Property 10 |
| Dashboard `assessmentSummaries` excludes non-enrolled modules | Example | Property 11 |
| Cascade delete: delete assessment → questions/attempts gone | Integration | Req 9.2 |
| Topic delete does not alter attempts | Integration | Req 9.5 |
| Duplicate `module_id` insert rejected | Smoke | Req 1.1 |
| Duplicate `(student_id, assessment_id, attempt_number)` insert rejected | Smoke | Req 9.1 |

### UI tests (Vitest + React Testing Library)

| Test | Validates |
|---|---|
| `AssessmentNode` renders locked state when `status === 'locked'` | Req 3.1 |
| `AssessmentNode` renders "Mulai Tryout" at 0 attempts | Req 5.2 |
| `AssessmentNode` renders "Ulangi Tryout" at 1 attempt | Req 5.2 |
| `AssessmentNode` renders no action button at 2 attempts | Req 5.3 |
| `AssessmentForm` submit button disabled until all questions answered | Req 4.2 |
| `AssessmentResultScreen` shows correct answer for wrong selections | Req 4.6 |
| Admin: `AddAssessmentQuestionForm` disabled at 20 questions | Req 2.9 |
| Admin: warning rendered when question count < 10 | Req 7.5 |
