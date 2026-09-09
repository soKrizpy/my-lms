// lib/gamification/catalog.ts
// Single source of truth for all Gamification Avatars and Rank Titles.
// Supports learning-path based categorisation: Starter, Scratch, Web, Python, 3D Modeling, Mastery, and Achievements.

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type PathCategory =
  | 'starter'
  | 'scratch'
  | 'web'
  | 'python'
  | '3d'
  | 'mastery'
  | 'achievement';

export type UnlockCondition =
  | { type: 'free' }
  | { type: 'level'; minLevel: number }
  | { type: 'streak'; minStreak: number }
  | { type: 'quiz_score'; minScore: number };

export interface AvatarItem {
  id: string;
  name: string;
  category: PathCategory;
  rarity: Rarity;
  description: string;
  unlock: UnlockCondition;
  accentColor: string;
  glowColor: string;
}

export interface TitleItem {
  id: string;
  name: string;
  category: PathCategory;
  rarity: Rarity;
  description: string;
  unlock: UnlockCondition;
}

export interface StudentGamificationStats {
  level: number;
  xp?: number;
  streak: number;
  maxStreak: number;
  bestQuizScore: number;
}

export const DEFAULT_AVATAR_ID = 'pixel-bot';
export const DEFAULT_TITLE_ID = 'novice-coder';

// ─── Avatars Catalog ──────────────────────────────────────────────────────────

export const AVATARS: AvatarItem[] = [
  // Starter
  {
    id: 'pixel-bot',
    name: 'Pixel Bot',
    category: 'starter',
    rarity: 'common',
    description: 'Sahabat robot setia dengan visor neon cyan untuk pemula koding.',
    unlock: { type: 'free' },
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
  },
  {
    id: 'neon-fox',
    name: 'Neon Fox',
    category: 'starter',
    rarity: 'common',
    description: 'Rubah digital lincah berenergi tinggi yang cepat menyerap ilmu.',
    unlock: { type: 'level', minLevel: 2 },
    accentColor: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.4)',
  },

  // Scratch Learning Path
  {
    id: 'scratch-cat',
    name: 'Turbo Cat',
    category: 'scratch',
    rarity: 'common',
    description: 'Sprite kucing legendaris bercakar neon, maskot petualangan Scratch.',
    unlock: { type: 'level', minLevel: 1 },
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'block-golem',
    name: 'Block Golem',
    category: 'scratch',
    rarity: 'rare',
    description: 'Golem raksasa kokoh yang disusun dari balok-balok logika kode warna-warni.',
    unlock: { type: 'level', minLevel: 3 },
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },

  // Website / Web Dev Learning Path (HTML / CSS / JS)
  {
    id: 'web-spider',
    name: 'Web Weaver',
    category: 'web',
    rarity: 'common',
    description: 'Laba-laba siber mungil yang lihai menenun jaring DOM dan elemen HTML.',
    unlock: { type: 'level', minLevel: 2 },
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
  },
  {
    id: 'css-chameleon',
    name: 'Style Chameleon',
    category: 'web',
    rarity: 'rare',
    description: 'Bunglon estetika digital yang menguasai warna, flexbox, dan tipografi CSS.',
    unlock: { type: 'level', minLevel: 4 },
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)',
  },

  // Python Learning Path
  {
    id: 'python-viper',
    name: 'Cyber Viper',
    category: 'python',
    rarity: 'common',
    description: 'Ular siber berlistrik yang gesit mengeksekusi script dan kalkulasi data.',
    unlock: { type: 'level', minLevel: 3 },
    accentColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
  {
    id: 'code-ninja',
    name: 'Terminal Ninja',
    category: 'python',
    rarity: 'rare',
    description: 'Pendekar bayangan bertudung hitam dengan kacamata matrix pemecah bug.',
    unlock: { type: 'level', minLevel: 5 },
    accentColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.4)',
  },

  // 3D Modeling & Design Learning Path
  {
    id: 'voxel-paladin',
    name: 'Voxel Paladin',
    category: '3d',
    rarity: 'rare',
    description: 'Kesatria poligon geometris dengan perisai mesh kawat 3D berkilau.',
    unlock: { type: 'level', minLevel: 4 },
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    id: 'holo-dragon',
    name: 'Holo Dragon',
    category: '3d',
    rarity: 'epic',
    description: 'Naga holografik mecha berdimensi tiga yang dirender dengan shader kristal.',
    unlock: { type: 'level', minLevel: 7 },
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
  },

  // Mastery
  {
    id: 'byte-knight',
    name: 'Byte Knight',
    category: 'mastery',
    rarity: 'epic',
    description: 'Ksatria agung pelindung kode dengan zirah titanium bertenaga kuantum.',
    unlock: { type: 'level', minLevel: 8 },
    accentColor: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.5)',
  },

  // Achievement Based
  {
    id: 'flame-striker',
    name: 'Flame Striker',
    category: 'achievement',
    rarity: 'rare',
    description: 'Phoenix api digital abadi yang membara karena konsistensi belajar 5 hari beruntun.',
    unlock: { type: 'streak', minStreak: 5 },
    accentColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.5)',
  },
  {
    id: 'code-prodigy',
    name: 'Code Prodigy',
    category: 'achievement',
    rarity: 'legendary',
    description: 'Inti energi kosmik sempurna yang hanya dianugerahkan kepada peraih nilai 100 quiz!',
    unlock: { type: 'quiz_score', minScore: 100 },
    accentColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.6)',
  },
];

// ─── Titles Catalog ───────────────────────────────────────────────────────────

export const TITLES: TitleItem[] = [
  // Starter
  {
    id: 'novice-coder',
    name: 'Novice Coder',
    category: 'starter',
    rarity: 'common',
    description: 'Langkah pertama seorang pemrogram handal.',
    unlock: { type: 'free' },
  },

  // Scratch
  {
    id: 'sprite-animator',
    name: 'Sprite Animator',
    category: 'scratch',
    rarity: 'common',
    description: 'Menghidupkan karakter pertama dengan animasi blok.',
    unlock: { type: 'level', minLevel: 2 },
  },
  {
    id: 'block-architect',
    name: 'Block Architect',
    category: 'scratch',
    rarity: 'rare',
    description: 'Merancang mekanik game seru dengan susunan balok Scratch.',
    unlock: { type: 'level', minLevel: 3 },
  },

  // Web Dev
  {
    id: 'web-crafter',
    name: 'Web Crafter',
    category: 'web',
    rarity: 'common',
    description: 'Membangun halaman web dengan struktur rapi dan tautan interaktif.',
    unlock: { type: 'level', minLevel: 2 },
  },
  {
    id: 'frontend-artist',
    name: 'Frontend Artist',
    category: 'web',
    rarity: 'rare',
    description: 'Piawai menyulap tampilan website menjadi responsif dan memukau.',
    unlock: { type: 'level', minLevel: 4 },
  },

  // Python
  {
    id: 'script-viper',
    name: 'Script Viper',
    category: 'python',
    rarity: 'common',
    description: 'Menguasai sintaks Python yang bersih dan bertenaga.',
    unlock: { type: 'level', minLevel: 3 },
  },
  {
    id: 'algorithm-ninja',
    name: 'Algorithm Ninja',
    category: 'python',
    rarity: 'rare',
    description: 'Memecahkan teka-teki logika dengan kecepatan tinggi.',
    unlock: { type: 'level', minLevel: 5 },
  },

  // 3D Modeling
  {
    id: 'mesh-sculptor',
    name: 'Mesh Sculptor',
    category: '3d',
    rarity: 'rare',
    description: 'Membentuk model objek tiga dimensi dari poligon dasar.',
    unlock: { type: 'level', minLevel: 4 },
  },
  {
    id: 'dimension-shaper',
    name: 'Dimension Shaper',
    category: '3d',
    rarity: 'epic',
    description: 'Pencipta dunia visual 3D yang megah dan realistis.',
    unlock: { type: 'level', minLevel: 7 },
  },

  // Mastery
  {
    id: 'logic-wizard',
    name: 'Logic Wizard',
    category: 'mastery',
    rarity: 'epic',
    description: 'Menguasai logika pemrograman tingkat lanjut di segala medan.',
    unlock: { type: 'level', minLevel: 8 },
  },
  {
    id: 'byte-overlord',
    name: 'Byte Overlord',
    category: 'mastery',
    rarity: 'legendary',
    description: 'Penguasa tertinggi dunia Bits2Bytes! Legenda yang tak terkalahkan.',
    unlock: { type: 'level', minLevel: 10 },
  },

  // Achievements
  {
    id: 'streak-sentinel',
    name: 'Streak Sentinel',
    category: 'achievement',
    rarity: 'rare',
    description: 'Penjaga konsistensi belajar dengan kehadiran tak terputus.',
    unlock: { type: 'streak', minStreak: 5 },
  },
  {
    id: 'quiz-sage',
    name: 'Quiz Sage',
    category: 'achievement',
    rarity: 'legendary',
    description: 'Bijaksana dan tajam, meraih nilai sempurna 100 pada ujian pemahaman.',
    unlock: { type: 'quiz_score', minScore: 100 },
  },
];

export const AVATAR_MAP = new Map(AVATARS.map((a) => [a.id, a]));
export const TITLE_MAP = new Map(TITLES.map((t) => [t.id, t]));

export function getAvatarById(id: string): AvatarItem {
  return AVATAR_MAP.get(id) || AVATARS[0];
}

export function getTitleById(id: string): TitleItem {
  return TITLE_MAP.get(id) || TITLES[0];
}

// ─── Evaluator ────────────────────────────────────────────────────────────────

export function isItemUnlocked(
  item: AvatarItem | TitleItem,
  stats: StudentGamificationStats
): boolean {
  const { unlock } = item;
  switch (unlock.type) {
    case 'free':
      return true;
    case 'level':
      return (stats.level ?? 1) >= unlock.minLevel;
    case 'streak':
      return Math.max(stats.streak ?? 0, stats.maxStreak ?? 0) >= unlock.minStreak;
    case 'quiz_score':
      return (stats.bestQuizScore ?? 0) >= unlock.minScore;
    default:
      return false;
  }
}

export function getUnlockDescription(item: AvatarItem | TitleItem): string {
  const { unlock } = item;
  switch (unlock.type) {
    case 'free':
      return 'Tersedia otomatis';
    case 'level':
      return `Buka di Level ${unlock.minLevel}`;
    case 'streak':
      return `Raih Streak ${unlock.minStreak}× Kehadiran`;
    case 'quiz_score':
      return `Raih Skor ${unlock.minScore} pada Quiz`;
    default:
      return 'Terkunci';
  }
}

export const CATEGORY_LABELS: Record<PathCategory, { label: string; icon: string }> = {
  starter: { label: 'Starter', icon: '🌱' },
  scratch: { label: 'Scratch', icon: '🐱' },
  web: { label: 'Web Dev', icon: '🌐' },
  python: { label: 'Python', icon: '🐍' },
  '3d': { label: '3D Design', icon: '🧊' },
  mastery: { label: 'Mastery', icon: '👑' },
  achievement: { label: 'Pencapaian', icon: '🏆' },
};
