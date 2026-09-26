// lib/pet/cypecoCatalog.ts
// Katalog 8 Bayi Cyber Pet Companion (CyPeCo) & Logika Penetasan Telur

export type PetStage = 'EGG' | 'READY_TO_HATCH' | 'BABY_PET';
export type FeedDataType = 'logic' | 'creative' | 'spatial';

export interface BabyPetSpecies {
  id: string;
  name: string;
  title: string;
  element: 'Logic' | 'Creative' | 'Spatial' | 'Balance';
  description: string;
  personality: string;
  accentColor: string;
  bgGradient: string;
  emoji: string;
  favoriteFood: FeedDataType;
  stats: {
    energy: number;
    friendship: number;
    intelligence: number;
  };
}

export const BABY_PETS_CATALOG: Record<string, BabyPetSpecies> = {
  'byte-pup': {
    id: 'byte-pup',
    name: 'Byte Pup',
    title: 'Cyber Puppy yang Setia',
    element: 'Balance',
    description: 'Anak anjing digital yang selalu mendampingi coding dengan penuh semangat dan kesetiaan.',
    personality: 'Setia, ceria, dan penyemangat saat kamu menghadapi bug.',
    accentColor: '#38bdf8',
    bgGradient: 'from-sky-500/20 to-blue-600/30',
    emoji: '🐶',
    favoriteFood: 'logic',
    stats: { energy: 90, friendship: 95, intelligence: 80 },
  },
  'glitch-kitty': {
    id: 'glitch-kitty',
    name: 'Glitch Kitty',
    title: 'Kucing Cyber Serba Ingin Tahu',
    element: 'Creative',
    description: 'Kucing cyber lincah dengan mata neon yang suka menyusup ke baris kode untuk mencari rahasia.',
    personality: 'Penasaran, gesit, dan suka desain visual yang berkilau.',
    accentColor: '#ec4899',
    bgGradient: 'from-pink-500/20 to-purple-600/30',
    emoji: '🐱',
    favoriteFood: 'creative',
    stats: { energy: 85, friendship: 80, intelligence: 90 },
  },
  'pixel-bunny': {
    id: 'pixel-bunny',
    name: 'Pixel Bunny',
    title: 'Kelinci Animasi Penuh Warna',
    element: 'Creative',
    description: 'Kelinci digital yang melompat-lompat meninggalkan jejak pixel pelangi dan partikel seni.',
    personality: 'Kreatif, imajinatif, dan suka tampilan grafis yang indah.',
    accentColor: '#a855f7',
    bgGradient: 'from-purple-500/20 to-pink-600/30',
    emoji: '🐰',
    favoriteFood: 'creative',
    stats: { energy: 95, friendship: 88, intelligence: 82 },
  },
  'circuit-fox': {
    id: 'circuit-fox',
    name: 'Circuit Fox',
    title: 'Rubah Algoritma yang Cerdik',
    element: 'Logic',
    description: 'Rubah sirkuit dengan ekor bercahaya keemasan yang mahir mengurai alur logika dan loop rumit.',
    personality: 'Cerdik, analitis, dan sangat cepat menyelesaikan teka-teki.',
    accentColor: '#f59e0b',
    bgGradient: 'from-amber-500/20 to-orange-600/30',
    emoji: '🦊',
    favoriteFood: 'logic',
    stats: { energy: 80, friendship: 82, intelligence: 98 },
  },
  'robo-dino': {
    id: 'robo-dino',
    name: 'Robo Dino',
    title: 'T-Rex Mini Pelindung Data',
    element: 'Logic',
    description: 'Dinosaurus cyber mungil berkulit baja neon yang menjaga algoritma dari error dan crash.',
    personality: 'Pemberani, tangguh, dan pantang menyerah saat coding sulit.',
    accentColor: '#10b981',
    bgGradient: 'from-emerald-500/20 to-teal-600/30',
    emoji: '🦖',
    favoriteFood: 'logic',
    stats: { energy: 92, friendship: 85, intelligence: 85 },
  },
  'aero-owl': {
    id: 'aero-owl',
    name: 'Aero Owl',
    title: 'Burung Hantu Arsitek Sistem',
    element: 'Spatial',
    description: 'Burung hantu cyber bermata lensa pengukur yang memahami struktur data dan tata letak spasial.',
    personality: 'Tenang, bijaksana, dan teliti dalam merancang tata letak.',
    accentColor: '#6366f1',
    bgGradient: 'from-indigo-500/20 to-blue-700/30',
    emoji: '🦉',
    favoriteFood: 'spatial',
    stats: { energy: 75, friendship: 80, intelligence: 96 },
  },
  'nano-dragon': {
    id: 'nano-dragon',
    name: 'Nano Dragon',
    title: 'Naga Mungil Energi Masa Depan',
    element: 'Spatial',
    description: 'Naga mungil bersayap sirkuit hologram yang memancarkan aura teknologi futuristik.',
    personality: 'Visioner, karismatik, dan suka proyek-proyek besar.',
    accentColor: '#06b6d4',
    bgGradient: 'from-cyan-500/20 to-sky-600/30',
    emoji: '🐲',
    favoriteFood: 'spatial',
    stats: { energy: 88, friendship: 86, intelligence: 92 },
  },
  'spark-otter': {
    id: 'spark-otter',
    name: 'Spark Otter',
    title: 'Berang-berang Pembuat Web Ceria',
    element: 'Balance',
    description: 'Berang-berang siber yang lincah menyusun blok-blok kode seperti membangun bendungan digital.',
    personality: 'Gotong royong, ceria, dan senang mengajak teman sekelas bermain.',
    accentColor: '#14b8a6',
    bgGradient: 'from-teal-500/20 to-cyan-600/30',
    emoji: '🦦',
    favoriteFood: 'creative',
    stats: { energy: 94, friendship: 92, intelligence: 84 },
  },
};

/**
 * Pertanyaan interaktif saat siswa mengetuk telur yang sudah siap menetas (hatchProgress >= 100).
 */
export interface HatchQuiz {
  question: string;
  subtitle: string;
  choices: {
    id: string;
    text: string;
    subtext: string;
    icon: string;
    petCandidates: string[];
  }[];
}

export const HATCH_QUESTION: HatchQuiz = {
  question: 'Telur CyPeCo Mulai Retak! Jawab Satu Pertanyaan Ini:',
  subtitle: 'Pilihlah gaya dan kekuatan super koding yang paling mencerminkan dirimu:',
  choices: [
    {
      id: 'companion',
      text: 'Sahabat yang Selalu Menemani & Menjaga Tim',
      subtext: 'Fokus pada kerja sama, loyalitas, dan pantang menyerah.',
      icon: '🛡️',
      petCandidates: ['byte-pup', 'robo-dino'],
    },
    {
      id: 'puzzle_master',
      text: 'Pemecah Teka-teki & Ahli Logika Cerdas',
      subtext: 'Fokus pada trik algoritma, kecepatan berpikir, dan strategi kode.',
      icon: '⚡',
      petCandidates: ['circuit-fox', 'aero-owl'],
    },
    {
      id: 'artist',
      text: 'Pencipta Animasi, Game Visual & Desain Indah',
      subtext: 'Fokus pada kreativitas, warna, seni pixel, dan efek menarik.',
      icon: '🎨',
      petCandidates: ['pixel-bunny', 'glitch-kitty'],
    },
    {
      id: 'inventor',
      text: 'Penemu Teknologi Masa Depan & Pembangun Web Hebat',
      subtext: 'Fokus pada ide inovatif, struktur 3D, dan energi petualangan.',
      icon: '🚀',
      petCandidates: ['nano-dragon', 'spark-otter'],
    },
  ],
};

/**
 * Menentukan bayi pet berdasarkan pilihan kuis siswa & akumulasi fragment data.
 */
export function determineHatchedPet(
  choiceId: string,
  logicData: number,
  creativeData: number,
  spatialData: number
): BabyPetSpecies {
  const choice = HATCH_QUESTION.choices.find((c) => c.id === choiceId) || HATCH_QUESTION.choices[0];
  const candidates = choice.petCandidates;

  // Bandingkan candidate 1 vs candidate 2 berdasarkan fragment data tertinggi
  if (candidates.length === 1) {
    return BABY_PETS_CATALOG[candidates[0]];
  }

  const [petAId, petBId] = candidates;
  const petA = BABY_PETS_CATALOG[petAId];
  const petB = BABY_PETS_CATALOG[petBId];

  // Bobot score untuk masing-masing calon
  const scoreFor = (pet: BabyPetSpecies) => {
    if (pet.element === 'Logic') return logicData * 1.5 + spatialData;
    if (pet.element === 'Creative') return creativeData * 1.5 + logicData;
    if (pet.element === 'Spatial') return spatialData * 1.5 + creativeData;
    return logicData + creativeData + spatialData;
  };

  return scoreFor(petA) >= scoreFor(petB) ? petA : petB;
}
