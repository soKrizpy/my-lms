export type BadgeRarity = 'common' | 'rare' | 'epic';

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  rarity: BadgeRarity;
  description: string;
}

export interface EarnedBadgeRow {
  badge_id: string;
  earned_at: string; // ISO 8601 string
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'first-lesson',
    name: 'Langkah Pertama',
    icon: '🌱',
    rarity: 'common',
    description: 'Selesaikan lesson pertama',
  },
  {
    id: 'lesson-streak-3',
    name: 'Trio Pejuang',
    icon: '⚡',
    rarity: 'common',
    description: 'Selesaikan 3 lesson',
  },
  {
    id: 'lesson-streak-10',
    name: 'Petarung Sejati',
    icon: '🏆',
    rarity: 'rare',
    description: 'Selesaikan 10 lesson',
  },
  {
    id: 'perfect-quiz',
    name: 'Nilai Sempurna',
    icon: '💯',
    rarity: 'epic',
    description: 'Raih skor 100 pada quiz atau assessment mana pun',
  },
  {
    id: 'first-module',
    name: 'Modul Pertama Selesai',
    icon: '🎓',
    rarity: 'rare',
    description: 'Selesaikan seluruh topik pada satu modul',
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    icon: '🧠',
    rarity: 'rare',
    description: 'Raih skor ≥ 90 pada 5 quiz berbeda',
  },
  {
    id: 'tryout-ace',
    name: 'Jagoan Tryout',
    icon: '🎯',
    rarity: 'epic',
    description: 'Raih skor ≥ 80 pada assessment modul mana pun',
  },
];

export const BADGE_MAP = new Map(BADGE_CATALOG.map((b) => [b.id, b]));

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_MAP.get(id);
}
