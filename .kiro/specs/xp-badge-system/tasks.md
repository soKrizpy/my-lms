# Implementation Plan: XP & Badge Gamification System

## Overview

Implement a persistent, cross-session progression layer on top of the existing Bits2Bytes LMS
student experience. The work is split across four delivery pillars:

1. **Unified XP** — combine lesson XP and assessment bonus XP into a single `totalXP` value.
2. **Badge Catalog + Evaluator** — static catalog of 7 badges, server-side evaluator that awards them.
3. **Badge Celebration Popup** — animated confetti modal for newly earned badges.
4. **Badge Wall** — collapsible grid showing all 7 catalog badges inside the Quest Map.

All new server-side code uses only `getSupabaseAdmin()` and standard Web/Node.js APIs to remain
Vercel serverless-compatible.

---

## Tasks

- [x] 1. Database migration — `student_badges` table
  - [x] 1.1 Create migration file `supabase/migrations/20250610_001_student_badges.sql`
    - Use `CREATE TABLE IF NOT EXISTS` for idempotency
    - Columns: `id SERIAL PRIMARY KEY`, `student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `badge_id TEXT NOT NULL`, `earned_at TIMESTAMPTZ NOT NULL DEFAULT now()`
    - Add `UNIQUE (student_id, badge_id)` constraint using the idempotent `DO $$ BEGIN … END$$` pattern from `20250607_001_module_assessments.sql`
    - Enable Row Level Security with a `service_role` full-access policy using the same idempotent pattern
    - Include descriptive header comment listing table, requirements satisfied, and application method
    - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2. Pure library — badge catalog and XP calculator
  - [x] 2.1 Create `lib/gamification/badgeCatalog.ts`
    - Export `BadgeRarity` type: `'common' | 'rare' | 'epic'`
    - Export `BadgeDefinition` interface: `{ id, name, icon, rarity, description }`
    - Export `EarnedBadgeRow` interface: `{ badge_id: string; earned_at: string }`
    - Export `BADGE_CATALOG` as a `BadgeDefinition[]` constant with exactly the 7 badges defined in the requirements table (first-lesson, lesson-streak-3, lesson-streak-10, perfect-quiz, first-module, quiz-master, tryout-ace)
    - Export `BADGE_MAP` as `new Map(BADGE_CATALOG.map((b) => [b.id, b]))`
    - Export `getBadgeById(id: string): BadgeDefinition | undefined`
    - No dynamic `require()`, no side effects — statically importable on both server and client
    - _Requirements: 3.1, 3.2, 3.3, 10.2_

  - [x] 2.2 Create `lib/gamification/xpCalculator.ts`
    - Export `AssessmentXPRow` interface: `{ assessment_id: number; score: number }`
    - Export `computeTotalXP(engineXpTotal: number, assessmentRows: AssessmentXPRow[]): number`
      - Groups rows by `assessment_id`, takes `Math.max` per group
      - Applies `Math.floor(max / 100 * 50)` per group, clamps to `Math.max(0, ...)`
      - Returns `engineXpTotal + sum of assessment bonuses`
    - Export `computeLevel(totalXP: number): number` → `Math.floor(totalXP / 100) + 1`
    - Both functions are pure — no I/O, no async, no imports beyond TypeScript types
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Server library — badge evaluator
  - [x] 3.1 Create `lib/gamification/badgeEvaluator.ts`
    - Import `getSupabaseAdmin` from `../supabaseAdmin`, `BADGE_CATALOG` and `BadgeDefinition` from `./badgeCatalog`, `resolveModuleCompletionMap` from `../moduleCompletion`
    - Export `async function evaluateBadges(studentId: string): Promise<BadgeDefinition[]>`
    - Wrap entire function body in `try/catch`; on any error log via `console.error` and return `[]`
    - Internal query plan (5 queries):
      1. `student_badges WHERE student_id = $1` → `alreadyEarned: Set<string>`
      2. `topic_progress WHERE student_id = $1 AND completed_at IS NOT NULL` → `completedTopicsCount`
      3. `quiz_attempts WHERE student_id = $1` → `quizScores: number[]`
      4. `module_assessment_attempts WHERE student_id = $1` → group by `assessment_id`, keep max `best_score` per group → `assessmentBestScores: Map<number, number>`
      5. `student_modules WHERE student_id = $1` → pass to `resolveModuleCompletionMap` → `completedModulesCount`
    - Evaluate all 7 badge conditions against the collected data
    - For each badge whose condition is met AND whose `id` is not in `alreadyEarned`, collect into `newBadges[]`
    - Upsert collected badges using `{ onConflict: 'student_id,badge_id', ignoreDuplicates: true }`
    - Return the corresponding `BadgeDefinition[]` from `BADGE_CATALOG`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 4. Shared utility — extract triggerConfetti
  - [x] 4.1 Create `lib/triggerConfetti.ts`
    - Extract the existing `triggerConfetti` async function verbatim from `QuestMap.tsx` (line 113) into this file
    - Export it as a named export: `export async function triggerConfetti(): Promise<void>`
    - Remove the `triggerConfetti` function definition from `QuestMap.tsx` and replace with an import from `@/lib/triggerConfetti`
    - _Requirements: 6.3_

- [ ] 5. Tests — pure functions and badge evaluator
  - [ ]* 5.1 Write unit tests for `badgeCatalog.ts` (`lib/gamification/badgeCatalog.test.ts`)
    - `BADGE_CATALOG` exports exactly 7 entries
    - Each entry has `id`, `name`, `icon`, `rarity` (one of `common | rare | epic`), `description`
    - No duplicate `id` values in the catalog
    - `getBadgeById` returns the correct entry for each known id
    - `getBadgeById` returns `undefined` for an unknown id
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 5.2 Write property test for `computeTotalXP` (`lib/gamification/xpCalculator.property.test.ts`)
    - **Property 1: XP Computation Correctness**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Use `fast-check` (install with `npm install --save-dev fast-check` if not present)
    - Generate arbitrary `engineXpTotal` (0–10 000) and arbitrary attempt rows with duplicate `assessment_id` entries
    - Assert `computeTotalXP(engineXp, rows) === engineXp + Σ floor(max_score_per_assessment / 100 * 50)`
    - `{ numRuns: 100 }`
    - Tag: `// Feature: xp-badge-system, Property 1: XP Computation Correctness`

  - [ ]* 5.3 Write property test for `computeLevel` (same file as 5.2)
    - **Property 2: Level Formula Correctness**
    - **Validates: Requirement 1.4**
    - Generate arbitrary non-negative integer XP (0–100 000)
    - Assert `computeLevel(xp) === Math.floor(xp / 100) + 1`
    - `{ numRuns: 100 }`
    - Tag: `// Feature: xp-badge-system, Property 2: Level Formula Correctness`

  - [ ]* 5.4 Write unit tests for `xpCalculator.ts` (`lib/gamification/xpCalculator.test.ts`)
    - `computeTotalXP`: zero inputs → 0; single topic XP only; single assessment 100 → bonus 50; duplicate `assessment_id` rows de-duplicated (max wins); mixed topics + assessments
    - `computeLevel`: boundary values 0→1, 99→1, 100→2, 199→2, 200→3; large value e.g. 1050→11
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 5.5 Write property test for `evaluateBadges` (`lib/gamification/badgeEvaluator.property.test.ts`)
    - **Property 3: Badge Evaluator Correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 4.8**
    - Mock the Supabase client to return generated student state data
    - Define `studentStateArbitrary` as `fc.record` of `completedTopicsCount`, `quizScores`, `assessmentBestScores`, `completedModulesCount`
    - Define `alreadyEarnedArbitrary` as `fc.array` of badge ids sampled from `BADGE_CATALOG`
    - For each generated case, compute the expected set of new badges using a pure `computeExpectedNewBadges` helper that mirrors the 7 badge conditions
    - Assert `sortedIds(result) === sortedIds(expected)`
    - `{ numRuns: 100 }`
    - Tag: `// Feature: xp-badge-system, Property 3: Badge Evaluator Correctness`

  - [ ]* 5.6 Write unit tests for `badgeEvaluator.ts` (`lib/gamification/badgeEvaluator.test.ts`)
    - Returns `[]` when all 7 badges are already earned
    - Returns correct badge subset when only some conditions are met
    - DB failure → returns `[]` and does not throw
    - Does not return badges whose condition is not met
    - Upsert is called with `ignoreDuplicates: true`
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 6. Checkpoint — pure lib and tests
  - Run `npx vitest --run lib/gamification` to verify all pure function tests pass before proceeding to API work.
  - Ensure all tests pass; ask the user if any questions arise.

- [x] 7. API route modifications
  - [x] 7.1 Modify `app/api/student/engine-sync/route.ts`
    - Import `evaluateBadges` from `../../../../lib/gamification/badgeEvaluator`
    - Import `BadgeDefinition` type from `../../../../lib/gamification/badgeCatalog`
    - After the successful `topic_progress` upsert (LESSON_COMPLETE) or `quiz_attempts` upsert (QUIZ_SUBMITTED), call `evaluateBadges(studentId)` inside a try/catch that falls back to `[]`
    - Return `NextResponse.json({ ok: true, newBadges })` — route never fails due to badge evaluation
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 7.2 Modify `app/api/student/assessment/submit/route.ts`
    - Import `evaluateBadges` and `BadgeDefinition` (same relative path pattern)
    - After the successful attempt insert, call `evaluateBadges(studentId)` inside a try/catch that falls back to `[]`
    - Replace the final `return NextResponse.json(result, { status: 200 })` with `return NextResponse.json({ ...result, newBadges }, { status: 200 })`
    - Extend the inline `AssessmentSubmitResult` type (or the import from `lib/lmsData`) to include `newBadges?: BadgeDefinition[]`
    - _Requirements: 5.3, 5.4_

  - [x] 7.3 Modify `app/api/student/dashboard/route.ts`
    - Import `computeTotalXP`, `computeLevel` from `../../../../lib/gamification/xpCalculator`
    - Import `EarnedBadgeRow` type from `../../../../lib/gamification/badgeCatalog`
    - After fetching `assessmentSummaries`, build `assessmentXPRows` and call `computeTotalXP` / `computeLevel`
    - Fetch `student_badges` rows inside a try/catch; on failure set `earnedBadges = []`
    - Add `totalXP`, `level`, `earnedBadges` to the `responsePayload`; keep `engineXpTotal` unchanged for backward compatibility
    - _Requirements: 1.5, 5.5, 8.1, 8.2, 8.3, 8.4_

  - [x] 7.4 Modify `lib/useLmsEngineListener.ts`
    - Import `BadgeDefinition` type from `./gamification/badgeCatalog`
    - Extend `UseLmsEngineListenerOptions.onSynced` signature to `(topicId: string, type: LmsEvent['type'], newBadges: BadgeDefinition[]) => void`
    - In `handleMessage`, after `if (res.ok)` parse the JSON response body as `{ ok: boolean; newBadges?: BadgeDefinition[] }` and pass `json.newBadges ?? []` as the third argument to `options.onSynced?.()`
    - _Requirements: 5.1, 5.2_

- [x] 8. New UI components
  - [x] 8.1 Create `components/gamification/BadgeCelebrationModal.tsx`
    - `'use client'` directive at top
    - Import `BadgeDefinition` from `@/lib/gamification/badgeCatalog`
    - Import `triggerConfetti` from `@/lib/triggerConfetti`
    - Props: `queue: BadgeDefinition[]`, `onDismiss: () => void`
    - Return `null` when `queue.length === 0`
    - Display `queue[0]` — large icon (≥ 4rem), bold name, rarity label with color (`common` → `text-sky-400`, `rare` → `text-violet-500`, `epic` → `text-amber-400`), description, "Kamu baru mendapatkan badge ini!" text
    - Call `triggerConfetti()` via `useEffect` on mount of each new active badge (use `queue[0]?.id` as dependency)
    - "Keren! 🎉" button and backdrop overlay both call `onDismiss`
    - `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to badge name heading
    - `useEffect` to focus the dismiss button on open (focus trap)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 10.3_

  - [ ]* 8.2 Write component tests for `BadgeCelebrationModal` (`components/gamification/BadgeCelebrationModal.test.tsx`)
    - Renders nothing when `queue=[]`
    - Renders first badge when `queue` has entries
    - Calls `onDismiss` on "Keren! 🎉" button click
    - Calls `onDismiss` on backdrop click
    - `role="dialog"` and `aria-modal="true"` are present
    - _Requirements: 6.1, 6.4, 6.7_

  - [x] 8.3 Create `components/gamification/BadgeWall.tsx`
    - `'use client'` directive at top
    - Import `EarnedBadgeRow` and `BADGE_CATALOG` from `@/lib/gamification/badgeCatalog`
    - Props: `earnedBadges: EarnedBadgeRow[]`
    - Local `isOpen` state, default `true` (collapsible section)
    - Toggle button labelled "🏅 Badge Wall"
    - Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
    - Iterate `BADGE_CATALOG` (fixed order); for each badge:
      - **Earned** (badge_id present in `earnedBadges`): full color card — icon, name, rarity accent, description, `earned_at` formatted as `toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })`
      - **Locked**: same structure but `filter: grayscale(1) opacity(0.5)`, lock icon overlay (`🔒`), description as unlock hint
    - Container uses `bg-[#181c24]` / `var(--glass-bg)` and `var(--glass-border)`
    - Rarity accent: `common` → `text-sky-400`, `rare` → `text-violet-500`, `epic` → `text-amber-400`
    - No data fetching — purely presentational
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 10.3_

  - [ ]* 8.4 Write component tests for `BadgeWall` (`components/gamification/BadgeWall.test.tsx`)
    - With `earnedBadges=[]`, all 7 cards render in locked state
    - With one earned badge, that card renders in full color and the other 6 are greyed
    - `earned_at` formats correctly in Indonesian locale
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 9. Integration into existing components
  - [x] 9.1 Modify `components/assessment/AssessmentModal.tsx`
    - Import `BadgeDefinition` from `@/lib/gamification/badgeCatalog`
    - Update `AssessmentModalProps.onSuccess` from `() => void` to `(newBadges: BadgeDefinition[]) => void`
    - In `handleResultClose`, cast `submittedResult` to `AssessmentSubmitResult & { newBadges?: BadgeDefinition[] }` and call `onSuccess(badges.newBadges ?? [])`
    - All existing callers of `AssessmentModal` that pass `onSuccess` must be updated to accept the new signature (check `QuestMap.tsx` and any other consumers)
    - _Requirements: 5.3_

  - [x] 9.2 Modify `components/quest-map/QuestMap.tsx`
    - Add props to `QuestMapProps`: `totalXP: number`, `earnedBadges: EarnedBadgeRow[]`, `onAssessmentSuccess?: (newBadges: BadgeDefinition[]) => void`
    - Replace `triggerConfetti` function definition with import from `@/lib/triggerConfetti` (completes task 4.1)
    - Pass `totalXP` (not `engineXpTotal`) to `GamificationHeader` as `xpTotal`; keep `engineXpTotal` for `CustomizeHeroModal stats.xp` (unchanged)
    - Add `<BadgeWall earnedBadges={earnedBadges} />` below the `BadgePanel` section and above the module path sections
    - Wire `AssessmentModal.onSuccess` to call `onAssessmentSuccess?.(newBadges)`
    - Import `BadgeWall` from `@/components/gamification/BadgeWall`
    - Import `EarnedBadgeRow`, `BadgeDefinition` types from `@/lib/gamification/badgeCatalog`
    - _Requirements: 7.1, 8.5_

  - [x] 9.3 Modify `app/student/page.tsx` — `StudentDashboard` component
    - Import `BadgeDefinition`, `EarnedBadgeRow` from `@/lib/gamification/badgeCatalog`
    - Import `BadgeCelebrationModal` from `@/components/gamification/BadgeCelebrationModal`
    - Add state: `badgeQueue: BadgeDefinition[]`, `earnedBadges: EarnedBadgeRow[]`, `totalXP: number` (init 0), `level: number` (init 1)
    - In the dashboard fetch callback, set `totalXP` from `data.totalXP ?? data.engineXpTotal`, `level` from `data.level ?? 1`, `earnedBadges` from `data.earnedBadges ?? []`
    - Add `enqueueBadges(newBadges: BadgeDefinition[])` callback using `useCallback`; accumulates into `badgeQueue`
    - Extend `useLmsEngineListener` `onSynced` to accept the new third arg `newBadges` and call `enqueueBadges(newBadges)` then `void fetchDashboard()`
    - Pass `onAssessmentSuccess={(newBadges) => { enqueueBadges(newBadges); void fetchDashboard(); }}` to `QuestMap`
    - Pass `totalXP`, `earnedBadges` to `QuestMap` props
    - Add `handleBadgeDismiss` callback: `setBadgeQueue((prev) => prev.slice(1))`
    - Render `<BadgeCelebrationModal queue={badgeQueue} onDismiss={handleBadgeDismiss} />` inside the page (outside QuestMap, at page root level)
    - _Requirements: 1.5, 5.1, 5.2, 5.3, 6.1, 6.5, 6.8, 8.1, 8.5_

- [x] 10. Checkpoint — run all tests
  - Run `npx vitest --run` to execute the full test suite
  - Ensure all tests pass; ask the user if any questions arise.

- [ ] 11. Final integration tests
  - [ ]* 11.1 Write API integration tests for `GET /api/student/dashboard`
    - Response contains `totalXP: number`, `level: number`, `earnedBadges: Array<{ badge_id, earned_at }>` fields
    - `engineXpTotal` field is still present and unchanged
    - _Requirements: 8.1, 8.4_

  - [ ]* 11.2 Write API integration tests for `POST /api/student/engine-sync`
    - Response contains `ok: true` and `newBadges` field that is an array
    - `newBadges` is `[]` when no new badges are earned
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ]* 11.3 Write API integration tests for `POST /api/student/assessment/submit`
    - Response contains `newBadges` field alongside existing `AssessmentSubmitResult` fields
    - `newBadges` is `[]` when no new badges are earned
    - _Requirements: 5.3, 5.4_

- [-] 12. Git push to feature branch
  - Create a new feature branch: `git checkout -b feature/xp-badge-system`
  - Stage all new and modified files (be specific — do not use `git add .`)
    - New: `supabase/migrations/20250610_001_student_badges.sql`
    - New: `lib/gamification/badgeCatalog.ts`, `lib/gamification/xpCalculator.ts`, `lib/gamification/badgeEvaluator.ts`, `lib/triggerConfetti.ts`
    - New: `components/gamification/BadgeCelebrationModal.tsx`, `components/gamification/BadgeWall.tsx`
    - New: all test files under `lib/gamification/`
    - Modified: `app/api/student/engine-sync/route.ts`, `app/api/student/assessment/submit/route.ts`, `app/api/student/dashboard/route.ts`
    - Modified: `lib/useLmsEngineListener.ts`, `components/quest-map/QuestMap.tsx`, `components/assessment/AssessmentModal.tsx`, `app/student/page.tsx`
  - Commit: `git commit -m "feat: XP & Badge Gamification System"`
  - Push: `git push -u origin feature/xp-badge-system`
  - Create PR using `gh pr create` with title "feat: XP & Badge Gamification System" and a description summarising the four delivery pillars

- [~] 13. Final checkpoint
  - Ensure all tests pass, the feature branch PR is open, and the implementation is complete.
  - Ask the user if any questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 6, 10, 13) ensure incremental validation at logical seams
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- `GamificationHeader` requires no interface change — the caller (QuestMap) switches from `engineXpTotal` to `totalXP` for the `xpTotal` prop; the component's internal `calcLevel` already uses the identical formula
- The `student_badges` migration must be applied via Supabase Dashboard > SQL Editor before the server tests can run against a live DB; the property/unit tests mock the DB layer and work without it

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1", "4.1", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 3, "tasks": ["5.5", "5.6", "7.1", "7.2", "7.3", "7.4"] },
    { "id": 4, "tasks": ["8.1", "8.3"] },
    { "id": 5, "tasks": ["8.2", "8.4", "9.1"] },
    { "id": 6, "tasks": ["9.2"] },
    { "id": 7, "tasks": ["9.3"] },
    { "id": 8, "tasks": ["11.1", "11.2", "11.3"] }
  ]
}
```
