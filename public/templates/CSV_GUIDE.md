# Panduan CSV Import -- BITS2BYTES Lesson Engine

Gunakan `lesson-template.csv` untuk membuat lesson dan quiz secara bulk.
Satu file CSV bisa berisi banyak lesson sekaligus.

> ⚠️ **Penting**: Hapus semua baris yang dimulai dengan `#` sebelum mengupload.
> Baris `#` adalah komentar — importer akan mengabaikannya, tapi jika kamu
> menyertakan baris header seperti `type,lessonId,title,...` yang bukan baris data,
> importer akan melaporkan "Unrecognised row".

---

## Cara Pakai (Alur Baru)

1. **Download** `lesson-template.csv`
2. **Isi** konten lesson sesuai panduan kolom di bawah
3. **Hapus** semua baris komentar (`#`) dari file sebelum upload
4. **Upload** via tombol "Upload & Import" di halaman admin modul
5. Topik **dibuat otomatis** (status *draft*) jika belum ada
6. **Publish** topik secara manual di daftar topik setelah mengecek isinya

> 💡 Tidak perlu membuat topik terlebih dahulu — CSV akan membuatnya otomatis
> berdasarkan baris LESSON (judul, deskripsi, urutan).

---

## Tipe Baris

### LESSON — satu baris per topik

| # | Field | Contoh | Keterangan |
|---|-------|--------|------------|
| 1 | type | LESSON | Wajib, huruf kapital |
| 2 | lessonId | beginner-html-01 | Format: {level}-{category}-{nomor} — harus unik |
| 3 | title | Apa itu HTML? | Maks 100 karakter — jadi judul topik |
| 4 | description | HTML adalah... | Maks 500 karakter — jadi deskripsi topik |
| 5 | level | beginner | beginner / intermediate / advanced |
| 6 | category | HTML | Bebas, konsisten (jadi nama folder) |
| 7 | topicNumber | 1 | Nomor urut topik (order_index) |
| 8 | estimatedTime | 25 | Perkiraan waktu belajar (menit) |
| 9 | xp | 100 | Total XP topik (0-10000) |

---

### NODE — satu baris per node, urutan = urutan tampil

| # | Field | Contoh | Keterangan |
|---|-------|--------|------------|
| 1 | type | NODE | Wajib |
| 2 | lessonId | beginner-html-01 | Harus sama dengan LESSON |
| 3 | nodeId | node-01 | Unik per lesson |
| 4 | nodeType | lesson | lesson / code / practice / challenge / quiz |
| 5 | title | Apa itu HTML? | Judul tampil di sidebar |
| 6 | xp | 5 | XP untuk node ini |
| 7 | content | Penjelasan... | Teks utama, atau penjelasan di atas kode |
| 8 | language | html | Hanya code node: html / css / javascript / dll |
| 9 | codeContent | `<h1>Hello</h1>` | Hanya code node: isi kodenya |
| 10-11 | (reserved) | | Kosongkan |
| 12 | options | A\|B\|C\|D | Hanya practice node: opsi dipisah karakter pipe `\|` |
| 13 | correctOption | A | Hanya practice node: harus sama persis dengan salah satu opsi |

Node type `quiz` tidak butuh konten — pertanyaan diambil dari baris QUIZ.

> ⚠️ **Jangan gunakan newline di dalam cell** — konten multi-baris dalam satu kolom
> akan memecah CSV menjadi beberapa baris dan menyebabkan parse error.
> Tulis semua teks dalam satu baris.

---

### QUIZ — satu baris per pertanyaan

| # | Field | Contoh | Keterangan |
|---|-------|--------|------------|
| 1 | type | QUIZ | Wajib |
| 2 | lessonId | beginner-html-01 | Harus sama dengan LESSON |
| 3 | questionId | q01 | Unik per lesson |
| 4 | question | Apa kepanjangan HTML? | Teks pertanyaan |
| 5 | optionA | HyperText Markup Language | Opsi A |
| 6 | optionB | ... | Opsi B |
| 7 | optionC | ... | Opsi C |
| 8 | optionD | ... | Opsi D |
| 9 | correctAnswer | HyperText Markup Language | Harus sama persis dengan salah satu opsi |
| 10 | explanation | HTML = HyperText... | Penjelasan setelah jawaban salah |
| 11 | points | 20 | Poin soal (idealnya total = 100) |

---

## Aturan & Batasan

| Hal | Aturan |
|-----|--------|
| Jumlah node per lesson | 5 - 50 node |
| Jumlah pertanyaan quiz | 3 - 20 pertanyaan |
| Field berisi koma | Bungkus dengan tanda kutip: `"teks, dengan koma"` |
| Tanda kutip dalam teks | Escape dengan dua kutip: `"teks ""dalam"" kutip"` |
| Komentar | Baris dimulai `#` diabaikan importer — **hapus semua sebelum upload** |
| Multi-lesson dalam satu CSV | Boleh — urutkan LESSON, NODE, QUIZ per lesson |
| Newline dalam cell | **Dilarang** — tulis semua konten dalam satu baris |

---

## Contoh Multi-Lesson

```
LESSON,beginner-html-01,Apa itu HTML?,...
NODE,beginner-html-01,node-01,lesson,...
QUIZ,beginner-html-01,q01,...
LESSON,beginner-html-02,Tag Dasar HTML,...
NODE,beginner-html-02,node-01,lesson,...
QUIZ,beginner-html-02,q01,...
```

---

## Hasil Import

Setelah berhasil upload, setiap LESSON akan menghasilkan satu baris di tabel `topics` (status *draft*).
Kamu bisa melihat hasilnya di daftar topik modul dan publish secara manual.

Kolom `engine_topic_id` di tabel `topics` akan diisi otomatis dengan `lessonId` dari CSV.