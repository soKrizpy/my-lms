# Implementation Plan: Pause Learning Path

## Overview

Implementasi fitur ini mencakup dua repositori: perubahan skema database + API + Admin UI di `bits2bytes-lms`, dan komponen visual modul dijeda di `bits2bytes-lesson-engine`. Semua modifikasi terbatas pada kolom `status` di tabel `student_modules` — tabel skor (`topic_progress`, `quiz_attempts`, `xp_earned`) tidak pernah disentuh.

## Tasks

- [x] 1. Database migration dan tipe TypeScript
  - [x] 1.1 Buat migration SQL untuk kolom `status` dan RPC `activate_learning_path`
    - Buat file `supabase/migrations/20250604_001_add_student_modules_status.sql`
    - Tambah kolom `status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused'))` ke tabel `student_modules` dengan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
    - Tambah `UPDATE student_modules SET status = 'active' WHERE status IS NULL` untuk back-fill data lama
    - Buat Postgres function `activate_learning_path(p_student_id UUID, p_module_id INTEGER)` sebagai RPC dengan `SECURITY DEFINER` yang melakukan dua UPDATE dalam satu implicit transaction
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.3_

  - [x] 1.2 Tambah tipe `ModuleStatus` dan `StudentModuleRow` ke `lib/lmsData.ts`
    - Export `type ModuleStatus = 'active' | 'paused'`
    - Export `interface StudentModuleRow { student_id: string; module_id: number; status: ModuleStatus; }`
    - _Requirements: 1.1_

- [x] 2. Endpoint baru: `PATCH /api/admin/students/[id]/modules/[moduleId]/status`
  - [x] 2.1 Buat file route handler `app/api/admin/students/[id]/modules/[moduleId]/status/route.ts`
    - Definisikan `interface StatusRequestBody { action: 'pause' | 'activate' }` dan interface response
    - Parse dan validasi body JSON — kembalikan HTTP 400 `{ error: "Action tidak valid." }` jika `action` bukan `"pause"` atau `"activate"`
    - Cek eksistensi rekord `student_modules` untuk kombinasi `(student_id, module_id)` — kembalikan HTTP 404 jika tidak ditemukan
    - Untuk `action = "pause"`: `UPDATE student_modules SET status = 'paused' WHERE student_id = id AND module_id = moduleId`
    - Untuk `action = "activate"`: panggil RPC `supabase.rpc('activate_learning_path', { p_student_id: id, p_module_id: moduleId })`
    - Return HTTP 200 `{ success: true, status: 'paused' | 'active' }` on success, HTTP 500 on DB error
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.1_

  - [ ]* 2.2 Tulis property test untuk validasi action endpoint
    - **Property 3: Invalid Action Returns 400**
    - **Validates: Requirements 3.5**
    - Test dengan berbagai nilai `action` yang tidak valid: `null`, `undefined`, `""`, `"stop"`, `123`, `true`
    - Verifikasi semua mengembalikan HTTP 400

- [x] 3. Update `GET /api/admin/students/[id]/details` untuk menyertakan `status`
  - [x] 3.1 Ubah query `student_modules` di `app/api/admin/students/[id]/details/route.ts`
    - Tambah field `status` ke select: `.select("module_id, status, modules(id, title, description)")`
    - Tambah field `status: sm.status as 'active' | 'paused'` ke objek modul yang dikembalikan dalam `modulesWithTopics`
    - _Requirements: 4.1, 4.2_

  - [ ]* 3.2 Tulis property test untuk field status pada response
    - **Property 5: Details API Always Includes Status Field**
    - **Validates: Requirements 4.1**
    - Test dengan mock data modul yang memiliki berbagai kombinasi status — verifikasi setiap objek modul di array `modules` selalu memiliki field `status` bernilai `'active'` atau `'paused'`

- [x] 4. Checkpoint — verifikasi API layer
  - Pastikan semua route handler baru dan yang dimodifikasi dapat dikompilasi tanpa error TypeScript.
  - Pastikan response shape dari `/details` mencakup `status` pada setiap modul.
  - Tanyakan ke user jika ada pertanyaan sebelum lanjut.

- [x] 5. Update `POST /api/modules/[moduleId]/assign` — upsert flow
  - [x] 5.1 Refactor `app/api/modules/[moduleId]/assign/route.ts` dari delete+insert ke upsert
    - Tambah query untuk mengetahui siswa mana yang sudah memiliki `status = 'active'` di `student_modules`
    - Buat array `rows` dengan `status: alreadyActiveSet.has(id) ? 'paused' : 'active'` untuk setiap `student_id`
    - Ganti `DELETE` + `INSERT` dengan: (1) `upsert(rows, { onConflict: 'student_id,module_id' })` untuk siswa baru/yang tetap, (2) `DELETE` hanya untuk siswa yang dihapus dari assignment (tidak ada di `studentIds` baru)
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 5.2 Tulis property test untuk assign flow
    - **Property 8: Assign Flow Respects Single-Active Rule**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Test case 1: siswa tanpa active module → modul baru harus `status = 'active'`
    - Test case 2: siswa dengan active module → modul baru harus `status = 'paused'`
    - Test case 3: rekord `student_modules` yang tidak terpengaruh mempertahankan status sebelumnya

- [x] 6. Update `StudentDetailPanel.tsx` — badge status + tombol Jeda/Aktifkan
  - [x] 6.1 Update interface `ModuleDetail` dan tambah state management di `app/admin/students/StudentDetailPanel.tsx`
    - Tambah field `status: 'active' | 'paused'` ke interface `ModuleDetail`
    - Tambah state `moduleStatuses: Record<number, 'active' | 'paused'>`, `statusLoading: Record<number, boolean>`, dan `statusError: string | null`
    - Inisialisasi `moduleStatuses` di `useEffect` saat `data` dimuat dari API
    - _Requirements: 5.1, 5.5_

  - [x] 6.2 Implementasi fungsi `handleStatusChange` dengan optimistic update dan rollback
    - Simpan state sebelum perubahan sebagai `previous`
    - Lakukan optimistic update: untuk `pause` set module ke `'paused'`; untuk `activate` set semua ke `'paused'` lalu target ke `'active'`
    - Set `statusLoading[moduleId] = true` selama request berlangsung
    - Panggil `PATCH /api/admin/students/${studentId}/modules/${moduleId}/status`
    - Jika gagal: rollback `moduleStatuses` ke `previous` dan set `statusError`
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 6.3 Render badge status dan tombol aksi di module header (tab Learning Path)
    - Tambah badge "Aktif" (hijau/emerald) atau "Dijeda" (amber) di samping judul modul
    - Tambah tombol "⏸ Jeda" untuk modul `active` (amber) dan "▶ Aktifkan" untuk modul `paused` (emerald)
    - Disable tombol saat `statusLoading[mod.id]` bernilai `true`, tampilkan spinner
    - Tampilkan error toast jika `statusError` tidak null, dengan tombol dismiss
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

  - [ ]* 6.4 Tulis property test untuk rendering badge dan tombol
    - **Property 6: Module Status Renders Correct Badge and Button**
    - **Validates: Requirements 5.1, 5.6**
    - Untuk setiap kombinasi `status` dalam array ModuleDetail, verifikasi: modul `active` menampilkan tepat satu tombol "Jeda", modul `paused` menampilkan tepat satu tombol "Aktifkan", badge status sesuai

- [x] 7. Checkpoint — verifikasi Admin UI LMS
  - Pastikan `StudentDetailPanel` merender badge dan tombol dengan benar untuk data modul dengan status campuran.
  - Pastikan TypeScript tidak ada error pada semua file yang dimodifikasi.
  - Tanyakan ke user jika ada pertanyaan sebelum lanjut ke Lesson Engine.

- [x] 8. Lesson Engine: tipe data dan komponen `ModuleSwitcher`
  - [x] 8.1 Buat file `src/types/module.ts` di `bits2bytes-lesson-engine`
    - Export `interface LmsTopic { id: number; title: string; engine_topic_id: string | null; isUnlocked: boolean; }`
    - Export `interface LmsModule { id: number; title: string; status: 'active' | 'paused'; topics: LmsTopic[]; }`
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.2 Buat komponen `src/components/ModuleSwitcher/ModuleSwitcher.tsx` di `bits2bytes-lesson-engine`
    - Definisikan `interface ModuleSwitcherProps { modules: LmsModule[]; activeModuleId: number | null; onSelectModule: (moduleId: number) => void; }`
    - Render `<nav aria-label="Learning Paths">` dengan setiap modul sebagai card
    - Modul `paused`: `opacity-50`, `cursor-not-allowed`, `aria-disabled={true}`, `tabIndex={-1}`, label "Sedang Dijeda" (menggunakan translation key), klik diblokir (`!isPaused && onSelectModule(mod.id)`)
    - Modul `active`/selected: tampilan normal, dapat diklik, keyboard accessible (`Enter`/`Space`)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 8.3 Tulis property test untuk `ModuleSwitcher`
    - **Property 7: Paused Module Renders Greyed-Out With Navigation Disabled**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - Untuk setiap array modul dengan kombinasi status, verifikasi: modul `paused` memiliki `opacity-50` dan label "Sedang Dijeda", klik/keyboard tidak memicu `onSelectModule`, modul `active` dapat diklik normal

- [x] 9. Tambah translation keys ke messages i18n
  - [x] 9.1 Tambah keys `module` ke `messages/id.json` di `bits2bytes-lesson-engine`
    - Tambah object `"module": { "paused": "Sedang Dijeda", "active": "Aktif", "switcher": { "aria": "Daftar Learning Path" } }` ke file JSON yang sudah ada
    - _Requirements: 6.1_

  - [x] 9.2 Tambah keys `module` ke `messages/en.json` di `bits2bytes-lesson-engine`
    - Tambah object `"module": { "paused": "Paused", "active": "Active", "switcher": { "aria": "Learning Path List" } }` ke file JSON yang sudah ada
    - _Requirements: 6.1_

- [x] 10. Checkpoint akhir — verifikasi penuh
  - Pastikan semua file di kedua repositori dikompilasi tanpa error TypeScript.
  - Pastikan `ModuleSwitcher` memblokir navigasi untuk modul paused dan mengizinkan untuk modul active.
  - Tanyakan ke user jika ada pertanyaan sebelum selesai.

- [x] 11. Lindungi skor saat module deletion
  - [x] 11.1 Hapus penghapusan `quiz_attempts` dari `DELETE /api/modules` di `app/api/modules/route.ts`
    - Hapus blok kode yang melakukan `supabaseAdmin.from("quiz_attempts").delete().in("quiz_id", quizIds)`
    - Pertahankan variabel `quizIds` karena masih dipakai untuk menghapus `quiz_questions` dan `quizzes` (konten boleh dihapus, skor tidak)
    - Pertahankan penghapusan `quiz_questions` dan `quizzes` — hanya data skor yang dilindungi
    - Konfirmasi `topic_progress` memang sudah tidak dihapus di kode yang ada (tidak perlu perubahan)
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 11.2 Tambah komentar eksplisit di `DELETE /api/modules` untuk mendokumentasikan keputusan arsitektur
    - Tambah komentar `// NOTE: quiz_attempts intentionally NOT deleted — preserves student score history` di posisi bekas blok delete `quiz_attempts`
    - Tambah komentar `// topic_progress also intentionally NOT deleted — preserves XP and completion data` di dekat bagian penghapusan topics
    - _Requirements: 9.1, 9.2_

  - [ ]* 11.3 Tulis property test untuk module deletion score preservation
    - **Property 10: Module Deletion Does Not Delete Score Data**
    - Untuk setiap modul dengan topik dan quiz yang memiliki `quiz_attempts` dan `topic_progress`, verifikasi bahwa setelah `DELETE /api/modules`, rekord `quiz_attempts` dan `topic_progress` masih ada
    - **Validates: Requirements 9.1, 9.2**

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceabilitas
- Checkpoint memastikan validasi inkremental antar lapisan
- Property tests memvalidasi correctness properties universal dari design doc
- Unit tests memvalidasi kasus spesifik dan edge cases
- **Kritis:** Tidak ada task yang menyentuh tabel `topic_progress`, `quiz_attempts`, atau `xp_earned` — integritas skor dijaga sepenuhnya melalui constraint isolasi di database migration dan RPC
- **Task 11:** Perlindungan skor saat module deletion (`app/api/modules/route.ts`) bersifat independen dari perubahan `student_modules` — dapat dikerjakan paralel di wave 1

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "8.1", "11.1", "11.2"] },
    { "id": 2, "tasks": ["2.2", "3.2", "5.1", "8.2", "9.1", "9.2", "11.3"] },
    { "id": 3, "tasks": ["5.2", "6.1", "8.3"] },
    { "id": 4, "tasks": ["6.2"] },
    { "id": 5, "tasks": ["6.3"] },
    { "id": 6, "tasks": ["6.4"] }
  ]
}
```
