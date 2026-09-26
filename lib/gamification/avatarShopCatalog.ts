// lib/gamification/avatarShopCatalog.ts
// Katalog Lengkap Aksesori Avatar Toko Wardrobe (Roblox-Style) untuk bits2bytes LMS

export type AccessoryCategory = 'hat' | 'visor' | 'hood' | 'headset' | 'crown';

export interface AccessoryItem {
  id: string;
  name: string;
  category: AccessoryCategory;
  price: number;
  description: string;
  accentColor: string;
  glowColor: string;
  iconType: string;
  badge?: string;
}

export const AVATAR_ACCESSORIES: AccessoryItem[] = [
  // --- HATS & CAPS ---
  {
    id: 'topi-hacker',
    name: 'Topi Hacker Cyberpunk',
    category: 'hat',
    price: 50,
    description: 'Topi baseball cyber dengan visor HUD neon transparan dan pemancar sinyal kode.',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    iconType: 'hacker-cap',
    badge: 'Popular',
  },
  {
    id: 'dino-cap',
    name: 'Topi Dino Kawaii',
    category: 'hat',
    price: 55,
    description: 'Topi lucu bergigi dinosaurus mini dengan sirip hijau neon yang gemas.',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    iconType: 'dino-cap',
    badge: 'Cute',
  },
  {
    id: 'ninja-headband',
    name: 'Ikat Kepala Cyber Ninja',
    category: 'hat',
    price: 40,
    description: 'Ikat kepala shinobi modern bertuliskan kanji biner pemotong bug tercepat.',
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    iconType: 'ninja-band',
  },
  {
    id: 'rookie-band',
    name: 'Bandana Coder Pemula',
    category: 'hat',
    price: 30,
    description: 'Bandana rajut semangat pantang menyerah untuk coder yang baru memulai petualangan.',
    accentColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    iconType: 'rookie-band',
    badge: 'Starter',
  },

  // --- HOODS & MYSTIC ---
  {
    id: 'tudung-wizard',
    name: 'Tudung Code Wizard',
    category: 'hood',
    price: 75,
    description: 'Tudung tenun mistis dengan rune biner bersinar dan kristal logika penguat fokus syntax.',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    iconType: 'wizard-hood',
    badge: 'Mystic',
  },

  // --- HEADSETS ---
  {
    id: 'headset-cat',
    name: 'Cyber Cat RGB Headset',
    category: 'headset',
    price: 60,
    description: 'Headset telinga kucing dengan equalizer audio RGB responsif dan mikrofon komando regu.',
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.5)',
    iconType: 'cyber-cat',
    badge: 'Trending',
  },
  {
    id: 'headset-pro',
    name: 'Headset Pro Gamer',
    category: 'headset',
    price: 65,
    description: 'Headset gaming peredam bising dengan bantalan busa nyaman dan antena pemancar audio jernih.',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    iconType: 'gamer-headset',
  },

  // --- VISORS & GOGGLES ---
  {
    id: 'visor-neon',
    name: 'Kacamata HUD Scouter',
    category: 'visor',
    price: 45,
    description: 'Kacamata visor neon satu mata yang memproyeksikan baris variabel dan status energi koding.',
    accentColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.5)',
    iconType: 'neon-visor',
  },
  {
    id: 'vr-goggles',
    name: 'Kacamata VR Metaverse',
    category: 'visor',
    price: 80,
    description: 'Perangkat VR futuristik untuk melihat dunia game 3D langsung dari sudut pandang robot.',
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    iconType: 'vr-goggles',
    badge: 'High-Tech',
  },
  {
    id: 'steampunk-goggles',
    name: 'Goggles Retro Steampunk',
    category: 'visor',
    price: 70,
    description: 'Kacamata pelindung kuningan antik berputar dengan lensa pembesar syntax mikroskopis.',
    accentColor: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    iconType: 'steampunk-goggles',
  },

  // --- CROWNS & SPECIAL ---
  {
    id: 'golden-halo',
    name: 'Lingkaran Halo Emas',
    category: 'crown',
    price: 90,
    description: 'Lingkaran suci data emas melayang di atas kepala sebagai bukti coder yang berhati mulia.',
    accentColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.6)',
    iconType: 'golden-halo',
    badge: 'Epic',
  },
  {
    id: 'cyber-crown',
    name: 'Mahkota Juara Algoritma',
    category: 'crown',
    price: 120,
    description: 'Mahkota megah bertatahkan batu kristal kuantum bagi siswa yang pantang menyerah menaklukkan tantangan.',
    accentColor: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.7)',
    iconType: 'cyber-crown',
    badge: 'Legendary',
  },
];

export function getAccessoryById(id: string | null | undefined): AccessoryItem | null {
  if (!id) return null;
  return AVATAR_ACCESSORIES.find((item) => item.id === id) || null;
}
