# Design Document — XP & Badge Gamification System

## Overview

This feature adds a persistent, cross-session progression layer to the Bits2Bytes LMS student experience. The work has four delivery pillars:

1. **Unified XP** — A `computeTotalXP` pure function combines lesson XP (from `topic_progress`) with assessment bonus XP (from `module_assessment_attempts`) into a single `totalXP` value. The student dashboard API exposes `totalXP` and `level` so the `GamificationHeader` can render a level bar that reflects all learning activities.

2. **Badge Catalog + Evaluator** — A static `BADGE_CATALOG` array (7 badges, defined once in `lib/gamification/badgeCatalog.ts`) is the single source of truth for badge metadata. A server-side `evaluateBadges(studentId)` function queries student progress, determines which new badges are earned, writes them to `student_badges`, and returns the newly-earned `BadgeDefinition[]`.

3. **Badge Celebration Popup** — A `BadgeCelebrationModal` client component queues newly-earned badges (received from API responses) and shows them one at a time with a confetti animation, matching the existing animejs confetti already used in `QuestMap.tsx`.

4. **Badge Wall** — A `BadgeWall` client component inside `QuestMap` renders all 7 catalog badges: earned ones in full color with earned date, locked ones greyed-out with a lock icon. It receives `earnedBadges` as a prop and does no data fetching of its own.

All new server-side code uses only `getSupabaseAdmin()` and standard Web/Node.js APIs, keeping the feature Vercel serverless-compatible throughout.

---

## Architecture

```mermaid
flowchart TD
    subgraph Client
        SP[app/student/page.tsx]
        QM[QuestMap.tsx]
        BCM[BadgeCelebrationModal.tsx]
        BW[BadgeWall.tsx]
        AM[AssessmentModal.tsx]
        LML[useLmsEngineListener.ts]
    end

    subgraph API Routes
        ES[/api/student/engine-sync]
        ASS[/api/student/assessment/submit]
        DASH[/api/student/dashboard]
    end

    subgraph Lib
        BE[badgeEvaluator.ts]
        BC[badgeCatalog.ts]
        XPC[xpCalculator.ts]
        MC[moduleCompletion.ts]
    end

    subgraph DB [Supabase DB]
        TP[topic_progress]
        QA[quiz_attempts]
        MAA[module_assessment_attempts]
        SM[student_modules]
        SB[student_badges  ← NEW]
    end

    SP -- useEffect/fetch --> DASH
    DASH -- reads --> TP & MAA & SB
    DASH -- uses --> XPC & BC

    LML -- POST --> ES
    ES -- upserts --> TP
    ES -- calls --> BE
    BE -- reads --> TP & QA & MAA & SM
    BE -- reads/writes --> SB
    BE -- calls --> MC
    ES -- returns newBadges --> LML
    LML -- onSynced+newBadges --> SP
    SP -- badgeQueue state --> BCM

    AM -- POST --> ASS
    ASS -- inserts --> MAA
    ASS -- calls --> BE
    ASS -- returns newBadges --> AM
    AM -- onSuccess(newBadges) --> SP
    SP -- badgeQueue state --> BCM

    SP -- earnedBadges prop --> QM
    QM -- earnedBadges prop --> BW
    QM -- totalXP prop --> GH[GamificationHeader.tsx]
```

**Data flow summary:**

- `engine-sync` and `assessment/submit` routes call `evaluateBadges()` after their DB writes, then include `newBadges: BadgeDefinition[]` in the JSON response.
- `useLmsEngineListener` is extended to return the `newBadges` array from the engine-sync response via its `onSynced` callback.
- `AssessmentModal.onSuccess` is extended to accept `BadgeDefinition[]`.
- `app/student/page.tsx` owns a `badgeQueue: BadgeDefinition[]` state, accumulates badges from both sources, and passes the queue + dismiss handler to `BadgeCelebrationModal`.
- `dashboard` route adds `totalXP`, `level`, and `earnedBadges` to its existing response.

---

## Database Schema (Migration SQL)

**File:** `supabase/migrations/20250610_001_student_badges.sql`

```sql
-- Migration: Student Badges table
-- Applied via: Supabase Dashboard > SQL Editor
-- Status: PENDING
--
-- Changes:
--   1. student_badges  — per-student badge records (one row per badge, ever)
--   2. UNIQUE constraint on (student_id, badge_id)
--   3. RLS enabled; service_role full-access policy (idempotent)
--
-- Satisfies: Requirements 2.1, 2.2, 2.3, 9.1–9.5

CREATE TABLE IF NOT EXISTS public.student_badges (
  id          SERIAL PRIMARY KEY,
  student_id  UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id    TEXT         NOT NULL,
  earned_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_badges_student_badge_unique'
  ) THEN
    ALTER TABLE public.student_badges
      ADD CONSTRAINT student_badges_student_badge_unique UNIQUE (student_id, badge_id);
  END IF;
END$$;

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'student_badges' AND policyname = 'lms_service_role_all'
  ) THEN
    CREATE POLICY "lms_service_role_all" ON public.student_badges
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;
```

---

## Data Models

### `BadgeDefinition`

Defined in `lib/gamification/badgeCatalog.ts` — the shape shared between the evaluator, the API responses, and the UI components.

```typescript
export type BadgeRarity = 'common' | 'rare' | 'epic';

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;         // emoji
  rarity: BadgeRarity;
  description: string;
}
```

### Badge Catalog (7 badges)

| `id` | `name` | `icon` | `rarity` | Trigger condition |
|---|---|---|---|---|
| `first-lesson` | Langkah Pertama | 🌱 | common | `completedTopics >= 1` |
| `lesson-streak-3` | Trio Pejuang | ⚡ | common | `completedTopics >= 3` |
| `lesson-streak-10` | Petarung Sejati | 🏆 | rare | `completedTopics >= 10` |
| `perfect-quiz` | Nilai Sempurna | 💯 | epic | Any quiz or assessment score = 100 |
| `first-module` | Modul Pertama Selesai | 🎓 | rare | At least 1 module complete |
| `quiz-master` | Quiz Master | 🧠 | rare | ≥ 5 distinct quizzes/assessments with score ≥ 90 |
| `tryout-ace` | Jagoan Tryout | 🎯 | epic | Any `best_score` in `module_assessment_attempts` ≥ 80 |

### `EarnedBadgeRow`

Shape of rows in `student_badges`, used in dashboard response:

```typescript
export interface EarnedBadgeRow {
  badge_id: string;
  earned_at: string;  // ISO 8601 string
}
```

### Dashboard Response Extension

The existing `GET /api/student/dashboard` response gains three new fields:

```typescript
interface DashboardResponse {
  // … existing fields unchanged …
  engineXpTotal: number;        // kept for backward compat — lesson XP only
  totalXP: number;              // NEW: engineXP + assessmentXP
  level: number;                // NEW: floor(totalXP / 100) + 1
  earnedBadges: EarnedBadgeRow[]; // NEW: all earned badges from student_badges
}
```

### Engine-Sync / Assessment-Submit Response Extension

Both route responses gain:

```typescript
newBadges: BadgeDefinition[];   // [] when none earned
```

### `useLmsEngineListener` Callback Extension

```typescript
interface UseLmsEngineListenerOptions {
  onEvent?: (event: LmsEvent) => void;
  // Extended: was (topicId: string, type: LmsEvent['type']) => void
  onSynced?: (topicId: string, type: LmsEvent['type'], newBadges: BadgeDefinition[]) => void;
}
```

---

## Components and Interfaces

### 1. `lib/gamification/badgeCatalog.ts` (new, pure)

```typescript
export type BadgeRarity = 'common' | 'rare' | 'epic';

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  rarity: BadgeRarity;
  description: string;
}

export const BADGE_CATALOG: BadgeDefinition[] = [ /* 7 entries */ ];

export const BADGE_MAP = new Map(BADGE_CATALOG.map((b) => [b.id, b]));

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_MAP.get(id);
}
```

No dynamic imports, no side effects — statically importable on both server and client.

---

### 2. `lib/gamification/xpCalculator.ts` (new, pure)

```typescript
export interface AssessmentXPRow {
  assessment_id: number;
  score: number;       // raw score 0–100 for a single attempt
}

/**
 * Computes Total_XP = sum(engineXP rows) + sum(floor(best_score/100*50) per assessment).
 * De-duplicates assessment rows by selecting the highest score per assessment_id.
 */
export function computeTotalXP(
  engineXpTotal: number,
  assessmentRows: AssessmentXPRow[]
): number

/**
 * Derives level from Total_XP.
 * Level 1 = 0–99 XP, Level 2 = 100–199 XP, no upper cap.
 */
export function computeLevel(totalXP: number): number
```

Both functions are pure — no I/O, no async, no imports beyond TypeScript types. This makes them trivially unit-testable and safe to import inside any Next.js route handler.

**Implementation notes:**

- `computeTotalXP`: groups `assessmentRows` by `assessment_id`, takes the max `score` per group, applies `Math.floor(max / 100 * 50)`, sums across all groups, then adds `engineXpTotal`.
- `computeLevel`: `Math.floor(totalXP / 100) + 1`.

---

### 3. `lib/gamification/badgeEvaluator.ts` (new, server-only)

```typescript
import { getSupabaseAdmin } from '../supabaseAdmin';
import { BADGE_CATALOG, type BadgeDefinition } from './badgeCatalog';
import { resolveModuleCompletionMap } from '../moduleCompletion';

/**
 * Evaluates all 7 badge conditions for a student.
 * Inserts newly earned badges into student_badges (ignoring duplicates).
 * Returns the array of newly-earned BadgeDefinition objects.
 * On any DB error, logs and returns [] to avoid blocking the caller.
 */
export async function evaluateBadges(studentId: string): Promise<BadgeDefinition[]>
```

**Internal query plan (single invocation):**

```
1. SELECT badge_id FROM student_badges WHERE student_id = $1
   → Set<string> alreadyEarned

2. SELECT topic_id FROM topic_progress
   WHERE student_id = $1 AND completed_at IS NOT NULL
   → completedTopicsCount (length of result)

3. SELECT score FROM quiz_attempts WHERE student_id = $1
   → quizScores: number[]

4. SELECT assessment_id, best_score FROM module_assessment_attempts
   WHERE student_id = $1
   → Group by assessment_id, keep max best_score per group
   → assessmentBestScores: Map<number, number>

5. SELECT module_id FROM student_modules WHERE student_id = $1
   → moduleIds: number[]
   → resolveModuleCompletionMap(studentId, moduleIds)
   → completedModulesCount (count of isComplete === true entries)
```

**Badge condition checks:**

```
first-lesson:    completedTopicsCount >= 1
lesson-streak-3: completedTopicsCount >= 3
lesson-streak-10:completedTopicsCount >= 10
perfect-quiz:    quizScores.some(s => s === 100) || [...assessmentBestScores.values()].some(s => s === 100)
first-module:    completedModulesCount >= 1
quiz-master:     (count of quiz_attempts with score >= 90) + (count of assessments with best_score >= 90) >= 5
tryout-ace:      [...assessmentBestScores.values()].some(s => s >= 80)
```

For each badge whose condition is met and whose `badge_id` is NOT in `alreadyEarned`, insert into `student_badges` using:

```typescript
await admin
  .from('student_badges')
  .upsert(
    newBadges.map((b) => ({ student_id: studentId, badge_id: b.id })),
    { onConflict: 'student_id,badge_id', ignoreDuplicates: true }
  );
```

Return the matching `BadgeDefinition[]` objects from `BADGE_CATALOG`.

---

### 4. `app/api/student/engine-sync/route.ts` (modified)

After the existing `topic_progress` upsert (for `LESSON_COMPLETE`) or `quiz_attempts` upsert (for `QUIZ_SUBMITTED`), add:

```typescript
import { evaluateBadges } from '../../../../lib/gamification/badgeEvaluator';
import type { BadgeDefinition } from '../../../../lib/gamification/badgeCatalog';

// After successful DB write:
let newBadges: BadgeDefinition[] = [];
try {
  newBadges = await evaluateBadges(studentId);
} catch {
  // evaluateBadges is already safe; this is a belt-and-suspenders guard
  newBadges = [];
}
return NextResponse.json({ ok: true, newBadges });
```

The route never fails due to badge evaluation — it always returns HTTP 200 with `newBadges: []` at worst.

---

### 5. `app/api/student/assessment/submit/route.ts` (modified)

After step 12 (successful attempt insert), replace the current `return NextResponse.json(result, { status: 200 })` with:

```typescript
import { evaluateBadges } from '../../../../../lib/gamification/badgeEvaluator';
import type { BadgeDefinition } from '../../../../../lib/gamification/badgeCatalog';

let newBadges: BadgeDefinition[] = [];
try {
  newBadges = await evaluateBadges(studentId);
} catch {
  newBadges = [];
}

return NextResponse.json({ ...result, newBadges }, { status: 200 });
```

`AssessmentSubmitResult` is extended to include `newBadges?: BadgeDefinition[]`.

---

### 6. `app/api/student/dashboard/route.ts` (modified)

After fetching `topicProgress` and `assessmentSummaries`, add:

```typescript
import { computeTotalXP, computeLevel } from '../../../../lib/gamification/xpCalculator';
import type { EarnedBadgeRow } from '../../../../lib/gamification/badgeCatalog';

// Build assessment XP rows for computeTotalXP
const assessmentXPRows = assessmentSummaries.map((s) => ({
  assessment_id: s.assessment_id,
  score: s.best_score,
}));

const totalXP = computeTotalXP(engineXpTotal, assessmentXPRows);
const level = computeLevel(totalXP);

// Fetch earned badges
let earnedBadges: EarnedBadgeRow[] = [];
try {
  const { data: badgeRows } = await supabaseAdmin
    .from('student_badges')
    .select('badge_id, earned_at')
    .eq('student_id', studentId);
  earnedBadges = (badgeRows ?? []) as EarnedBadgeRow[];
} catch (badgeErr) {
  console.error('Dashboard: error fetching student_badges', badgeErr);
  earnedBadges = []; // graceful degradation
}
```

Add `totalXP`, `level`, `earnedBadges` to `responsePayload`.

---

### 7. `lib/useLmsEngineListener.ts` (modified)

Extend `onSynced` to pass `newBadges`:

```typescript
import type { BadgeDefinition } from './gamification/badgeCatalog';

interface UseLmsEngineListenerOptions {
  onEvent?: (event: LmsEvent) => void;
  onSynced?: (
    topicId: string,
    type: LmsEvent['type'],
    newBadges: BadgeDefinition[]   // NEW
  ) => void;
}
```

Inside `handleMessage`, after `if (res.ok)`:

```typescript
const json = await res.json() as { ok: boolean; newBadges?: BadgeDefinition[] };
if (res.ok) options.onSynced?.(data.topicId, data.type, json.newBadges ?? []);
```

---

### 8. `components/assessment/AssessmentModal.tsx` (modified)

Extend `onSuccess` to accept `newBadges`:

```typescript
import type { BadgeDefinition } from '../../lib/gamification/badgeCatalog';

interface AssessmentModalProps {
  // ...
  onSuccess: (newBadges: BadgeDefinition[]) => void;  // was () => void
}
```

In `handleResultClose`:

```typescript
const handleResultClose = () => {
  const badges = submittedResult as (AssessmentSubmitResult & { newBadges?: BadgeDefinition[] });
  onSuccess(badges.newBadges ?? []);
  onClose();
};
```

The JSON parse in `handleSubmit` already reads the full result body; the `newBadges` field is present on success from the extended route.

---

### 9. `app/student/page.tsx` (modified)

```typescript
import type { BadgeDefinition } from '@/lib/gamification/badgeCatalog';
import { BadgeCelebrationModal } from '@/components/gamification/BadgeCelebrationModal';

// State
const [badgeQueue, setBadgeQueue] = useState<BadgeDefinition[]>([]);
const [earnedBadges, setEarnedBadges] = useState<EarnedBadgeRow[]>([]);
const [totalXP, setTotalXP] = useState(0);
const [level, setLevel] = useState(1);

// In dashboard fetch callback, read new fields:
setTotalXP(data.totalXP ?? data.engineXpTotal);
setLevel(data.level ?? 1);
setEarnedBadges(data.earnedBadges ?? []);

// Enqueue helper
const enqueueBadges = useCallback((newBadges: BadgeDefinition[]) => {
  if (newBadges.length === 0) return;
  setBadgeQueue((prev) => [...prev, ...newBadges]);
}, []);

// Wire useLmsEngineListener onSynced
useLmsEngineListener({
  onSynced: (topicId, type, newBadges) => {
    enqueueBadges(newBadges);
    void fetchDashboard();   // refresh XP and earnedBadges
  },
});

// Wire QuestMap's onSuccess for assessments
// In QuestMap props, onSuccess becomes (newBadges) => { enqueueBadges(newBadges); fetchDashboard(); }

// BadgeCelebrationModal dismiss handler
const handleBadgeDismiss = useCallback(() => {
  setBadgeQueue((prev) => prev.slice(1));
}, []);
```

Pass `totalXP`, `earnedBadges` down to `QuestMap`.

---

### 10. `components/quest-map/QuestMap.tsx` (modified)

```typescript
interface QuestMapProps {
  // … existing props …
  totalXP: number;             // NEW — replaces engineXpTotal for XP display
  earnedBadges: EarnedBadgeRow[]; // NEW
  onAssessmentSuccess?: (newBadges: BadgeDefinition[]) => void; // NEW
}
```

Changes:
- Pass `totalXP` to `GamificationHeader` as `xpTotal` (instead of `engineXpTotal`).
- Keep `engineXpTotal` for the `CustomizeHeroModal` `stats.xp` prop (unchanged).
- Add `<BadgeWall earnedBadges={earnedBadges} />` immediately below `<BadgePanel>`.
- Wire `AssessmentModal`'s `onSuccess` to call `onAssessmentSuccess?.(newBadges)`.

---

### 11. `components/quest-map/GamificationHeader.tsx` (modified)

The component already accepts `xpTotal: number`. No interface change needed — the caller (QuestMap) now passes `totalXP` as `xpTotal`. The existing `calcLevel(xpTotal)` function inside the component continues to work correctly because the formula is identical (`floor(xp / 100) + 1`).

---

### 12. `components/gamification/BadgeCelebrationModal.tsx` (new, `'use client'`)

```typescript
'use client';

import type { BadgeDefinition } from '@/lib/gamification/badgeCatalog';

interface BadgeCelebrationModalProps {
  queue: BadgeDefinition[];    // parent-managed queue; [0] is the active badge
  onDismiss: () => void;       // parent pops queue[0]
}

export function BadgeCelebrationModal({ queue, onDismiss }: BadgeCelebrationModalProps)
```

**Behavior:**
- Renders nothing when `queue.length === 0`.
- Displays `queue[0]` — the current badge.
- On mount of the active badge, calls `triggerConfetti()` (imported from a shared utility or inlined — see note below).
- Shows: icon (≥ 4rem), name (bold), rarity label (color-coded), description, and "Kamu baru mendapatkan badge ini!" text.
- "Keren! 🎉" button and backdrop click both call `onDismiss`.
- `role="dialog"` and `aria-modal="true"` for accessibility.

**Rarity colors:**

| rarity | Tailwind class | hex |
|---|---|---|
| common | `text-sky-400` | `#38bdf8` |
| rare | `text-violet-500` | `#8b5cf6` |
| epic | `text-amber-400` | `#fbbf24` |

**Confetti:** Import `triggerConfetti` extracted from `QuestMap.tsx` into a shared utility `lib/triggerConfetti.ts`. Both `QuestMap` and `BadgeCelebrationModal` import from there to avoid duplication.

**Multiple badges:** Because the parent owns `queue` state and `onDismiss` pops only `queue[0]`, the modal naturally advances to `queue[1]` after dismiss — no internal queue logic needed.

**Accessibility:**
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the badge name heading.
- Focus is trapped inside the modal while open (use a `useEffect` to focus the dismiss button on open).

---

### 13. `components/gamification/BadgeWall.tsx` (new, `'use client'`)

```typescript
'use client';

import type { EarnedBadgeRow } from '@/lib/gamification/badgeCatalog';
import { BADGE_CATALOG } from '@/lib/gamification/badgeCatalog';

interface BadgeWallProps {
  earnedBadges: EarnedBadgeRow[];
}

export function BadgeWall({ earnedBadges }: BadgeWallProps)
```

**Behavior:**
- Collapsible section (controlled by local `isOpen` state, default `true`).
- Toggle button labelled "🏅 Badge Wall".
- Grid layout: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`.
- Iterates `BADGE_CATALOG` (fixed order) for each badge:
  - **Earned** (badge_id in `earnedBadges`): full color card with icon, name, rarity accent, description, and formatted `earned_at` date (`toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })`).
  - **Locked**: same card structure but `filter: grayscale(1) opacity(0.5)`, lock icon overlay (`🔒`), description as unlock hint.
- Container uses `bg-[#181c24]` / `var(--glass-bg)` and `var(--glass-border)` for borders.
- No data fetching — purely presentational.

---

## Error Handling

| Layer | Failure mode | Strategy |
|---|---|---|
| `evaluateBadges` | Any Supabase query fails | `try/catch` wraps entire function body; logs via `console.error`; returns `[]` so API routes are not blocked |
| `evaluateBadges` | Duplicate badge insert | `upsert` with `ignoreDuplicates: true` — silently skipped by Postgres |
| `engine-sync` route | `evaluateBadges` throws unexpectedly | Outer `try/catch` catches, sets `newBadges = []`; route still returns `{ ok: true, newBadges: [] }` |
| `assessment/submit` route | `evaluateBadges` throws | Same pattern; route still returns the `AssessmentSubmitResult` with `newBadges: []` |
| `dashboard` route | `student_badges` query fails | `try/catch` sets `earnedBadges = []`; rest of response unaffected — consistent with existing pattern |
| `computeTotalXP` | Negative XP input | Clamps assessment bonus to `Math.max(0, ...)` — pure function, no I/O error path |
| `BadgeCelebrationModal` | Empty `queue` prop | Renders nothing (`return null`) |
| `BadgeWall` | `earnedBadges` prop is `[]` | All 7 badges render as locked — graceful empty state |
| `useLmsEngineListener` | `engine-sync` response missing `newBadges` | `json.newBadges ?? []` — graceful fallback |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: XP Computation Correctness

*For any* non-negative `engineXpTotal` and any list of `(assessment_id, score)` attempt rows (including duplicate `assessment_id` entries and empty lists), `computeTotalXP` SHALL return a value equal to `engineXpTotal + Σ floor(max_score_per_assessment / 100 * 50)`, where the maximum is taken over all rows sharing the same `assessment_id`.

**Validates: Requirements 1.1, 1.2, 1.3**

---

### Property 2: Level Formula Correctness

*For any* non-negative integer `totalXP`, `computeLevel(totalXP)` SHALL return `Math.floor(totalXP / 100) + 1`, producing Level 1 for inputs 0–99, Level 2 for inputs 100–199, and so on with no upper bound.

**Validates: Requirement 1.4**

---

### Property 3: Badge Evaluator Correctness

*For any* valid student state (arbitrary `completedTopicsCount`, `quizScores`, `assessmentBestScores`, `completedModulesCount`, and `alreadyEarnedBadgeIds`), calling `evaluateBadges` SHALL return exactly the set of `BadgeDefinition` objects whose conditions are satisfied by that state AND whose `id` is not present in `alreadyEarnedBadgeIds` — no more, no fewer.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 4.8**

---

## Testing Strategy

### Unit Tests (Vitest)

These cover pure functions and specific concrete behaviors.

**`lib/gamification/xpCalculator.test.ts`**
- `computeTotalXP`: zero inputs → 0; single topic XP; multiple topics; single assessment; multiple attempts same assessment (de-duplication); mixed topics + assessments.
- `computeLevel`: boundary values — 0, 99, 100, 199, 200; large values.

**`lib/gamification/badgeCatalog.test.ts`**
- `BADGE_CATALOG` exports exactly 7 entries.
- Each entry has `id`, `name`, `icon`, `rarity` (one of `common | rare | epic`), `description`.
- No duplicate `id` values.
- `getBadgeById` returns correct entry; returns `undefined` for unknown id.

**`lib/gamification/badgeEvaluator.test.ts`** (mocked Supabase)
- Returns `[]` when all 7 badges already earned.
- Returns correct badges when conditions are met for a subset.
- DB failure → returns `[]` and does not throw.
- Does not return badges whose condition is not met.
- Upsert is called with `ignoreDuplicates: true`.

### Property-Based Tests (Vitest + `fast-check`)

Each test runs a minimum of 100 iterations.

**`lib/gamification/xpCalculator.property.test.ts`**

```typescript
// Feature: xp-badge-system, Property 1: XP Computation Correctness
it('computeTotalXP is correct for arbitrary inputs', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 10_000 }),       // engineXpTotal
      fc.array(                                   // attempt rows
        fc.record({
          assessment_id: fc.integer({ min: 1, max: 10 }),
          score: fc.integer({ min: 0, max: 100 }),
        }),
        { maxLength: 20 }
      ),
      (engineXp, rows) => {
        // Compute expected value
        const bestPerAssessment = new Map<number, number>();
        for (const r of rows) {
          bestPerAssessment.set(
            r.assessment_id,
            Math.max(bestPerAssessment.get(r.assessment_id) ?? 0, r.score)
          );
        }
        const expectedAssessmentXP = [...bestPerAssessment.values()].reduce(
          (sum, s) => sum + Math.floor(s / 100 * 50),
          0
        );
        expect(computeTotalXP(engineXp, rows)).toBe(engineXp + expectedAssessmentXP);
      }
    ),
    { numRuns: 100 }
  );
});
```

**`lib/gamification/xpCalculator.property.test.ts`**

```typescript
// Feature: xp-badge-system, Property 2: Level Formula Correctness
it('computeLevel satisfies floor(xp/100)+1 for any non-negative input', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 100_000 }),
      (xp) => {
        expect(computeLevel(xp)).toBe(Math.floor(xp / 100) + 1);
      }
    ),
    { numRuns: 100 }
  );
});
```

**`lib/gamification/badgeEvaluator.property.test.ts`**

```typescript
// Feature: xp-badge-system, Property 3: Badge Evaluator Correctness
// Uses a pure helper that mirrors badge conditions (no DB), mocking the DB layer
// to return generated data directly.
it('evaluateBadges returns exactly the correct set of new badges', async () => {
  await fc.assert(
    fc.asyncProperty(
      studentStateArbitrary,   // fc.record of completedTopics, scores, etc.
      alreadyEarnedArbitrary,  // fc.array of badge ids from BADGE_CATALOG
      async (state, alreadyEarned) => {
        mockSupabaseWithState(state, alreadyEarned);
        const result = await evaluateBadges('test-student-id');
        const expected = computeExpectedNewBadges(state, alreadyEarned);
        expect(sortedIds(result)).toEqual(sortedIds(expected));
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests

- `GET /api/student/dashboard` — response contains `totalXP`, `level`, `earnedBadges` fields with correct types.
- `POST /api/student/engine-sync` — response contains `newBadges` field (array).
- `POST /api/student/assessment/submit` — response contains `newBadges` field alongside existing result fields.

### Component Tests (Vitest + React Testing Library)

- `BadgeCelebrationModal`: renders nothing when `queue=[]`; renders first badge when `queue` has entries; calls `onDismiss` on button click; calls `onDismiss` on backdrop click; `role="dialog"` and `aria-modal="true"` are present.
- `BadgeWall`: with empty `earnedBadges`, all 7 cards render in locked state; with one earned badge, that card renders in full color and others greyed; `earned_at` formats correctly in Indonesian locale.

### PBT Library

Use **`fast-check`** (already available in the ecosystem; install with `npm install --save-dev fast-check`). Configure each property test with `{ numRuns: 100 }`.

**Tag format for each property test:**
```
// Feature: xp-badge-system, Property <N>: <property_text>
```
