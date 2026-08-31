// lib/builtInLessons.ts
// The 24 built-in lesson engine topics available from the engine's public/lessons/ filesystem.
// Used in admin forms as a dropdown so teachers don't need to memorise IDs.
// Source of truth: bits2bytes-lesson-engine/src/engine/topicRegistry.ts + metadata titles.

export interface BuiltInLesson {
  id: string;
  title: string;
  category: 'HTML' | 'CSS' | 'JavaScript';
  topicNumber: number;
}

export const BUILT_IN_LESSONS: BuiltInLesson[] = [
  // HTML — topics 01–10
  { id: 'beginner-html-01', title: 'Build Your First Web Page', category: 'HTML', topicNumber: 1 },
  { id: 'beginner-html-02', title: 'HTML Structure & Basic Tags', category: 'HTML', topicNumber: 2 },
  { id: 'beginner-html-03', title: 'Elemen Teks HTML — Heading dan Paragraf', category: 'HTML', topicNumber: 3 },
  { id: 'beginner-html-04', title: 'Link dan Navigasi dengan HTML', category: 'HTML', topicNumber: 4 },
  { id: 'beginner-html-05', title: 'Menampilkan Gambar dengan HTML', category: 'HTML', topicNumber: 5 },
  { id: 'beginner-html-06', title: 'Membuat Daftar dengan HTML', category: 'HTML', topicNumber: 6 },
  { id: 'beginner-html-07', title: 'Menyusun Data dengan Tabel HTML', category: 'HTML', topicNumber: 7 },
  { id: 'beginner-html-08', title: 'Formulir HTML — Mengumpulkan Input Pengguna', category: 'HTML', topicNumber: 8 },
  { id: 'beginner-html-09', title: 'HTML Semantik — Struktur Halaman yang Bermakna', category: 'HTML', topicNumber: 9 },
  { id: 'beginner-html-10', title: 'Mini Project — Membuat Halaman Profil Sederhana', category: 'HTML', topicNumber: 10 },
  // CSS — topics 11–17
  { id: 'beginner-html-11', title: 'Pengantar CSS — Memberi Gaya pada Halaman Web', category: 'CSS', topicNumber: 1 },
  { id: 'beginner-html-12', title: 'Warna, Font, dan Teks — Tipografi Dasar dengan CSS', category: 'CSS', topicNumber: 2 },
  { id: 'beginner-html-13', title: 'Box Model dan Spacing — Jarak dan Bingkai dengan CSS', category: 'CSS', topicNumber: 3 },
  { id: 'beginner-html-14', title: 'Flexbox Layout — Menyusun Elemen dengan CSS', category: 'CSS', topicNumber: 4 },
  { id: 'beginner-html-15', title: 'Navigasi dan Seksi Halaman — Struktur Website Nyata', category: 'CSS', topicNumber: 5 },
  { id: 'beginner-html-16', title: 'Hero Section, Kartu, dan CTA — Komponen Landing Page', category: 'CSS', topicNumber: 6 },
  { id: 'beginner-html-17', title: 'Final Project — Landing Page Profesionalmu', category: 'CSS', topicNumber: 7 },
  // JavaScript — topics 18–24
  { id: 'beginner-html-18', title: 'Pengantar JavaScript — Membuat Website Interaktif', category: 'JavaScript', topicNumber: 1 },
  { id: 'beginner-html-19', title: 'Variabel dan Data — Menyimpan Informasi di JavaScript', category: 'JavaScript', topicNumber: 2 },
  { id: 'beginner-html-20', title: 'Events — Tombol yang Bereaksi Terhadap Klik', category: 'JavaScript', topicNumber: 3 },
  { id: 'beginner-html-21', title: 'DOM — Mengubah Halaman Secara Dinamis', category: 'JavaScript', topicNumber: 4 },
  { id: 'beginner-html-22', title: 'Kondisi — Website yang Bisa Mengambil Keputusan', category: 'JavaScript', topicNumber: 5 },
  { id: 'beginner-html-23', title: 'Functions — Kode yang Bisa Dipanggil Berkali-kali', category: 'JavaScript', topicNumber: 6 },
  { id: 'beginner-html-24', title: 'Final Project — Mini Website Interaktif', category: 'JavaScript', topicNumber: 7 },
];

export const BUILT_IN_LESSON_MAP = new Map(BUILT_IN_LESSONS.map(l => [l.id, l]));
