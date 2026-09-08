# Bits2Bytes LMS

Next.js 16 learning management system with Supabase backend.

## Getting Started

```bash
npm run dev   # starts on http://localhost:3000
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server only) |
| `NEXT_PUBLIC_LESSON_ENGINE_URL` | ✅ | Full URL of the Lesson Engine deployment (e.g. `https://engine.bits2bytes.id`). Used as the origin for postMessage validation in `useLmsEngineListener`. |
| `LESSON_ENGINE_URL` | ⚠️ optional | Server-only URL for the `/learning/*` proxy rewrite. Falls back to `NEXT_PUBLIC_LESSON_ENGINE_URL` then `http://localhost:3001`. |

### Lesson Engine Integration

The LMS proxies `/learning/*` to the Lesson Engine via `next.config.ts` rewrites.
This makes the engine same-origin when accessed from the LMS iframe, avoiding CORS.

```
/learning/lesson/beginner-html-01  →  {LESSON_ENGINE_URL}/lesson/beginner-html-01
```

The `EngineModal` component opens a full-screen iframe at `/learning/lesson/{topicId}` and
passes `studentId`, `theme`, `lang`, and `lmsOrigin` as query parameters.

The engine sends `postMessage` events back to the LMS:
- `LESSON_COMPLETE` — topic finished; LMS saves XP + score to `topic_progress`
- `QUIZ_SUBMITTED` — quiz attempt; LMS upserts `quiz_attempts`
- `XP_UPDATE` — incremental XP; informational only

## Architecture

```
LMS (port 3000)
  /learning/* → Engine proxy rewrite
  EngineModal  → iframe → Engine
  useLmsEngineListener → /api/student/engine-sync → Supabase
  /api/engine/progress  → engine_progress table (HybridAdapter sync)

Engine (port 3001)
  HybridAdapter: Supabase (primary) + localStorage (fallback)
  useLmsPostMessage: sends events to LMS parent window
```

## Database Migrations

Apply migrations in order via Supabase Dashboard → SQL Editor:

1. `20250601_001_phase_a_authoring_foundation.sql`
2. `20250602_001_topic_progress_columns.sql`
3. `20250603_001_parent_links.sql`
4. `20250604_001_add_student_modules_status.sql`
5. `20250605_001_engine_progress.sql` ← Lesson Engine state persistence

## Running Tests

```bash
npm run test        # run all tests once
npm run test:watch  # watch mode
```
