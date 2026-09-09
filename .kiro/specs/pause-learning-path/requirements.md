# Requirements Document

## Introduction

Fitur **Pause Learning Path** memungkinkan admin untuk menjeda (pause) learning path seorang siswa dan mengaktifkan learning path lain, tanpa menghapus atau mengubah skor/progress yang sudah tercatat. Siswa yang meminta pergantian learning path akan langsung diarahkan ke learning path aktif yang baru. Admin dapat mengaktifkan kembali learning path yang dijeda kapan saja. Pada satu waktu, hanya ada satu learning path berstatus `active` per siswa; semua lainnya berstatus `paused`.

Fitur ini mencakup dua repositori:
- **LMS** (`bits2bytes-lms`): perubahan skema database, API, dan Admin UI.
- **Lesson Engine** (`bits2bytes-lesson-engine`): tampilan modul yang dijeda (greyed-out + label "Sedang Dijeda").

---

## Glossary

- **Student_Modules**: Tabel junction `student_modules` yang menghubungkan siswa ke modul; setelah fitur ini diterapkan, memiliki kolom `status` bertipe `TEXT` dengan nilai `'active'` atau `'paused'`.
- **Learning_Path**: Satu rekord `student_modules` yang merepresentasikan penugasan satu modul ke satu siswa beserta statusnya.
- **Active_Learning_Path**: Learning path dengan `status = 'active'`. Hanya boleh ada satu per siswa pada satu waktu.
- **Paused_Learning_Path**: Learning path dengan `status = 'paused'`. Siswa dapat dimiliki lebih dari satu Paused_Learning_Path secara bersamaan.
- **Admin**: Pengguna yang mengakses halaman `/admin` pada LMS dan memiliki kewenangan mengelola penugasan modul siswa.
- **Student**: Pengguna yang mengakses Lesson Engine dan mengerjakan learning path.
- **LMS_API**: Route handler Next.js pada repositori `bits2bytes-lms` yang beroperasi dengan `service_role` Supabase.
- **StudentDetailPanel**: Komponen `app/admin/students/StudentDetailPanel.tsx` di LMS yang menampilkan detail siswa termasuk tab Learning Path.
- **Lesson_Engine**: Aplikasi `bits2bytes-lesson-engine` yang merender konten pembelajaran dan module list.
- **Topic_Progress**: Data skor siswa yang tersimpan di tabel `topic_progress`, `quiz_attempts`, dan `xp_earned` — sepenuhnya independen dari status Learning_Path.
- **Module_Status_API**: Endpoint baru `PATCH /api/admin/students/[id]/modules/[moduleId]/status` pada LMS.

---

## Requirements

### Requirement 1 — Kolom Status pada Student_Modules

**User Story:** Sebagai Admin, saya ingin setiap penugasan modul siswa menyimpan status aktif atau dijeda, sehingga sistem dapat menegakkan aturan satu learning path aktif per siswa.

#### Acceptance Criteria

1. THE Student_Modules SHALL memiliki kolom `status` bertipe `TEXT NOT NULL DEFAULT 'active'` dengan constraint `CHECK (status IN ('active', 'paused'))`.
2. THE Student_Modules SHALL mempertahankan semua rekord `topic_progress`, `quiz_attempts`, dan `xp_earned` yang ada tanpa perubahan ketika kolom `status` ditambahkan.
3. WHEN kolom `status` ditambahkan melalui migrasi database, THE Student_Modules SHALL menetapkan nilai `'active'` pada semua rekord yang sudah ada.

---

### Requirement 2 — Penegakan Satu Active Learning Path per Siswa

**User Story:** Sebagai Admin, saya ingin sistem secara otomatis memastikan hanya ada satu learning path aktif per siswa, sehingga saya tidak perlu mengelola konflik secara manual.

#### Acceptance Criteria

1. WHEN Admin mengaktifkan sebuah Learning_Path milik seorang Student, THE LMS_API SHALL mengubah status semua Learning_Path lain milik Student tersebut menjadi `'paused'` dalam satu database transaction sebelum mengaktifkan Learning_Path yang diminta.
2. IF sebuah operasi perubahan status gagal di tengah transaction, THEN THE LMS_API SHALL membatalkan seluruh transaction dan mengembalikan HTTP 500 dengan pesan error.
3. THE LMS_API SHALL menolak permintaan yang menetapkan `status = 'active'` jika Student yang dimaksud sudah memiliki satu Active_Learning_Path yang berbeda tanpa melakukan auto-deactivation, kecuali permintaan tersebut secara eksplisit menggunakan endpoint Module_Status_API dengan aksi `activate`.

---

### Requirement 3 — Endpoint Module_Status_API

**User Story:** Sebagai Admin, saya ingin memanggil satu endpoint untuk menjeda atau mengaktifkan kembali sebuah learning path siswa, sehingga operasi ini dapat dilakukan dari AdminUI tanpa memuat ulang halaman.

#### Acceptance Criteria

1. THE LMS_API SHALL menyediakan endpoint `PATCH /api/admin/students/[id]/modules/[moduleId]/status` yang menerima body JSON `{ "action": "pause" | "activate" }`.
2. WHEN action adalah `"pause"`, THE LMS_API SHALL mengubah status rekord `student_modules` yang cocok dengan `student_id = id` dan `module_id = moduleId` menjadi `'paused'`.
3. WHEN action adalah `"activate"`, THE LMS_API SHALL mengubah status semua Learning_Path lain milik Student menjadi `'paused'`, kemudian mengubah status Learning_Path yang diminta menjadi `'active'`, dalam satu database transaction.
4. IF rekord `student_modules` untuk kombinasi `student_id` dan `moduleId` tidak ditemukan, THEN THE LMS_API SHALL mengembalikan HTTP 404 dengan pesan error `"Penugasan modul tidak ditemukan."`.
5. IF body JSON tidak mengandung field `action` dengan nilai `"pause"` atau `"activate"`, THEN THE LMS_API SHALL mengembalikan HTTP 400 dengan pesan error `"Action tidak valid."`.
6. THE Module_Status_API SHALL tidak mengubah, menghapus, atau memindahkan rekord apapun pada tabel `topic_progress`, `quiz_attempts`, atau `xp_earned`.

---

### Requirement 4 — Endpoint Details Menyertakan Status Learning Path

**User Story:** Sebagai Admin, saya ingin melihat status (aktif/dijeda) setiap learning path siswa di StudentDetailPanel, sehingga saya mengetahui kondisi terkini tanpa harus membuka halaman lain.

#### Acceptance Criteria

1. WHEN Admin mengakses `GET /api/admin/students/[id]/details`, THE LMS_API SHALL menyertakan field `status` (`'active'` atau `'paused'`) pada setiap objek modul dalam array `modules` pada response JSON.
2. THE LMS_API SHALL mengambil field `status` dari tabel `student_modules` bersamaan dengan query modul yang sudah ada, tanpa query database tambahan.

---

### Requirement 5 — Kontrol Pause/Resume di StudentDetailPanel

**User Story:** Sebagai Admin, saya ingin dapat menjeda atau mengaktifkan learning path siswa langsung dari tab "Learning Path" di StudentDetailPanel, sehingga saya dapat merespons permintaan siswa dengan cepat.

#### Acceptance Criteria

1. WHEN tab "Learning Path" di StudentDetailPanel ditampilkan dan data modul tersedia, THE StudentDetailPanel SHALL menampilkan tombol "Jeda" pada setiap Active_Learning_Path dan tombol "Aktifkan" pada setiap Paused_Learning_Path.
2. WHEN Admin mengklik tombol "Jeda" pada sebuah Active_Learning_Path, THE StudentDetailPanel SHALL memanggil `PATCH /api/admin/students/[id]/modules/[moduleId]/status` dengan body `{ "action": "pause" }` dan memperbarui tampilan secara optimistic.
3. WHEN Admin mengklik tombol "Aktifkan" pada sebuah Paused_Learning_Path, THE StudentDetailPanel SHALL memanggil `PATCH /api/admin/students/[id]/modules/[moduleId]/status` dengan body `{ "action": "activate" }` dan memperbarui tampilan secara optimistic.
4. IF panggilan API gagal, THEN THE StudentDetailPanel SHALL mengembalikan tampilan ke status sebelum perubahan dan menampilkan pesan error kepada Admin.
5. WHILE permintaan API sedang berlangsung, THE StudentDetailPanel SHALL menonaktifkan semua tombol status pada modul yang sama untuk mencegah klik berulang.
6. THE StudentDetailPanel SHALL menampilkan badge status "Aktif" (hijau) atau "Dijeda" (kuning/amber) di samping judul setiap modul pada tab Learning Path.

---

### Requirement 6 — Tampilan Modul Dijeda di Lesson Engine

**User Story:** Sebagai Student, saya ingin mengetahui bahwa learning path saya sedang dijeda sehingga saya tidak bingung mengapa konten tersebut tidak dapat diakses.

#### Acceptance Criteria

1. WHEN Lesson Engine menerima data modul dari LMS API yang menyertakan field `status = 'paused'` untuk sebuah modul, THE Lesson_Engine SHALL menampilkan modul tersebut dengan tampilan greyed-out (opacity berkurang) dan label teks "Sedang Dijeda".
2. WHEN sebuah modul berstatus `'paused'` ditampilkan di Lesson Engine, THE Lesson_Engine SHALL menonaktifkan semua navigasi ke topik dalam modul tersebut.
3. WHEN sebuah modul berstatus `'active'` ditampilkan di Lesson Engine, THE Lesson_Engine SHALL menampilkan modul tersebut dengan tampilan normal dan navigasi topik yang dapat diklik.
4. THE Lesson_Engine SHALL menampilkan Active_Learning_Path secara default tanpa memerlukan interaksi tambahan dari Student.

---

### Requirement 7 — Kompatibilitas Assign Flow yang Ada

**User Story:** Sebagai Admin, saya ingin alur assign modul yang sudah ada tetap berfungsi dengan benar setelah fitur ini ditambahkan, sehingga workflow saya tidak terganggu.

#### Acceptance Criteria

1. WHEN Admin melakukan assign modul ke Student melalui `POST /api/modules/[moduleId]/assign`, THE LMS_API SHALL menetapkan `status = 'active'` pada rekord `student_modules` yang baru dibuat.
2. WHEN `POST /api/modules/[moduleId]/assign` menambahkan modul baru ke seorang Student yang sudah memiliki Active_Learning_Path, THE LMS_API SHALL menetapkan modul baru tersebut dengan `status = 'paused'` agar tidak melanggar aturan satu Active_Learning_Path.
3. WHEN `POST /api/modules/[moduleId]/assign` dieksekusi, THE LMS_API SHALL mempertahankan nilai `status` rekord `student_modules` yang sudah ada dan tidak me-reset status rekord yang tidak terpengaruh oleh operasi assign.

---

### Requirement 8 — Integritas Skor Tidak Terpengaruh

**User Story:** Sebagai Admin, saya ingin operasi pause dan resume learning path tidak mengubah skor atau progress belajar siswa, sehingga data akademik siswa tetap akurat.

#### Acceptance Criteria

1. THE Module_Status_API SHALL hanya memodifikasi kolom `status` pada tabel `student_modules` dan tidak menyentuh tabel `topic_progress`, `quiz_attempts`, `xp_earned`, atau tabel lain yang menyimpan data progress belajar siswa.
2. WHEN sebuah Paused_Learning_Path diaktifkan kembali, THE LMS_API SHALL memuat ulang data `topic_progress` yang ada untuk modul tersebut sehingga Student melanjutkan dari posisi terakhirnya.
3. THE StudentDetailPanel SHALL menampilkan skor quiz dan progress topik yang sudah ada pada Paused_Learning_Path tanpa perubahan.

---

### Requirement 9 — Integritas Data Saat Modul Dihapus

**User Story:** Sebagai Admin, ketika saya menghapus sebuah modul dari sistem, saya ingin skor dan riwayat quiz yang sudah diraih siswa tetap tersimpan, sehingga rekam jejak akademik siswa tidak hilang.

#### Acceptance Criteria

1. WHEN Admin menghapus sebuah modul melalui `DELETE /api/modules?id={moduleId}`, THE LMS_API SHALL NOT menghapus rekord `quiz_attempts` yang terhubung ke quiz dalam modul tersebut.
2. WHEN Admin menghapus sebuah modul, THE LMS_API SHALL NOT menghapus rekord `topic_progress` yang terhubung ke topik dalam modul tersebut.
3. WHEN Admin menghapus sebuah modul, THE LMS_API SHALL melakukan "soft dissociation" — quiz dan topic dihapus dari modul namun rekord skor siswa tetap ada secara orphaned (`student_id` masih ada, `quiz_id` atau `topic_id` bisa null/orphan) ATAU menggunakan strategi SET NULL pada FK jika DB mendukung.
4. THE LMS_API SHALL menghapus rekord `quiz_questions` dan `quizzes` dari tabel konten saat modul dihapus, tetapi harus memastikan `quiz_attempts` yang ada tidak terpengaruh — gunakan SET NULL atau skip delete `quiz_attempts` jika ada FK constraint, atau jangan delete `quiz_attempts` sama sekali dan biarkan orphaned dengan `quiz_id` yang masih ada.
5. WHEN sebuah Paused_Learning_Path diaktifkan kembali setelah modulnya sempat dihapus lalu di-restore, THE LMS_API SHALL tetap memuat data `topic_progress` yang ada.
