# Requirements Document

## Introduction

The **XP & Badge Gamification System** adds a persistent, cross-session progression layer to the Bits2Bytes LMS student experience. It enriches the existing `GamificationHeader` and `QuestMap` UI with:

1. A **unified XP total** that combines topic lesson XP and assessment bonus XP into a single level score, surfaced on the student dashboard.
2. A **persistent badge system** — a `student_badges` database table records each badge the student earns; badge unlocks are checked server-side whenever progress events occur.
3. A **badge celebration popup** on the student dashboard that fires an animated confetti modal for each newly earned badge.
4. A **badge wall section** inside the Quest Map that shows every badge in the catalog — earned badges in full color with earned date, locked badges greyed out with an unlock hint.

The feature targets deployment on Vercel (Edge/serverless), so no Node.js-only runtime APIs may be used.

---

## Glossary

- **XP_Engine**: Experience points stored in `topic_progress.xp_earned`, awarded by the lesson engine on `LESSON_COMPLETE`.
- **XP_Assessment**: Bonus XP derived from a module assessment attempt: `floor(best_score / 100 * 50)` per assessment; only the student's best score counts.
- **Total_XP**: `sum(XP_Engine) + sum(XP_Assessment)` across all of a student's records.
- **Level**: `floor(Total_XP / 100) + 1`. Level 1 = 0–99 XP, Level 2 = 100–199 XP, etc.
- **Badge**: A named achievement with an `id`, `name`, `icon` (emoji), `description`, and `rarity` (common | rare | epic).
- **Badge_Catalog**: The static list of all seven defined badges (see Requirement 3).
- **Badge_Evaluator**: The server-side function that checks which new badges a student has earned and persists them to `student_badges`.
- **Student_Dashboard**: The API response from `GET /api/student/dashboard` consumed by the student frontend.
- **Engine_Sync_API**: `POST /api/student/engine-sync` — receives `LESSON_COMPLETE` and `QUIZ_SUBMITTED` events from the lesson engine iframe.
- **Assessment_Submit_API**: `POST /api/student/assessment/submit` — processes module assessment submissions.
- **Badge_Wall**: The UI section inside the Quest Map displaying all badges in the catalog.
- **Badge_Popup**: The animated in-dashboard modal that celebrates a newly earned badge.
- **Newly_Earned_Badges**: Badges that were awarded during the current API call and were not present in `student_badges` before that call.

---

## Requirements

### Requirement 1: Unified XP Computation

**User Story:** As a student, I want my XP total to reflect both lesson progress and assessment performance, so that my level accurately represents my overall learning achievements.

#### Acceptance Criteria

1. THE `XP_Calculator` SHALL compute `Total_XP` as the sum of all `topic_progress.xp_earned` rows for a student plus the sum of `floor(best_score / 100 * 50)` for each distinct `module_assessment_attempts` record where the `best_score` is the student's highest score per assessment.
2. THE `XP_Calculator` SHALL use only one `module_assessment_attempts` row per `(student_id, assessment_id)` pair — the row with the highest `score` — when computing `XP_Assessment`, so that a student who attempts the same assessment twice is not double-counted.
3. WHEN a student has no `topic_progress` rows and no `module_assessment_attempts` rows, THE `XP_Calculator` SHALL return `Total_XP` of 0 and `Level` of 1.
4. THE `Level_Formula` SHALL be `floor(Total_XP / 100) + 1`, producing Level 1 for 0–99 XP, Level 2 for 100–199 XP, and so on with no upper cap enforced by the formula.
5. THE `Student_Dashboard` API response SHALL include a `totalXP` field (integer, `XP_Engine + XP_Assessment`) and a `level` field (integer, derived from `Level_Formula`) in addition to the existing `engineXpTotal` field.

---

### Requirement 2: Badge Database Table

**User Story:** As a student, I want my badges to be saved persistently, so that I don't lose earned achievements across sessions or device changes.

#### Acceptance Criteria

1. THE `Database` SHALL contain a `student_badges` table with columns: `id` (serial primary key), `student_id` (UUID, FK → `auth.users.id`, ON DELETE CASCADE), `badge_id` (TEXT, NOT NULL), `earned_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now()).
2. THE `student_badges` table SHALL enforce a UNIQUE constraint on `(student_id, badge_id)` so that each badge is recorded at most once per student.
3. THE `student_badges` table SHALL have Row Level Security enabled with a `service_role` full-access policy, matching the pattern used by `module_assessment_attempts`.
4. IF an insert to `student_badges` violates the unique constraint (badge already earned), THEN THE `Badge_Evaluator` SHALL silently ignore the conflict and continue processing remaining badges.

---

### Requirement 3: Badge Catalog Definition

**User Story:** As a student, I want a clear set of meaningful badges, so that I know what to work towards.

#### Acceptance Criteria

1. THE `Badge_Catalog` SHALL define exactly the following seven badges with the specified attributes:

   | badge_id | name | icon | rarity | description | Trigger condition |
   |---|---|---|---|---|---|
   | `first-lesson` | Langkah Pertama | 🌱 | common | Selesaikan lesson pertama | Completed topics ≥ 1 |
   | `lesson-streak-3` | Trio Pejuang | ⚡ | common | Selesaikan 3 lesson | Completed topics ≥ 3 |
   | `lesson-streak-10` | Petarung Sejati | 🏆 | rare | Selesaikan 10 lesson | Completed topics ≥ 10 |
   | `perfect-quiz` | Nilai Sempurna | 💯 | epic | Raih skor 100 pada quiz atau assessment mana pun | Any quiz or assessment score = 100 |
   | `first-module` | Modul Pertama Selesai | 🎓 | rare | Selesaikan seluruh topik pada satu modul | At least 1 module complete |
   | `quiz-master` | Quiz Master | 🧠 | rare | Raih skor ≥ 90 pada 5 quiz berbeda | Count of distinct quizzes with score ≥ 90 ≥ 5 |
   | `tryout-ace` | Jagoan Tryout | 🎯 | epic | Raih skor ≥ 80 pada assessment modul mana pun | Any `best_score` in `module_assessment_attempts` ≥ 80 |

2. THE `Badge_Catalog` SHALL be defined as a TypeScript constant exported from `lib/gamification/badgeCatalog.ts` and SHALL be the single source of truth referenced by both the Badge_Evaluator and the Badge_Wall UI.
3. THE `Badge_Catalog` SHALL expose a typed `BadgeDefinition` interface with fields: `id: string`, `name: string`, `icon: string`, `rarity: 'common' | 'rare' | 'epic'`, `description: string`.

---

### Requirement 4: Badge Evaluator

**User Story:** As a student, I want badges to be awarded automatically when I meet the unlock conditions, so that I never miss an achievement I have earned.

#### Acceptance Criteria

1. THE `Badge_Evaluator` SHALL be a server-side function that accepts `studentId` and returns an array of `BadgeDefinition` objects representing Newly_Earned_Badges.
2. WHEN invoked, THE `Badge_Evaluator` SHALL query `topic_progress`, `quiz_attempts`, `module_assessment_attempts`, `student_modules`, and `student_badges` for the given student in order to evaluate all seven badge conditions.
3. FOR each badge in the `Badge_Catalog` whose condition is satisfied AND whose `badge_id` is not already present in `student_badges` for that student, THE `Badge_Evaluator` SHALL insert a row into `student_badges` and include that badge in the returned array.
4. THE `Badge_Evaluator` SHALL evaluate all seven badges in a single invocation — it SHALL NOT stop after the first new badge is found.
5. IF any database query within THE `Badge_Evaluator` fails, THEN THE `Badge_Evaluator` SHALL log the error and return an empty array so that the calling API route is not blocked.
6. THE `Badge_Evaluator` SHALL count completed topics using `topic_progress` rows with a non-null `completed_at` field.
7. THE `Badge_Evaluator` SHALL count modules as complete by delegating to the existing `resolveModuleCompletionMap` function from `lib/moduleCompletion.ts`.
8. THE `Badge_Evaluator` SHALL count quiz scores using `quiz_attempts.score` (for engine-sourced topic quizzes) AND `module_assessment_attempts.best_score` (for module assessments) when evaluating `perfect-quiz` and `quiz-master`.

---

### Requirement 5: Badge Evaluation Trigger Points

**User Story:** As a student, I want badges to be checked immediately after I complete any learning activity, so that I see my achievement celebration right away.

#### Acceptance Criteria

1. WHEN the `Engine_Sync_API` processes a `LESSON_COMPLETE` event successfully, THE `Engine_Sync_API` SHALL invoke the `Badge_Evaluator` and include the array of Newly_Earned_Badges as a `newBadges` field in the JSON response.
2. WHEN the `Engine_Sync_API` processes a `QUIZ_SUBMITTED` event successfully, THE `Engine_Sync_API` SHALL invoke the `Badge_Evaluator` and include the array of Newly_Earned_Badges as a `newBadges` field in the JSON response.
3. WHEN the `Assessment_Submit_API` inserts a new attempt successfully, THE `Assessment_Submit_API` SHALL invoke the `Badge_Evaluator` and include the array of Newly_Earned_Badges as a `newBadges` field in the JSON response alongside the existing `AssessmentSubmitResult` fields.
4. IF the `Badge_Evaluator` returns an empty array, THE respective API SHALL include `newBadges: []` in the response so that the client does not need to handle a missing field.
5. THE `Student_Dashboard` API response SHALL include an `earnedBadges` field: an array of objects `{ badge_id: string, earned_at: string }` representing all badges the student has earned, fetched from `student_badges`.

---

### Requirement 6: Badge Celebration Popup

**User Story:** As a student, I want to see an animated celebration modal when I earn a new badge, so that achieving milestones feels rewarding and motivating.

#### Acceptance Criteria

1. WHEN the student dashboard receives a response from `Engine_Sync_API` or `Assessment_Submit_API` containing one or more items in `newBadges`, THE `BadgeCelebrationModal` component SHALL display for each badge sequentially (one modal at a time, auto-advancing after dismiss).
2. THE `BadgeCelebrationModal` SHALL display: the badge `icon` at large size (≥ 4rem), the badge `name` in bold, the `rarity` label styled with a rarity-specific color (common = sky-blue, rare = violet, epic = amber/gold), the `description`, and the text "Kamu baru mendapatkan badge ini!" in Indonesian.
3. THE `BadgeCelebrationModal` SHALL trigger a confetti animation on open, using the same animejs-based `triggerConfetti` utility already present in `QuestMap.tsx`.
4. THE `BadgeCelebrationModal` SHALL be dismissible by clicking a "Keren! 🎉" button or by clicking the backdrop overlay.
5. WHEN multiple new badges are earned in a single activity, THE `BadgeCelebrationModal` SHALL display them one at a time in catalog order; after the student dismisses one, the next SHALL appear automatically.
6. THE `BadgeCelebrationModal` SHALL be a client-side React component and SHALL NOT require a page reload to appear.
7. THE `BadgeCelebrationModal` SHALL have `role="dialog"` and `aria-modal="true"` for screen-reader accessibility.
8. IF the `BadgeCelebrationModal` is already open for a badge celebration and a new `newBadges` response arrives, THE component SHALL queue the additional badges and display them after the current one is dismissed.

---

### Requirement 7: Badge Wall UI

**User Story:** As a student, I want to see all available badges in one place, so that I understand what achievements exist and which ones I've already earned.

#### Acceptance Criteria

1. THE `BadgeWall` component SHALL render inside the `QuestMap` area of the student dashboard, positioned below the `BadgePanel` (achievement badges) section and above the module path sections.
2. THE `BadgeWall` SHALL display all seven badges from the `Badge_Catalog` in a responsive grid (minimum 2 columns on mobile, up to 4 columns on larger screens).
3. FOR each badge the student has earned (present in `earnedBadges` from the dashboard response), THE `BadgeWall` SHALL render the badge card in full color with: the `icon`, `name`, rarity color accent, `description`, and the `earned_at` date formatted as a localised short date in Indonesian (e.g., "12 Jun 2025").
4. FOR each badge the student has NOT yet earned, THE `BadgeWall` SHALL render the badge card in greyscale with a lock icon overlay and the `description` as the unlock hint text.
5. THE `BadgeWall` rarity accent colors SHALL match: `common` → sky-400 (`#38bdf8`), `rare` → violet-500 (`#8b5cf6`), `epic` → amber-400 (`#fbbf24`).
6. THE `BadgeWall` SHALL be a collapsible section with a toggle button labelled "🏅 Badge Wall" that starts expanded by default.
7. THE `BadgeWall` design SHALL use the dark-card gamification aesthetic — `bg-[#181c24]` or the CSS variable `var(--glass-bg)` for the container background and `var(--glass-border)` for borders — consistent with the existing `GamificationHeader` and `BadgePanel` components.
8. THE `BadgeWall` SHALL receive `earnedBadges` as a prop and SHALL NOT perform its own data fetching.

---

### Requirement 8: Dashboard Data Contract Update

**User Story:** As a developer, I want the dashboard API to expose all XP and badge data in a single response, so that the frontend requires only one network request at page load.

#### Acceptance Criteria

1. THE `Student_Dashboard` API response type SHALL be extended with: `totalXP: number`, `level: number`, `earnedBadges: Array<{ badge_id: string; earned_at: string }>`.
2. THE `Student_Dashboard` API SHALL compute `totalXP` and `level` using the `XP_Calculator` logic (Requirement 1) in the same GET handler, not via a separate API call.
3. IF the `student_badges` table query fails, THE `Student_Dashboard` API SHALL return `earnedBadges: []` and continue serving the rest of the response (graceful degradation matching the existing pattern).
4. THE existing `engineXpTotal` field SHALL remain in the response for backward compatibility; it SHALL continue to reflect the sum of `topic_progress.xp_earned` only (unchanged).
5. WHEN the `GamificationHeader` component receives `totalXP`, it SHALL use `totalXP` for the XP display and level calculation instead of `engineXpTotal`, so that assessment XP contributes visually to the level progress bar.

---

### Requirement 9: Database Migration

**User Story:** As a developer, I want a SQL migration file that creates the `student_badges` table, so that the schema change is version-controlled and reproducible.

#### Acceptance Criteria

1. THE migration file SHALL be located at `supabase/migrations/20250610_001_student_badges.sql` (or a date-appropriate filename following the existing naming convention).
2. THE migration SHALL use `CREATE TABLE IF NOT EXISTS` for the `student_badges` table so that re-running the migration is idempotent.
3. THE migration SHALL add the UNIQUE constraint on `(student_id, badge_id)` using the same idempotent `DO $$ BEGIN … END$$` pattern used in `20250607_001_module_assessments.sql`.
4. THE migration SHALL enable Row Level Security on `student_badges` and create a `service_role` full-access policy using the same idempotent policy creation pattern as existing migrations.
5. THE migration file SHALL include a descriptive header comment listing the table created, the satisfying requirements, and the application method (Supabase Dashboard > SQL Editor).

---

### Requirement 10: Vercel / Edge Compatibility

**User Story:** As a developer, I want the entire feature to deploy without errors on Vercel's serverless runtime, so that production students are not affected by deployment failures.

#### Acceptance Criteria

1. THE `Badge_Evaluator`, `XP_Calculator`, and all new API route handlers SHALL use only the Supabase client (`getSupabaseAdmin`) and standard Web/Node.js APIs available in the Vercel serverless (Node.js 18+) runtime — no `fs`, `child_process`, or other Node.js-only APIs that are blocked on Vercel Edge Functions.
2. THE `Badge_Catalog` TypeScript module SHALL contain no dynamic `require()` calls and SHALL be statically importable.
3. THE `BadgeCelebrationModal` and `BadgeWall` components SHALL be marked `'use client'` and SHALL NOT use `next/headers`, `next/cookies`, or any server-only Next.js 15/16 imports.
4. THE migration file is purely SQL and has no runtime dependency on Node.js; it satisfies this requirement by design.
