import { describe, it, expect } from 'vitest';
import {
  getAvatarById,
  getTitleById,
  isItemUnlocked,
  getUnlockDescription,
  DEFAULT_AVATAR_ID,
  DEFAULT_TITLE_ID,
} from './catalog';

describe('Gamification Catalog & Unlock System', () => {
  it('should have default avatar and title defined and unlocked for level 1', () => {
    const defaultAvatar = getAvatarById(DEFAULT_AVATAR_ID);
    const defaultTitle = getTitleById(DEFAULT_TITLE_ID);

    expect(defaultAvatar).toBeDefined();
    expect(defaultAvatar.id).toBe('pixel-bot');
    expect(defaultTitle).toBeDefined();
    expect(defaultTitle.id).toBe('novice-coder');

    const baseStats = { level: 1, streak: 0, maxStreak: 0, bestQuizScore: 0 };
    expect(isItemUnlocked(defaultAvatar, baseStats)).toBe(true);
    expect(isItemUnlocked(defaultTitle, baseStats)).toBe(true);
  });

  it('should unlock module-assigned avatars when student is assigned matching categories', () => {
    const scratchCat = getAvatarById('scratch-cat');
    const webSpider = getAvatarById('web-spider');
    const pythonViper = getAvatarById('python-viper');
    const voxelPaladin = getAvatarById('voxel-paladin');

    const unassignedStats = { level: 10, streak: 0, maxStreak: 0, bestQuizScore: 0, assignedCategories: [] };
    expect(isItemUnlocked(scratchCat, unassignedStats)).toBe(false);
    expect(isItemUnlocked(webSpider, unassignedStats)).toBe(false);
    expect(isItemUnlocked(pythonViper, unassignedStats)).toBe(false);
    expect(isItemUnlocked(voxelPaladin, unassignedStats)).toBe(false);

    const scratchStats = { level: 1, streak: 0, maxStreak: 0, bestQuizScore: 0, assignedCategories: ['scratch' as const] };
    expect(isItemUnlocked(scratchCat, scratchStats)).toBe(true);
    expect(isItemUnlocked(webSpider, scratchStats)).toBe(false);

    const multiStats = { level: 1, streak: 0, maxStreak: 0, bestQuizScore: 0, assignedCategories: ['scratch' as const, 'python' as const] };
    expect(isItemUnlocked(scratchCat, multiStats)).toBe(true);
    expect(isItemUnlocked(pythonViper, multiStats)).toBe(true);
    expect(isItemUnlocked(webSpider, multiStats)).toBe(false);
  });

  it('should unlock titles based on rebalanced level curve', () => {
    const lvl2Title = getTitleById('sprite-animator'); // Level 2
    const lvl6Title = getTitleById('frontend-artist'); // Level 6
    const lvl12Title = getTitleById('byte-overlord'); // Level 12

    const lvl1Stats = { level: 1, streak: 0, maxStreak: 0, bestQuizScore: 0 };
    expect(isItemUnlocked(lvl2Title, lvl1Stats)).toBe(false);

    const lvl6Stats = { level: 6, streak: 0, maxStreak: 0, bestQuizScore: 0 };
    expect(isItemUnlocked(lvl2Title, lvl6Stats)).toBe(true);
    expect(isItemUnlocked(lvl6Title, lvl6Stats)).toBe(true);
    expect(isItemUnlocked(lvl12Title, lvl6Stats)).toBe(false);

    const lvl12Stats = { level: 12, streak: 0, maxStreak: 0, bestQuizScore: 0 };
    expect(isItemUnlocked(lvl12Title, lvl12Stats)).toBe(true);
  });

  it('should unlock streak achievements based on current or max streak', () => {
    const flameStriker = getAvatarById('flame-striker');
    const streakSentinel = getTitleById('streak-sentinel');

    const noStreak = { level: 10, streak: 2, maxStreak: 4, bestQuizScore: 100 };
    expect(isItemUnlocked(flameStriker, noStreak)).toBe(false);
    expect(isItemUnlocked(streakSentinel, noStreak)).toBe(false);

    const achievedMaxStreak = { level: 1, streak: 1, maxStreak: 5, bestQuizScore: 0 };
    expect(isItemUnlocked(flameStriker, achievedMaxStreak)).toBe(true);
    expect(isItemUnlocked(streakSentinel, achievedMaxStreak)).toBe(true);
  });

  it('should unlock quiz achievements on score 100', () => {
    const codeProdigy = getAvatarById('code-prodigy');
    const quizSage = getTitleById('quiz-sage');

    const score99 = { level: 10, streak: 10, maxStreak: 10, bestQuizScore: 99 };
    expect(isItemUnlocked(codeProdigy, score99)).toBe(false);
    expect(isItemUnlocked(quizSage, score99)).toBe(false);

    const score100 = { level: 1, streak: 0, maxStreak: 0, bestQuizScore: 100 };
    expect(isItemUnlocked(codeProdigy, score100)).toBe(true);
    expect(isItemUnlocked(quizSage, score100)).toBe(true);
  });

  it('should fall back gracefully to default item when invalid ID is requested', () => {
    const unknownAvatar = getAvatarById('non-existent-id');
    expect(unknownAvatar.id).toBe(DEFAULT_AVATAR_ID);

    const unknownTitle = getTitleById('non-existent-id');
    expect(unknownTitle.id).toBe(DEFAULT_TITLE_ID);
  });

  it('should provide localized Indonesian unlock descriptions', () => {
    const defaultAvatar = getAvatarById('pixel-bot');
    expect(getUnlockDescription(defaultAvatar)).toBe('Tersedia otomatis');

    const scratchAvatar = getAvatarById('scratch-cat');
    expect(getUnlockDescription(scratchAvatar)).toContain('Ambil Modul Scratch');

    const streakItem = getAvatarById('flame-striker');
    expect(getUnlockDescription(streakItem)).toContain('Streak 5');

    const quizItem = getAvatarById('code-prodigy');
    expect(getUnlockDescription(quizItem)).toContain('Skor 100');
  });
});
