// scripts/seedTinkercadModule.ts
// Creates the Tinkercad + Assembler AR module with 12 topics (4 easy, 4 medium, 4 hard),
// ingests full lesson content + quiz questions via ingestLessonContent(), and creates the tryout assessment.
// Run with: npx tsx scripts/seedTinkercadModule.ts

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import { ingestLessonContent } from '../lib/ingestLesson';
import type { LessonContract } from '../lib/lessonContract';

async function seed() {
  console.log('🚀 Starting Tinkercad & Assembler AR module seeding...');
  const supabase = getSupabaseAdmin();

  // 1. Create or retrieve module
  const moduleTitle = 'Desain 3D Tinkercad & Assembler AR';
  const moduleDescription =
    'Modul komprehensif pembelajaran desain 3D Tinkercad dan visualisasi Augmented Reality (AR) dengan Assembler EDU. Terdiri dari 12 topik bertingkat: 4 Easy, 4 Medium, dan 4 Hard.';

  const { data: existingMod } = await supabase
    .from('modules')
    .select('id')
    .eq('title', moduleTitle)
    .maybeSingle();

  let moduleId: number;

  if (existingMod) {
    console.log(`📌 Found existing module with ID: ${existingMod.id}`);
    moduleId = existingMod.id;
    // Update gamification_type to quest
    await supabase
      .from('modules')
      .update({
        description: moduleDescription,
        level: 'intermediate',
        gamification_type: 'quest',
      })
      .eq('id', moduleId);
  } else {
    const { data: newMod, error: modErr } = await supabase
      .from('modules')
      .insert({
        title: moduleTitle,
        description: moduleDescription,
        level: 'intermediate',
        gamification_type: 'quest',
      })
      .select('id')
      .single();

    if (modErr || !newMod) {
      throw new Error(`Failed to create module: ${modErr?.message}`);
    }
    moduleId = newMod.id;
    console.log(`✅ Created module ID: ${moduleId}`);
  }

  // 2. Define 12 Topics
  const topicDefinitions: Array<{
    id: string;
    title: string;
    description: string;
    tier: 'Easy' | 'Medium' | 'Hard';
    topicNumber: number;
    quizzes: Array<{
      id: string;
      question: string;
      options: [string, string, string, string];
      correctAnswer: string;
      explanation: string;
    }>;
  }> = [
    // ── EASY TIER (Topics 1-4) ────────────────────────────────────────────────
    {
      id: 'tinkercad-01-intro',
      topicNumber: 1,
      tier: 'Easy',
      title: 'Pengenalan Tinkercad & Navigasi Workplane',
      description: 'Mengenal area kerja Workplane, rotasi kamera, zoom, dan kontrol 3D dasar.',
      quizzes: [
        {
          id: 'tk1-q1',
          question: 'Apa fungsi utama Workplane di Tinkercad?',
          options: ['Tempat meletakkan dan mendesain objek 3D', 'Tombol untuk menyimpan file', 'Menu untuk mewarnai objek', 'Tempat mengekspor file audio'],
          correctAnswer: 'Tempat meletakkan dan mendesain objek 3D',
          explanation: 'Workplane adalah alas kisi 3D tempat objek diletakkan dan disusun.',
        },
        {
          id: 'tk1-q2',
          question: 'Bagaimana cara melakukan rotasi pandangan kamera 3D di Tinkercad?',
          options: ['Klik kanan dan tahan mouse lalu geser', 'Tekan tombol Enter', 'Klik dua kali tombol kiri mouse', 'Tekan tombol Tab'],
          correctAnswer: 'Klik kanan dan tahan mouse lalu geser',
          explanation: 'Klik kanan dan dragging memutar sudut pandang kamera (ViewCube).',
        },
        {
          id: 'tk1-q3',
          question: 'Apa kegunaan tombol ViewCube di sudut kiri atas layar Tinkercad?',
          options: ['Membeli aset 3D baru', 'Mengubah sudut pandang kamera secara presisi (Top, Front, Right)', 'Menghapus objek di layar', 'Mengganti warna latar belakang'],
          correctAnswer: 'Mengubah sudut pandang kamera secara presisi (Top, Front, Right)',
          explanation: 'ViewCube memudahkan navigasi cepat ke pandangan Atas, Depan, Samping, atau Isometrik.',
        },
        {
          id: 'tk1-q4',
          question: 'Tombol keyboard apa yang digunakan untuk Zoom In dan Zoom Out pada Tinkercad?',
          options: ['Scroll wheel mouse atau tombol + dan -', 'Tombol Spasi', 'Tombol Ctrl + Shift', 'Tombol Esc'],
          correctAnswer: 'Scroll wheel mouse atau tombol + dan -',
          explanation: 'Scroll mouse atau (+/-) digunakan untuk melakukan zoom kamera.',
        },
      ],
    },
    {
      id: 'tinkercad-02-basic-shapes',
      topicNumber: 2,
      tier: 'Easy',
      title: 'Transformasi Bentuk Dasar 3D (Move, Rotate, Scale)',
      description: 'Menambah objek dasar seperti Kubus, Tabung, Bola dan mengubah ukurannya.',
      quizzes: [
        {
          id: 'tk2-q1',
          question: 'Handle (titik sudut) warna putih pada objek Tinkercad berfungsi untuk...?',
          options: ['Mengubah panjang dan lebar objek sekaligus', 'Memutar objek 360 derajat', 'Mengubah warna objek', 'Menghapus objek'],
          correctAnswer: 'Mengubah panjang dan lebar objek sekaligus',
          explanation: 'Titik putih mengontrol dimensi 2D (panjang & lebar) atau tinggi di bagian atas.',
        },
        {
          id: 'tk2-q2',
          question: 'Ikon kerucut hitam (Black Cone) di atas objek berguna untuk...?',
          options: ['Menaikkan atau menurunkan posisi objek secara vertikal (sumbu Z)', 'Memutar objek', 'Mewarnai objek', 'Mencetak objek ke printer'],
          correctAnswer: 'Menaikkan atau menurunkan posisi objek secara vertikal (sumbu Z)',
          explanation: 'Black Cone melayangkan objek dari Workplane (mengubah nilai elevasi Z).',
        },
        {
          id: 'tk2-q3',
          question: 'Untuk mempertahankan proporsi objek saat mengubah ukuran, tombol keyboard apa yang harus ditahan?',
          options: ['Shift', 'Ctrl', 'Alt', 'Tab'],
          correctAnswer: 'Shift',
          explanation: 'Menahan tombol Shift saat dragging melakukan scaling secara proporsional.',
        },
        {
          id: 'tk2-q4',
          question: 'Bagaimana cara memutar objek sebesar 45 derajat di Tinkercad?',
          options: ['Drag panah kurva lingkaran dan gunakan snap sudut', 'Klik kanan 3 kali', 'Tekan tombol Delete', 'Tekan Ctrl + Z'],
          correctAnswer: 'Drag panah kurva lingkaran dan gunakan snap sudut',
          explanation: 'Panah melengkung di sekitar objek digunakan untuk rotasi derajat presisi.',
        },
      ],
    },
    {
      id: 'tinkercad-03-grouping',
      topicNumber: 3,
      tier: 'Easy',
      title: 'Menggabungkan Bentuk (Group & Ungroup)',
      description: 'Menggabungkan beberapa bentuk dasar menjadi satu objek gabungan yang solid.',
      quizzes: [
        {
          id: 'tk3-q1',
          question: 'Shortcut keyboard untuk menggabungkan objek (Group) di Tinkercad adalah...?',
          options: ['Ctrl + G', 'Ctrl + C', 'Ctrl + Z', 'Ctrl + P'],
          correctAnswer: 'Ctrl + G',
          explanation: 'Ctrl + G (atau Cmd + G di Mac) digunakan untuk meng-group objek.',
        },
        {
          id: 'tk3-q2',
          question: 'Apa yang terjadi ketika dua objek atau lebih di-Group?',
          options: ['Objek-objek tersebut bersatu menjadi satu komponen tunggal', 'Objek akan terhapus', 'Objek berubah warna menjadi bening', 'Kamera akan membesar'],
          correctAnswer: 'Objek-objek tersebut bersatu menjadi satu komponen tunggal',
          explanation: 'Group menyatukan objek menjadi bentuk baru yang bertindak sebagai satu kesatuan.',
        },
        {
          id: 'tk3-q3',
          question: 'Shortcut untuk memisahkan objek yang sudah ter-Group (Ungroup) adalah...?',
          options: ['Ctrl + Shift + G', 'Ctrl + X', 'Ctrl + V', 'Alt + F4'],
          correctAnswer: 'Ctrl + Shift + G',
          explanation: 'Ctrl + Shift + G memecah bentuk gabungan kembali ke objek-objek penyusunnya.',
        },
        {
          id: 'tk3-q4',
          question: 'Bagaimana cara memilih lebih dari satu objek di Tinkercad?',
          options: ['Drag area seleksi kotak atau tahan Shift sambil klik objek', 'Klik ganda pada layar', 'Tekan Alt + Tab', 'Tekan F5'],
          correctAnswer: 'Drag area seleksi kotak atau tahan Shift sambil klik objek',
          explanation: 'Menahan Shift atau melakukan box selection memilih banyak objek sekaligus.',
        },
      ],
    },
    {
      id: 'tinkercad-04-hole-shapes',
      topicNumber: 4,
      tier: 'Easy',
      title: 'Membuat Lubang & Potongan dengan Hole Shapes',
      description: 'Teknik pemotongan 3D menggunakan bentuk berjenis Hole untuk melubangi objek solid.',
      quizzes: [
        {
          id: 'tk4-q1',
          question: 'Bagaimana cara mengubah bentuk Solid biasa menjadi bentuk pemotong (Hole)?',
          options: ['Pilih opsi Hole di panel inspektur warna objek', 'Tekan tombol Delete', 'Klik kanan pada objek', 'Ubah ukuran objek menjadi nol'],
          correctAnswer: 'Pilih opsi Hole di panel inspektur warna objek',
          explanation: 'Panel inspektur objek memiliki pilihan Solid dan Hole.',
        },
        {
          id: 'tk4-q2',
          question: 'Kapan potongan atau lubang baru terbentuk pada objek?',
          options: ['Setelah bentuk Hole dan bentuk Solid di-Group bersama', 'Langsung saat bentuk Hole diletakkan', 'Saat file diekspor ke PDF', 'Saat aplikasi ditutup'],
          correctAnswer: 'Setelah bentuk Hole dan bentuk Solid di-Group bersama',
          explanation: 'Pemotongan 3D (Boolean subtraction) terjadi saat Hole dan Solid di-group.',
        },
        {
          id: 'tk4-q3',
          question: 'Objek pemotong Hole ditandai dengan visual seperti apa di Tinkercad?',
          options: ['Warna abu-abu arsir/transparan bergaris', 'Warna merah menyala', 'Warna kuning emas', 'Tidak terlihat sama sekali'],
          correctAnswer: 'Warna abu-abu arsir/transparan bergaris',
          explanation: 'Objek berjenis Hole ditampilkan dengan tekstur transparan abu-abu bergaris.',
        },
        {
          id: 'tk4-q4',
          question: 'Dapatkah potongan lubang dibatalkan atau diedit kembali?',
          options: ['Bisa, dengan memilih objek gabungan lalu klik Ungroup', 'Tidak bisa sama sekali', 'Hanya bisa dengan menutup aplikasi', 'Harus membuat file baru'],
          correctAnswer: 'Bisa, dengan memilih objek gabungan lalu klik Ungroup',
          explanation: 'Ungroup mengembalikan pemotong Hole ke wujud awalnya sehingga bisa dipindahkan/diedit.',
        },
      ],
    },

    // ── MEDIUM TIER (Topics 5-8) ──────────────────────────────────────────────
    {
      id: 'tinkercad-05-align-color',
      topicNumber: 5,
      tier: 'Medium',
      title: 'Pewarnaan, Material, dan Alignment Presisi',
      description: 'Perataan presisi dengan Align Tool (L) dan pengaturan warna serta fitur Multicolor.',
      quizzes: [
        {
          id: 'tk5-q1',
          question: 'Shortcut keyboard untuk menggunakan Align Tool (Perataan presisi) adalah...?',
          options: ['L', 'A', 'M', 'R'],
          correctAnswer: 'L',
          explanation: 'Tombol L membuka panduan titik perataan Align Tool di sumbu X, Y, dan Z.',
        },
        {
          id: 'tk5-q2',
          question: 'Bagaimana cara meratakan dua objek tepat di tengah-tengah?',
          options: ['Pilih kedua objek, tekan L, lalu klik titik hitam bagian tengah pada sumbu yang diinginkan', 'Mendorong objek secara manual', 'Menggunakan tombol panah keyboard', 'Mengubah skala objek'],
          correctAnswer: 'Pilih kedua objek, tekan L, lalu klik titik hitam bagian tengah pada sumbu yang diinginkan',
          explanation: 'Titik hitam tengah pada Align guide meratakan pusat kedua objek.',
        },
        {
          id: 'tk5-q3',
          question: 'Fitur "Multicolor" pada opsi warna di Tinkercad berguna untuk...?',
          options: ['Mempertahankan warna asli masing-masing komponen saat di-Group', 'Mengubah semua warna menjadi pelangi', 'Mengubah warna teks saja', 'Menghapus warna objek'],
          correctAnswer: 'Mempertahankan warna asli masing-masing komponen saat di-Group',
          explanation: 'Multicolor mencegah objek gabungan berubah menjadi satu warna homogen.',
        },
        {
          id: 'tk5-q4',
          question: 'Fungsi dari Mirror / Flip Tool (M) di Tinkercad adalah...?',
          options: ['Mencerminkan/membalik posisi objek pada sumbu X, Y, atau Z', 'Menghapus objek', 'Meningkatkan kualitas grafik', 'Mengunci objek'],
          correctAnswer: 'Mencerminkan/membalik posisi objek pada sumbu X, Y, atau Z',
          explanation: 'Mirror Tool (shortcut M) membalikkan simetri objek.',
        },
      ],
    },
    {
      id: 'assembler-06-intro-export',
      topicNumber: 6,
      tier: 'Medium',
      title: 'Pengentar Assembler EDU & Import File 3D',
      description: 'Mengenal ekosistem Assembler EDU dan mengekspor model .OBJ/.GLTF dari Tinkercad.',
      quizzes: [
        {
          id: 'as6-q1',
          question: 'Format file 3D apa yang disarankan untuk diekspor dari Tinkercad ke Assembler EDU?',
          options: ['.OBJ atau .GLTF / .GLB', '.MP3', '.DOCX', '.PNG'],
          correctAnswer: '.OBJ atau .GLTF / .GLB',
          explanation: '.OBJ dan .GLB/.GLTF adalah format standar interchange model 3D.',
        },
        {
          id: 'as6-q2',
          question: 'Apa fungsi utama dari platform Assembler EDU?',
          options: ['Menampilkan dan menginteraksikan proyek 3D ke dalam dunia nyata via AR (Augmented Reality)', 'Membuat dokumen tulisan', 'Mengedit video pembelajaran', 'Menghitung rumus matematika'],
          correctAnswer: 'Menampilkan dan menginteraksikan proyek 3D ke dalam dunia nyata via AR (Augmented Reality)',
          explanation: 'Assembler EDU memungkinkan pembuatan materi dan proyek berbasis 3D & AR.',
        },
        {
          id: 'as6-q3',
          question: 'Langkah pertama saat memasukkan hasil karya Tinkercad ke Assembler Studio adalah...?',
          options: ['Klik Export di Tinkercad -> download .OBJ -> Upload Custom 3D Asset di Assembler', 'Mengambil foto layar', 'Mengirim email ke admin', 'Menulis kode program C++'],
          correctAnswer: 'Klik Export di Tinkercad -> download .OBJ -> Upload Custom 3D Asset di Assembler',
          explanation: 'Proses ekspor dan kustom import 3D menghubungkan hasil desain ke Assembler Studio.',
        },
        {
          id: 'as6-q4',
          question: 'Apakah Assembler EDU menyediakan perpustakaan (library) aset 3D bawaan?',
          options: ['Ya, terdapat ribuan aset 3D gratis dan terorganisir', 'Tidak ada sama sekali', 'Hanya ada bentuk kubus', 'Hanya bisa dibuka di komputer super'],
          correctAnswer: 'Ya, terdapat ribuan aset 3D gratis dan terorganisir',
          explanation: 'Assembler EDU menyediakan koleksi aset 3D pendidikan siap pakai.',
        },
      ],
    },
    {
      id: 'assembler-07-interactivity-text',
      topicNumber: 7,
      tier: 'Medium',
      title: 'Mengatur Interaksi dan Teks 3D di Assembler',
      description: 'Menambahkan Teks 3D, anotasi penjelas, serta interaksi tap & info-card di Assembler.',
      quizzes: [
        {
          id: 'as7-q1',
          question: 'Bagaimana cara menambahkan judul atau keterangan berwujud Teks 3D di Assembler Studio?',
          options: ['Klik menu Add Text -> pilih 3D Text -> ketik tulisan yang diinginkan', 'Menulis dengan pensil di layar', 'Mengubah nama file', 'Mengunggah gambar tulisan'],
          correctAnswer: 'Klik menu Add Text -> pilih 3D Text -> ketik tulisan yang diinginkan',
          explanation: 'Feature 3D Text di Assembler membuat teks berbentuk objek tiga dimensi.',
        },
        {
          id: 'as7-q2',
          question: 'Fitur "Interactivity / Add Action" pada Assembler digunakan untuk...?',
          options: ['Memberikan perintah saat objek diklik (misal: muncul teks info, berpindah halaman)', 'Mengubah warna background', 'Menghapus proyek', 'Menyalakan lampu kamera'],
          correctAnswer: 'Memberikan perintah saat objek diklik (misal: muncul teks info, berpindah halaman)',
          explanation: 'Add Action menciptakan pengalaman interaktif saat pengguna menatap/mengetuk objek.',
        },
        {
          id: 'as7-q3',
          question: 'Anotasi Popup Card pada Assembler berguna untuk...?',
          options: ['Menampilkan informasi detail/fakta edukasi saat elemen 3D ditekan', 'Menutupi layar dengan iklan', 'Merekam suara', 'Mengunci aplikasi'],
          correctAnswer: 'Menampilkan informasi detail/fakta edukasi saat elemen 3D ditekan',
          explanation: 'Popup card bertindak sebagai kartu penjelasan edukatif interaktif.',
        },
        {
          id: 'as7-q4',
          question: 'Dapatkah warna dan ketebalan 3D Text disesuaikan di Assembler Editor?',
          options: ['Bisa, terdapat opsi warna, font, dan extrude kedalaman teks', 'Tidak bisa diubah', 'Hanya warna hitam', 'Harus membayar lisensi khusus'],
          correctAnswer: 'Bisa, terdapat opsi warna, font, dan extrude kedalaman teks',
          explanation: 'Assembler menyediakan panel kustomisasi tampilan teks 3D.',
        },
      ],
    },
    {
      id: 'assembler-08-first-ar',
      topicNumber: 8,
      tier: 'Medium',
      title: 'Visualisasi AR (Augmented Reality) Pertama',
      description: 'Mempublikasikan proyek dan memindai QR Code / Marker menggunakan aplikasi Assembler EDU HP.',
      quizzes: [
        {
          id: 'as8-q1',
          question: 'Apa yang dibutuhkan untuk melihat proyek 3D dalam mode AR di dunia nyata?',
          options: ['Smartphone/Tablet dengan aplikasi Assembler EDU dan kamera aktif', 'Kacamata renang', 'Printer cetak kertas', 'Mouse nirkabel'],
          correctAnswer: 'Smartphone/Tablet dengan aplikasi Assembler EDU dan kamera aktif',
          explanation: 'Aplikasi mobile Assembler EDU memanfaatkan kamera HP untuk mendeteksi permukaan nyata.',
        },
        {
          id: 'as8-q2',
          question: 'Bagaimana cara membagikan proyek Assembler ke teman atau guru?',
          options: ['Membagikan Link proyek atau memindai QR Code yang dihasilkan', 'Mengirim flashdisk lewat pos', 'Memfoto layar HP', 'Menuliskan kode warna'],
          correctAnswer: 'Membagikan Link proyek atau memindai QR Code yang dihasilkan',
          explanation: 'Setiap proyek Assembler memiliki QR Code dan URL unik untuk berbagi instan.',
        },
        {
          id: 'as8-q3',
          question: 'Apa yang terjadi saat kamera AR diarahkan ke permukaan datar seperti meja?',
          options: ['Model 3D muncul berdiri di atas permukaan meja dalam tampilan kamera HP', 'HP akan mati', 'Layar berubah hitam', 'Model 3D menghilang selamanya'],
          correctAnswer: 'Model 3D muncul berdiri di atas permukaan meja dalam tampilan kamera HP',
          explanation: 'AR (Augmented Reality) memproyeksikan objek digital ke permukaan dunia nyata.',
        },
        {
          id: 'as8-q4',
          question: 'Dapatkah kita memperbesar (scale) atau memutar objek 3D saat berada di tampilan AR?',
          options: ['Bisa, dengan gestur pinch dua jari dan gesture rotasi di layar HP', 'Tidak bisa sama sekali', 'Hanya bisa diperkecil', 'Kamera harus dimatikan dulu'],
          correctAnswer: 'Bisa, dengan gestur pinch dua jari dan gesture rotasi di layar HP',
          explanation: 'Pengguna dapat berinteraksi secara gestur langsung dengan objek AR di layar HP.',
        },
      ],
    },

    // ── HARD TIER (Topics 9-12) ───────────────────────────────────────────────
    {
      id: 'tinkercad-09-robot-design',
      topicNumber: 9,
      tier: 'Hard',
      title: 'Desain Komponen Kompleks — Robot 3D Sederhana',
      description: 'Membuat karakter robot 3D dengan gabungan berbagai bentuk geometri, lubang, dan artikulasi.',
      quizzes: [
        {
          id: 'tk9-q1',
          question: 'Strategi pemodelan terbaik saat membuat karakter robot yang kompleks adalah...?',
          options: ['Membuat komponen per bagian (kepala, badan, tangan) lalu di-Group bertahap', 'Menggambar sekaligus tanpa merencanakan', 'Hanya memakai satu kubus saja', 'Menggunakan fitur foto otomatis'],
          correctAnswer: 'Membuat komponen per bagian (kepala, badan, tangan) lalu di-Group bertahap',
          explanation: 'Pendekatan modular memudahkan penyesuaian ukuran dan detail tiap bagian.',
        },
        {
          id: 'tk9-q2',
          question: 'Untuk membuat mata robot yang melengkung dan simetris di bagian depan kepala, teknik apa yang dipakai?',
          options: ['Duplicate (Ctrl+D), Mirror (M), dan Align (L)', 'Menggambar ulang manual', 'Menggunakan fitur copy-paste acak', 'Menghapus kepala robot'],
          correctAnswer: 'Duplicate (Ctrl+D), Mirror (M), dan Align (L)',
          explanation: 'Kombinasi Duplicate, Mirror, dan Align menghasilkan sepasang mata simetris presisi.',
        },
        {
          id: 'tk9-q3',
          question: 'Fungsi shortcut Duplicate and Repeat (Ctrl + D) yang membedakannya dari Copy (Ctrl + C) adalah...?',
          options: ['Mengingat perubahan jarak, rotasi, dan skala dari tindakan sebelumnya', 'Mengirim file ke printer 3D', 'Membuat objek berputar sendiri', 'Menyimpan proyek secara otomatis'],
          correctAnswer: 'Mengingat perubahan jarak, rotasi, dan skala dari tindakan sebelumnya',
          explanation: 'Ctrl+D mengulangi pola transformasi terakhir secara berantai.',
        },
        {
          id: 'tk9-q4',
          question: 'Bagaimana memastikan sendi bahu robot pas menempel pada badan tanpa ada celah gantung?',
          options: ['Gunakan sudut pandang ortho/top-view dan perataan Align', 'Mengira-ngira dari jauh', 'Mengubah warna background', 'Menutup mata saat menggeser'],
          correctAnswer: 'Gunakan sudut pandang ortho/top-view dan perataan Align',
          explanation: 'Mode Orthographic dan perataan garis Align memastikan objek saling kontak rapat.',
        },
      ],
    },
    {
      id: 'tinkercad-10-architecture-mini',
      topicNumber: 10,
      tier: 'Hard',
      title: 'Desain Arsitektur Mini — Rumah Masa Depan',
      description: 'Mendesain struktur arsitektur 3D dengan pintu, jendela berongga, atap ramping, dan interior.',
      quizzes: [
        {
          id: 'tk10-q1',
          question: 'Teknik apa yang digunakan untuk membuat dinding rumah bercelah atau ruangan berongga di dalamnya?',
          options: ['Membuat dua kubus, mengubah kubus dalam menjadi Hole yang lebih kecil, lalu di-Group', 'Mengikis dinding dengan penghapus', 'Mengecat dinding dengan transparan', 'Memotong kertas'],
          correctAnswer: 'Membuat dua kubus, mengubah kubus dalam menjadi Hole yang lebih kecil, lalu di-Group',
          explanation: 'Shelling/hollowing dilakukan dengan meng-group kubus solid dengan kubus pemotong yang lebih kecil.',
        },
        {
          id: 'tk10-q2',
          question: 'Alat Tinkercad apa yang paling efisien untuk menempelkan jendela tepat pada permukaan miring atap?',
          options: ['Workplane Tool (W) diletakkan di atas permukaan miring', 'Align Tool saja', 'Ruler Tool', 'Zoom Tool'],
          correctAnswer: 'Workplane Tool (W) diletakkan di atas permukaan miring',
          explanation: 'Menekan tombol W lalu mengklik bidang miring memindahkan bidang kerja sementara ke permukaan tersebut.',
        },
        {
          id: 'tk10-q3',
          question: 'Untuk mengembalikan posisi Workplane ke alas standar awal, langkahnya adalah...?',
          options: ['Tekan W lalu klik di area kosong tanpa objek', 'Menutup browser', 'Tekan Esc 5 kali', 'Tekan Delete'],
          correctAnswer: 'Tekan W lalu klik di area kosong tanpa objek',
          explanation: 'Mengeklik area kosong saat Workplane Tool aktif mereset alas ke kondisi standar.',
        },
        {
          id: 'tk10-q4',
          question: 'Penggunaan fitur Ruler (Penggaris) di Tinkercad berguna untuk...?',
          options: ['Menampilkan dimensi angka tepat dan jarak posisi antar objek', 'Mewarnai dinding rumah', 'Mencetak denah rumah', 'Menghentikan waktu'],
          correctAnswer: 'Menampilkan dimensi angka tepat dan jarak posisi antar objek',
          explanation: 'Ruler (tombol R) memberi masukan numerik presisi tinggi untuk tiap dimensi.',
        },
      ],
    },
    {
      id: 'assembler-11-animation-ar',
      topicNumber: 11,
      tier: 'Hard',
      title: 'Interaktivitas & Animasi Model di Assembler AR',
      description: 'Menambahkan efek animasi pergerakan (rotate, move, scale) dan transisi adegan (Scene Transition).',
      quizzes: [
        {
          id: 'as11-q1',
          question: 'Bagaimana cara membuat kipas angin robot berputar terus menerus di Assembler Studio?',
          options: ['Tambahkan Action Rotate -> atur durasi dan centang opsi Loop', 'Memutar HP dengan tangan', 'Meniup mikrofon HP', 'Menghapus kipas'],
          correctAnswer: 'Tambahkan Action Rotate -> atur durasi dan centang opsi Loop',
          explanation: 'Opsi Loop pada aksi Rotate menjalankan animasi rotasi tanpa henti.',
        },
        {
          id: 'as11-q2',
          question: 'Fitur "Multiple Scenes" di Assembler EDU berfungsi untuk...?',
          options: ['Membuat cerita babak/slide 3D berurutan dalam satu proyek yang sama', 'Membuat dua proyek berbeda', 'Merekam lagu', 'Membuka dua aplikasi'],
          correctAnswer: 'Membuat cerita babak/slide 3D berurutan dalam satu proyek yang sama',
          explanation: 'Scenes mengizinkan penyusunan alur cerita AR bertahap layaknya presentasi.',
        },
        {
          id: 'as11-q3',
          question: 'Action type "Switch Scene" dipicu saat pengguna melakukan apa?',
          options: ['Mengetuk (tap) objek pemicu yang sudah diberi aksi pindah scene', 'Goyangkan HP', 'Tidur', 'Menutup aplikasi'],
          correctAnswer: 'Mengetuk (tap) objek pemicu yang sudah diberi aksi pindah scene',
          explanation: 'Switch Scene menghubungkan objek interaktif dengan halaman/scene tujuan.',
        },
        {
          id: 'as11-q4',
          question: 'Manfaat menggabungkan animasi Move dan Scale secara bersamaan pada objek AR adalah...?',
          options: ['Menciptakan efek visual dinamis seperti objek terbang atau muncul membesar', 'Membuat objek tidak terlihat', 'Merusak HP', 'Mengubah nama proyek'],
          correctAnswer: 'Menciptakan efek visual dinamis seperti objek terbang atau muncul membesar',
          explanation: 'Kombinasi pergerakan dan pembesaran memberikan impresi animasi yang kaya.',
        },
      ],
    },
    {
      id: 'assembler-12-final-project',
      topicNumber: 12,
      tier: 'Hard',
      title: 'Proyek Akhir — Diorama 3D & Presentasi AR Interaktif',
      description: 'Mengintegrasikan seluruh hasil desain 3D Tinkercad ke dalam pameran Diorama AR interaktif.',
      quizzes: [
        {
          id: 'as12-q1',
          question: 'Kriteria utama proyek Diorama 3D & AR yang baik adalah...?',
          options: ['Model 3D rapi, informasi jelas, interaktif, dan dapat divisualisasikan dengan lancar di AR', 'Objek dibuat sangat besar hingga menutupi layar', 'Tanpa warna dan tanpa penjelasan', 'Hanya ada satu kubus'],
          correctAnswer: 'Model 3D rapi, informasi jelas, interaktif, dan dapat divisualisasikan dengan lancar di AR',
          explanation: 'Proyek lengkap memadukan kualitas estetika 3D, konten edukasi, dan daya guna AR.',
        },
        {
          id: 'as12-q2',
          question: 'Mengapa jumlah Polygon / Polygon Count pada model 3D perlu dijaga agar tidak terlalu tinggi saat diekspor?',
          options: ['Agar proyek memuat cepat dan lancar tanpa lag di perangkat HP siswa', 'Agar warna berubah otomatis', 'Supaya file tidak bisa dibuka', 'Tidak ada pengaruhnya'],
          correctAnswer: 'Agar proyek memuat cepat dan lancar tanpa lag di perangkat HP siswa',
          explanation: 'Model 3D yang terlalu berat (high-poly) bisa menyebabkan aplikasi AR melambat/crash di HP.',
        },
        {
          id: 'as12-q3',
          question: 'Bagaimana cara mempresentasikan proyek Diorama AR di depan kelas secara menarik?',
          options: ['Cetak AR Marker di kertas -> tayangkan via proyektor -> minta teman-teman scan marker pakai HP', 'Membaca tulisan saja', 'Menyembunyikan HP', 'Menghapus proyek sebelum tampil'],
          correctAnswer: 'Cetak AR Marker di kertas -> tayangkan via proyektor -> minta teman-teman scan marker pakai HP',
          explanation: 'AR Marker terverifikasi memberikan akses kolaboratif langsung bagi audiens.',
        },
        {
          id: 'as12-q4',
          question: 'Setelah proyek dipublikasikan di Assembler EDU, apakah perubahan yang dilakukan di Studio akan terupdate?',
          options: ['Ya, perbaikan otomatis terbarui secara real-time pada link/QR yang sama', 'Tidak, harus buat QR baru tiap saat', 'QR akan kadaluarsa dalam 1 jam', 'Hanya bisa dilihat oleh pencipta'],
          correctAnswer: 'Ya, perbaikan otomatis terbarui secara real-time pada link/QR yang sama',
          explanation: 'Cloud sync Assembler memperbarui konten tayang tanpa merusak QR Code yang sudah dibagikan.',
        },
      ],
    },
  ];

  let ingestedCount = 0;

  for (const t of topicDefinitions) {
    const learningPath = [
      {
        id: `${t.id}-n1`,
        type: 'lesson' as const,
        title: `Materi Utama: ${t.title}`,
        xp: 10,
        explanation: `Selamat datang di topik **${t.title}** (${t.tier} Tier).\n\n${t.description}\n\nPelajari konsep dasarnya dengan cermat sebelum melangkah ke latihan interaktif dan evaluasi kuis!`,
      },
      {
        id: `${t.id}-n2`,
        type: 'code' as const,
        title: 'Panduan Praktik 3D & Langkah Kerja',
        xp: 15,
        explanation: `Ikuti panduan langkah kerja berikut di Tinkercad / Assembler EDU:\n\n1. Buka workspace baru.\n2. Terapkan instruksi transformasi & susun bentuk geometri.\n3. Periksa presisi dari sudut pandang Top, Front, dan Side.`,
        code: {
          language: 'html',
          content: `<!-- Panduan Praktik 3D: ${t.title} -->\n<div class="step-guide">\n  <h3>Sub-Topik: ${t.tier} Level</h3>\n  <p>Status: Langkah Praktik Mandiri</p>\n</div>`,
        },
      },
      {
        id: `${t.id}-n3`,
        type: 'practice' as const,
        title: 'Latihan Pemahaman Konsep',
        xp: 15,
        instructions: `Pilihlah tindakan yang paling tepat saat mengerjakan tugas **${t.title}** di bawah ini:`,
        interactionType: 'multiple-choice' as const,
        options: [
          'Melakukan navigasi dan transformasi presisi sesuai petunjuk',
          'Menggeser objek asal-asalan tanpa melihat sumbu',
          'Menghapus semua komponen dasar',
          'Menutup layar proyek',
        ],
        correctOption: 'Melakukan navigasi dan transformasi presisi sesuai petunjuk',
      },
      {
        id: `${t.id}-n4`,
        type: 'challenge' as const,
        title: `Tantangan Kreatif: ${t.tier} Challenge`,
        xp: 20,
        instructions: `Tantangan ${t.tier}: Terapkan teknik ${t.title} pada proyek 3D milikmu secara mandiri. Pastikan semua posisi rapi dan terukur!`,
      },
      {
        id: `${t.id}-n5`,
        type: 'quiz' as const,
        title: 'Evaluasi Pemahaman (Kuis Topik)',
        xp: 40,
      },
    ];

    const lessonContract: LessonContract = {
      schemaVersion: '1.0',
      metadata: {
        id: t.id,
        title: t.title,
        description: t.description,
        level: 'intermediate',
        category: '3D & AR',
        topicNumber: t.topicNumber,
        estimatedTime: 25,
        xp: 100,
        engineStyle: 'quest',
      },
      objectives: [`Memahami dan menguasai ${t.title}`],
      learningPath,
      quiz: {
        questions: t.quizzes.map((q) => ({
          id: q.id,
          type: 'multiple-choice' as const,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: 25,
        })),
      },
      completion: {
        title: 'Topik Selesai!',
        message: `Luar biasa! Kamu telah menguasai topik ${t.title}.`,
        achievementName: `${t.title} Master`,
        achievementIcon: '🏆',
      },
    };

    const outcome = await ingestLessonContent({
      supabaseAdmin: supabase,
      moduleId,
      lessonId: t.id,
      topicNumber: t.topicNumber,
      title: `[${t.tier}] ${t.title}`,
      description: t.description,
      status: 'published',
      source: 'engine',
      lessonJson: lessonContract,
    });

    if (!outcome.ok) {
      console.error(`❌ Failed to ingest topic ${t.title}:`, outcome.error);
    } else {
      ingestedCount++;
      console.log(`  ✓ Topic ${t.topicNumber}/12 [${t.tier}] "${t.title}" ingested successfully (topicId=${outcome.result.topicId}, quizId=${outcome.result.quizId}, questions=${outcome.result.questionsWritten}).`);
    }
  }

  console.log(`\n🎉 Ingested ${ingestedCount}/12 topics into Module ID: ${moduleId}`);

  // 3. Create Module Assessment / Tryout
  console.log('\n📝 Creating Module Assessment (Tryout)...');
  const tryoutTitle = 'Tryout Evaluasi Modul: Tinkercad & Assembler AR';

  // Check if assessment exists for this module
  const { data: existingAssess } = await supabase
    .from('module_assessments')
    .select('id')
    .eq('module_id', moduleId)
    .maybeSingle();

  let assessmentId: number;

  if (existingAssess) {
    assessmentId = existingAssess.id;
    console.log(`📌 Found existing Assessment ID: ${assessmentId}`);
    // Delete existing questions to re-seed cleanly
    await supabase
      .from('module_assessment_questions')
      .delete()
      .eq('assessment_id', assessmentId);
  } else {
    const { data: newAssess, error: assessErr } = await supabase
      .from('module_assessments')
      .insert({
        module_id: moduleId,
        title: tryoutTitle,
      })
      .select('id')
      .single();

    if (assessErr || !newAssess) {
      throw new Error(`Failed to create module assessment: ${assessErr?.message}`);
    }
    assessmentId = newAssess.id;
    console.log(`✅ Created Module Assessment ID: ${assessmentId}`);
  }

  // Define 8 Tryout Questions covering Easy, Medium, and Hard topics
  const tryoutQuestions = [
    {
      question_text: 'Pada Tinkercad, pintasan keyboard untuk meratakan beberapa objek secara presisi (Align Tool) adalah...?',
      option_a: 'Tombol A',
      option_b: 'Tombol L',
      option_c: 'Tombol G',
      option_d: 'Tombol M',
      correct_option: 'B',
      order_index: 1,
    },
    {
      question_text: 'Untuk menaikkan atau menurunkan elevasi objek dari atas permukaan Workplane (Sumbu Z), digunakan kontrol...?',
      option_a: 'Panah melengkung',
      option_b: 'Black Cone (Kerucut Hitam) di atas objek',
      option_c: 'Titik putih sudut',
      option_d: 'Tombol Delete',
      correct_option: 'B',
      order_index: 2,
    },
    {
      question_text: 'Proses pemotongan 3D (pembuatan lubang/ruang kosong) di Tinkercad terjadi saat...?',
      option_a: 'Objek pemotong berjenis Hole digabungkan (Group) dengan objek Solid',
      option_b: 'Objek diubah warnanya menjadi putih',
      option_c: 'Objek diekspor ke file PDF',
      option_d: 'Kamera diputar 90 derajat',
      correct_option: 'A',
      order_index: 3,
    },
    {
      question_text: 'Tombol Workplane Tool (W) pada Tinkercad sangat berguna saat kita ingin...?',
      option_a: 'Meletakkan objek baru tepat pada bidang permukaan miring objek lain',
      option_b: 'Mencetak model ke kertas HVS',
      option_c: 'Merekam animasi suara',
      option_d: 'Menghapus seluruh desain',
      correct_option: 'A',
      order_index: 4,
    },
    {
      question_text: 'Format file model 3D standar yang umum diekspor dari Tinkercad untuk diunggah ke Assembler EDU adalah...?',
      option_a: '.OBJ atau .GLTF / .GLB',
      option_b: '.MP3 atau .WAV',
      option_c: '.EXE',
      option_d: '.TXT',
      correct_option: 'A',
      order_index: 5,
    },
    {
      question_text: 'Fitur pada Assembler EDU yang memungkinkan munculnya informasi penjelasan edukatif saat objek 3D ditekan di layar HP adalah...?',
      option_a: 'Popup Card / Info Card Interaktif',
      option_b: 'Kamera Filter',
      option_c: 'Latar musik',
      option_d: 'Mode Gelap',
      correct_option: 'A',
      order_index: 6,
    },
    {
      question_text: 'Untuk membuat animasi rotasi objek 3D yang berputar terus-menerus tanpa henti di Assembler Studio, kita perlu mengaktifkan opsi...?',
      option_a: 'Option Loop pada Action Rotate',
      option_b: 'Option Delete',
      option_c: 'Option Lock',
      option_d: 'Option Hide',
      correct_option: 'A',
      order_index: 7,
    },
    {
      question_text: 'Alasan utama mengapa jumlah Polygon (Poly Count) pada model 3D perlu dioptimasi dan dijaga tidak terlalu tinggi sebelum ditampilkan di AR adalah...?',
      option_a: 'Agar visualisasi AR dapat berjalan lancar tanpa lag di smartphone',
      option_b: 'Supaya warna objek menjadi lebih mengkilap',
      option_c: 'Agar proyek tidak bisa dibuka pengguna lain',
      option_d: 'Tidak ada pengaruhnya pada kinerja HP',
      correct_option: 'A',
      order_index: 8,
    },
  ];

  const { data: qInserted, error: qErr } = await supabase
    .from('module_assessment_questions')
    .insert(
      tryoutQuestions.map((q) => ({
        assessment_id: assessmentId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        order_index: q.order_index,
      }))
    )
    .select('id');

  if (qErr) {
    throw new Error(`Failed to insert tryout questions: ${qErr.message}`);
  }

  console.log(`✅ Inserted ${qInserted?.length ?? 0} Tryout Questions for Assessment ID: ${assessmentId}`);
  console.log('\n✨ ALL DONE! Module, 12 Topics (4 Easy, 4 Medium, 4 Hard), Quizzes & Assessment created successfully!');
}

seed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
