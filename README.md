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

## Next Tasks (Backlog)

### 1. Fix: Topic 1 masih terkunci padahal Sarah sudah selesaikan quiz

**Context:** Sarah sudah menyelesaikan beberapa topik dan quiz di modul "Basic Visual Web", tapi Topic 1 masih terkunci di Learning Path.

**Root cause to investigate:**
- Topic unlock di `lib/topicUnlock.ts` pakai 2 sinyal: (a) `meeting_students.has_joined = true` dan (b) `topic_progress` dari lesson engine. Kalau topic belum punya `engine_topic_id` yang diisi, sinyal (b) tidak aktif sama sekali.
- Kemungkinan: unlock hanya terjadi saat siswa JOIN meeting, bukan saat selesaikan quiz. Perlu dikaji apakah quiz completion seharusnya juga bisa membuka topik berikutnya tanpa harus join meeting.
- Cek di admin apakah semua topik di modul "Basic Visual Web" sudah diisi `engine_topic_id`-nya.

**Files:** `lib/topicUnlock.ts`, `/admin/modules/[id]/topics`

---

### 2. Lesson Engine: Rework tampilan ke gaya Mimo/Duolingo

**Context:** Format lesson engine sekarang linear panjang. JSON lesson sudah bagus — `learningPath` berisi node `lesson`, `code`, `practice`, `challenge`, `quiz` secara terurut (lihat `public/lessons/beginner/html/beginner-html-01.json`). Tinggal tampilannya yang perlu diubah.

**Yang diinginkan:**
- Tampilkan 1 node per layar — student klik "Lanjut" untuk maju
- Setelah setiap node materi (lesson/code), langsung muncul pertanyaan/practice di layar yang sama
- Di akhir semua node materi, baru tampilkan quiz final sebelum completion screen
- Progress bar di atas menunjukkan posisi node saat ini dari total node

**Repo:** `bits2bytes-lesson-engine` — `src/app/lesson/`, `src/components/`

---

### 3. LMS Learning Path: Tampilkan quiz score di setiap topik

**Context:** Di tab Learning Path, topik yang sudah dikerjakan tampil sebagai checklist, tapi tidak ada info skor quiz. Data sudah ada di `quizAttempts` yang di-fetch dashboard.

**Yang diinginkan:**
- Tampilkan best quiz score di bawah nama topik yang sudah dibuka
- Format: badge kecil `Quiz ✓ 80` atau `Quiz: 80/100`
- Kalau belum ada attempt, tidak perlu tampilkan apa-apa

**Files:** `components/quest-map/TopicNode.tsx`, `components/quest-map/ModulePathSection.tsx`

---

### 4. UI: Light mode terlalu samar — perkuat border dan warna card

**Context:** Di light mode, border card tipis/transparan sehingga konten sulit dibaca. Perlu disesuaikan dengan color theme logo Bits2Bytes.

**Yang diinginkan:**
- Border card lebih tegas di light mode (misal `border-slate-300` atau lebih gelap)
- Background card lebih kontras — putih bersih atau warna sangat muda
- Aksen warna (brand primary/secondary) disesuaikan dengan palet logo Bits2Bytes
- Update CSS variables light mode di `app/globals.css`: `--glass-border`, `--glass-bg`, `--text-primary`, `--text-secondary`

**Files:** `app/globals.css`, `css/`, komponen yang pakai `var(--glass-*)` variables

---
