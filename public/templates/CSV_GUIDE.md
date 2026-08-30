# Panduan CSV Import -- BITS2BYTES Lesson Engine

Gunakan `lesson-template.csv` untuk membuat lesson dan quiz secara bulk.
Satu file CSV bisa berisi banyak lesson sekaligus.

## Cara Pakai

1. Download `lesson-template.csv`
2. Isi sesuai panduan kolom di bawah
3. Jalankan import:
   ```
   cd bits2bytes-lesson-engine
   npm run import:csv public/templates/nama-file-anda.csv
   ```
4. File JSON digenerate ke `public/lessons/{level}/{category}/{lessonId}.json`

---

## Tipe Baris

### LESSON -- satu baris per topik

| # | Field | Contoh | Keterangan |
|---|-------|--------|------------|
| 1 | type | LESSON | Wajib, huruf kapital |
| 2 | lessonId | beginner-html-01 | Format: {level}-{category}-{nomor} |
| 3 | title | Apa itu HTML? | Maks 100 karakter |
| 4 | description | HTML adalah... | Maks 500 karakter |
| 5 | level | beginner | beginner / intermediate / advanced |
| 6 | category | HTML | Bebas, konsisten (jadi nama folder) |
| 7 | topicNumber | 1 | Nomor urut dalam kategori |
| 8 | estimatedTime | 25 | Perkiraan waktu belajar (menit) |
| 9 | xp | 100 | Total XP topik (0-10000) |

---

### NODE -- satu baris per node, urutan = urutan tampil

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
| 9 | codeContent | <h1>Hello</h1> | Hanya code node: isi kodenya |
| 10-11 | (reserved) | | Kosongkan |
| 12 | options | A|B|C|D | Hanya practice node: opsi dipisah karakter pipe | |
| 13 | correctOption | A | Hanya practice node: harus sama persis dengan salah satu opsi |

Node type `quiz` tidak butuh konten -- pertanyaan dari baris QUIZ.

---

### QUIZ -- satu baris per pertanyaan

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
| Field berisi koma | Bungkus dengan tanda kutip: "teks, dengan koma" |
| Tanda kutip dalam teks | Escape dengan dua kutip: "teks ""dalam"" kutip" |
| Komentar | Baris dimulai # diabaikan importer |
| Multi-lesson dalam satu CSV | Boleh -- urutkan LESSON, NODE, QUIZ per lesson |

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

## Menghubungkan ke LMS

Setelah import, isi kolom `engine_topic_id` di tabel `topics` Supabase.
Contoh: `topics.engine_topic_id = 'beginner-html-01'`

Lesson engine terbuka via: `/learning/lesson/beginner-html-01`