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

Apply migrations **in order** via Supabase Dashboard → SQL Editor:

1. `20250601_001_phase_a_authoring_foundation.sql`
2. `20250602_001_topic_progress_columns.sql`
3. `20250603_001_parent_links.sql`
4. `20250604_001_add_student_modules_status.sql`
5. `20250605_001_engine_progress.sql` ← Lesson Engine state persistence
6. `20250606_001_student_avatars_and_titles.sql`
7. `20250607_001_module_assessments.sql` ← Module Tryout (3 tables)
8. `20250610_001_student_badges.sql` ← XP & Badge system

## Running Tests

```bash
npm run test        # run all tests once
npm run test:watch  # watch mode
```

---

## Admin Setup Checklist (Do This Now!)

Before students can see lessons in the Quest Map, each topic needs an `engine_topic_id` set:

1. Go to `/admin/modules/[id]/topics`
2. Click **Edit Topik** on each topic
3. In the **"Hubungkan ke Lesson Engine"** dropdown, pick the matching lesson
   - e.g., "beginner-html-01 — Build Your First Web Page"
4. Click **Simpan**
5. After saving, click **🚀 Publish Sekarang!** on that topic

The lesson will then appear as a **"▶ Buka"** or **"🚀 Mulai!"** button on the student's Quest Map.

Clicking it opens the lesson in a **new browser tab**. When the student completes the lesson, XP and progress are saved automatically.

---

## Vercel Deployment

Both projects are deployed and linked:

| Project | URL |
|---|---|
| LMS | https://bits2bytes.vercel.app |
| Lesson Engine | https://bits2bytes-lesson-engine.vercel.app |

The LMS proxies `/learning/*` → Engine. Env vars set on Vercel:
- `LESSON_ENGINE_URL` = `https://bits2bytes-lesson-engine.vercel.app`
- `NEXT_PUBLIC_LESSON_ENGINE_URL` = `https://bits2bytes-lesson-engine.vercel.app`

---

## Next Tasks (Backlog)

### ✅ 1. Fix: Topic unlock via quiz completion — DONE
Added signal (c) to `lib/topicUnlock.ts`: quiz attempt now unlocks a topic.

### ✅ 2. Lesson Engine: Mimo/Duolingo style — DONE
Full rework: TopProgressBar, StickyCtaBar, one node per screen, quiz one question at a time.

### ✅ 3. LMS Learning Path: Quiz score di setiap topik — DONE
`Quiz ✓ 80` badge on completed topics; `📝 Kerjakan Quiz!` nudge when not attempted.

### ✅ 4. UI: Light mode contrast — DONE
Stronger borders, blue-tinted backgrounds, deeper accent color `#2563eb`.

---

### 5. Lesson Engine: postMessage sync after new-tab completion

**Context:** Lessons now open in new tab. When student completes and closes the tab, the LMS polls `fetchData()` after 3s. But if the student takes longer, the progress won't reflect until they manually refresh.

**Solution options:**
- (A) Student clicks "Kembali ke Dashboard" button inside engine → engine fires postMessage → LMS catches it via `useLmsEngineListener` (already wired)
- (B) Add a visible "Saya Sudah Selesai" button on the student dashboard that manually refreshes progress

**Files:** `app/student/page.tsx` (increase poll interval or add refresh button)

---

### 6. Admin: Built-in lesson browser

**Context:** Admin has to manually type or select `engine_topic_id` from a dropdown. For topics like `beginner-scratch-01` to `beginner-scratch-21`, this is tedious.

**Yang diinginkan:** A preview panel that shows the lesson title/description/objectives when admin selects an `engine_topic_id`, so they can verify before saving.

**Files:** `app/admin/modules/[id]/topics/TopicList.tsx`

---

### 7. Admin: 3-Tab Topic Management (PRIORITY NEXT)

Rework `/admin/modules/[id]/topics` menjadi 3 tab yang jelas.

**Tab 1 — Input Manual**
- Admin input: Judul Topik, Deskripsi Materi, Embed code (Coddy Tech / Canva iframe)
- Admin kelola quiz sendiri via "Kelola Quiz" link
- Tidak perlu engine_topic_id atau lesson JSON
- Flow: Simpan → Publish → Siswa bisa akses → dapat XP/badge/achievement
- Quiz dikelola manual di `/admin/modules/[id]/topics/[topicId]/quiz`

**Tab 2 — Engine Lesson**
- Admin pilih lesson dari `public/lessons/` yang sudah ada di engine
- Dropdown/browser yang menampilkan lesson dari `topicRegistry.ts` (semua 45+ lesson: HTML 01–24, Scratch 01–21)
- Admin hanya input Judul Topik — deskripsi, quiz, materi sudah ada di lesson JSON
- Tidak perlu kelola quiz manual karena quiz sudah ada di dalam lesson JSON
- Flow: Pilih lesson → Simpan (auto set engine_topic_id) → Publish → Siswa bisa akses → dapat XP/badge/achievement

**Tab 3 — Bulk Upload CSV**
- Upload CSV yang berisi: Judul, Deskripsi, Materi (nodes), Quiz sekaligus
- Template CSV sudah tersedia di `/public/templates/lesson-template.csv`
- CSV diparse → disimpan ke `lesson_content` di DB → admin tinggal Publish
- Flow: Upload CSV → Review hasil → Publish → Siswa bisa akses → dapat XP/badge/achievement

**Files to modify:**
- `app/admin/modules/[id]/topics/page.tsx` — replace 2-section layout with 3-tab UI
- `app/admin/modules/[id]/topics/AddTopicForm.tsx` — rename/repurpose as ManualInputTab
- `app/admin/modules/[id]/topics/CsvImportForm.tsx` — becomes Tab 3 content
- New: `app/admin/modules/[id]/topics/EngineTopicTab.tsx` — Tab 2 with lesson browser

**Key constraint:** All 3 paths must result in a topic that is publishable and accessible by students in the Quest Map, awarding XP/badges/achievements on completion.
