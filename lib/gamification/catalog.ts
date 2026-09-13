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
  | { type: 'quiz_score'; minScore: number }
  | {
      type: 'module_assigned';
      category: PathCategory;
      minModuleLevel?: 'beginner' | 'intermediate' | 'advanced' | 'master';
    };

export interface AvatarItem {
  id: string;
  name: string;
  category: PathCategory;
  rarity: Rarity;
  description: string;
  lore?: string;
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

export interface AssignedModuleInfo {
  category: PathCategory;
  level?: string;
}

export interface StudentGamificationStats {
  level: number;
  xp?: number;
  streak: number;
  maxStreak: number;
  bestQuizScore: number;
  assignedCategories?: PathCategory[];
  assignedModules?: AssignedModuleInfo[];
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
    lore: 'Diciptakan di Laboratorium Kode Bits2Bytes, Pixel Bot adalah asisten AI ramah pertama yang dirancang untuk menemani petualang muda. Visor neon cyan miliknya dapat mendeteksi kesalahan sintaksis seketika dan memberikan panduan petunjuk yang hangat.',
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
    lore: 'Berasal dari Hutan Neon Cyberia, Rubah digital ini memiliki kemampuan berlari melintasi algoritma berkecepatan tinggi. Energi auranya berkilau oranye cerah setiap kali ia berhasil menyelesaikan logika berulang.',
    unlock: { type: 'level', minLevel: 2 },
    accentColor: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.4)',
  },

  // Scratch Learning Path (Unlocked via Admin assigned module & level)
  {
    id: 'scratch-cat',
    name: 'Turbo Cat',
    category: 'scratch',
    rarity: 'common',
    description: 'Sprite kucing legendaris bercakar neon, maskot petualangan Scratch.',
    lore: 'Penguasa alam semesta Scratch yang penuh balok warna-warni. Turbo Cat dilahirkan dari baris animasi pertama dan memegang kunci rahasia untuk merangkai gerakan, efek suara, dan mekanik game interaktif.',
    unlock: { type: 'module_assigned', category: 'scratch', minModuleLevel: 'beginner' },
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'block-golem',
    name: 'Block Golem',
    category: 'scratch',
    rarity: 'rare',
    description: 'Golem raksasa kokoh yang disusun dari balok-balok logika kode warna-warni.',
    lore: 'Pelindung Benteng Kode yang bangkit ketika ratusan balok Scratch disusun secara presisi. Tubuhnya yang terbuat dari susunan batu basalt dan kristal emerald mampu menahan error paling rumit sekalipun.',
    unlock: { type: 'module_assigned', category: 'scratch', minModuleLevel: 'intermediate' },
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
    lore: 'Menghuni kedalaman jaringan World Wide Web, Web Weaver menjahit benang-benang HTML menjadi struktur website yang rapi dan kokoh. Jaring mukjizatnya menghubungkan elemen header, container, dan footer secara sempurna.',
    unlock: { type: 'module_assigned', category: 'web', minModuleLevel: 'beginner' },
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
  },
  {
    id: 'css-chameleon',
    name: 'Style Chameleon',
    category: 'web',
    rarity: 'rare',
    description: 'Bunglon estetika digital yang menguasai warna, flexbox, dan tipografi CSS.',
    lore: 'Bunglon estetis yang kulitnya mampu berganti warna mengikuti gradasi CSS3 dan efek glassmorphism. Ia menguasai tata letak responsif sehingga tampilan website selalu memukau di layar mana pun.',
    unlock: { type: 'module_assigned', category: 'web', minModuleLevel: 'intermediate' },
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
    lore: 'Bergerak cepat melintasi memori Python, Cyber Viper mengeksekusi fungsi dan kalkulasi data dalam hitungan milidetik. Semburan petir birunya melambangkan kecepatan dan efisiensi penulisan kode.',
    unlock: { type: 'module_assigned', category: 'python', minModuleLevel: 'beginner' },
    accentColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
  {
    id: 'code-ninja',
    name: 'Terminal Ninja',
    category: 'python',
    rarity: 'rare',
    description: 'Pendekar bayangan bertudung hitam dengan kacamata matrix pemecah bug.',
    lore: 'Seorang master komando CLI yang beroperasi di balik kegelapan layar terminal. Dengan kacamata visor berkode hijau matrix, Terminal Ninja mampu menembus dan membasmi bug tersembunyi tanpa bekas.',
    unlock: { type: 'module_assigned', category: 'python', minModuleLevel: 'intermediate' },
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
    lore: 'Pahlawan dari Dimensi Ketiga yang menempa baju zirah dan perisainya dari jaring poligon 3D. Ia menguasai rotasi sumbu X, Y, Z dan teknik pencahayaan untuk melindungi karya model 3D.',
    unlock: { type: 'module_assigned', category: '3d', minModuleLevel: 'beginner' },
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    id: 'holo-dragon',
    name: 'Holo Dragon',
    category: '3d',
    rarity: 'epic',
    description: 'Naga holografik mecha berdimensi tiga yang dirender dengan shader kristal.',
    lore: 'Naga mistis yang tercipta dari jutaan titik vokal 3D dan pencahayaan ray-tracing. Semburan holografiknya sanggup merender sketsa 2D sederhana menjadi mahakarya bentuk 3D yang hidup.',
    unlock: { type: 'module_assigned', category: '3d', minModuleLevel: 'intermediate' },
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
    lore: 'Prajurit tertinggi Dunia Bits2Bytes yang telah menguasai seluruh disiplin ilmu koding. Zirah kuantum miliknya ditenagai oleh akumulasi XP dan pengalaman memecahkan masalah tingkat tinggi.',
    unlock: { type: 'level', minLevel: 10 },
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
    lore: 'Burung Phoenix magis yang bangkit dari kobaran semangat belajar tanpa henti. Setiap streak harian yang kamu pertahankan membuat kobaran api di sayapnya bernyala semakin terang.',
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
    lore: 'Inti kristal kosmik sempurna yang bersinar paling terang di galaksi koding. Hanya dianugerahkan kepada murid tekun yang berhasil meraih skor kuis sempurna 100 tanpa kesalahan.',
    unlock: { type: 'quiz_score', minScore: 100 },
    accentColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.6)',
  },
];

// ─── Titles Catalog (Rebalanced Levels 1 to 12) ───────────────────────────────

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
    unlock: { type: 'level', minLevel: 4 },
  },

  // Web Dev
  {
    id: 'web-crafter',
    name: 'Web Crafter',
    category: 'web',
    rarity: 'common',
    description: 'Membangun halaman web dengan struktur rapi dan tautan interaktif.',
    unlock: { type: 'level', minLevel: 3 },
  },
  {
    id: 'frontend-artist',
    name: 'Frontend Artist',
    category: 'web',
    rarity: 'rare',
    description: 'Piawai menyulap tampilan website menjadi responsif dan memukau.',
    unlock: { type: 'level', minLevel: 6 },
  },

  // Python
  {
    id: 'script-viper',
    name: 'Script Viper',
    category: 'python',
    rarity: 'common',
    description: 'Menguasai sintaks Python yang bersih dan bertenaga.',
    unlock: { type: 'level', minLevel: 5 },
  },
  {
    id: 'algorithm-ninja',
    name: 'Algorithm Ninja',
    category: 'python',
    rarity: 'rare',
    description: 'Memecahkan teka-teki logika dengan kecepatan tinggi.',
    unlock: { type: 'level', minLevel: 7 },
  },

  // 3D Modeling
  {
    id: 'mesh-sculptor',
    name: 'Mesh Sculptor',
    category: '3d',
    rarity: 'rare',
    description: 'Membentuk model objek tiga dimensi dari poligon dasar.',
    unlock: { type: 'level', minLevel: 8 },
  },
  {
    id: 'dimension-shaper',
    name: 'Dimension Shaper',
    category: '3d',
    rarity: 'epic',
    description: 'Pencipta dunia visual 3D yang megah dan realistis.',
    unlock: { type: 'level', minLevel: 9 },
  },

  // Mastery
  {
    id: 'logic-wizard',
    name: 'Logic Wizard',
    category: 'mastery',
    rarity: 'epic',
    description: 'Menguasai logika pemrograman tingkat lanjut di segala medan.',
    unlock: { type: 'level', minLevel: 10 },
  },
  {
    id: 'byte-overlord',
    name: 'Byte Overlord',
    category: 'mastery',
    rarity: 'legendary',
    description: 'Penguasa tertinggi dunia Bits2Bytes! Legenda yang tak terkalahkan.',
    unlock: { type: 'level', minLevel: 12 },
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
    case 'module_assigned': {
      if (!stats.assignedModules && stats.assignedCategories) {
        return stats.assignedCategories.includes(unlock.category);
      }
      const matchingModules = (stats.assignedModules ?? []).filter(
        (m) => m.category === unlock.category
      );
      if (matchingModules.length === 0) return false;
      if (!unlock.minModuleLevel || unlock.minModuleLevel === 'beginner') {
        return true;
      }
      const levelRank: Record<string, number> = {
        basic: 1,
        beginner: 1,
        pemula: 1,
        intermediate: 2,
        menengah: 2,
        advanced: 3,
        lanjutan: 3,
        master: 4,
      };
      const requiredRank = levelRank[unlock.minModuleLevel] || 2;
      return matchingModules.some(
        (m) => (levelRank[(m.level || '').toLowerCase()] || 1) >= requiredRank
      );
    }
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
    case 'module_assigned': {
      const catLabel = CATEGORY_LABELS[unlock.category]?.label || unlock.category;
      if (unlock.minModuleLevel === 'intermediate' || unlock.minModuleLevel === 'advanced') {
        return `Ambil Modul ${catLabel} (Tingkat Menengah/Lanjutan)`;
      }
      return `Ambil Modul ${catLabel}`;
    }
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
