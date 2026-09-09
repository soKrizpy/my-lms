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

  it('should unlock level-based learning path avatars at appropriate levels', () => {
    const scratchCat = getAvatarById('scratch-cat'); // Level 1
    const webSpider = getAvatarById('web-spider'); // Level 2
    const blockGolem = getAvatarById('block-golem'); // Level 3
    const pythonViper = getAvatarById('python-viper'); // Level 3
    const voxelPaladin = getAvatarById('voxel-paladin'); // Level 4
    const holoDragon = getAvatarById('holo-dragon'); // Level 7

    const lvl1Stats = { level: 1, streak: 0, maxStreak: 0, bestQuizScore: 0 };
    expect(isItemUnlocked(scratchCat, lvl1Stats)).toBe(true);
    expect(isItemUnlocked(webSpider, lvl1Stats)).toBe(false);
    expect(isItemUnlocked(blockGolem, lvl1Stats)).toBe(false);
    expect(isItemUnlocked(voxelPaladin, lvl1Stats)).toBe(false);

    const lvl4Stats = { level: 4, streak: 0, maxStreak: 0, bestQuizScore: 0 };
    expect(isItemUnlocked(webSpider, lvl4Stats)).toBe(true);
    expect(isItemUnlocked(blockGolem, lvl4Stats)).toBe(true);
    expect(isItemUnlocked(pythonViper, lvl4Stats)).toBe(true);
    expect(isItemUnlocked(voxelPaladin, lvl4Stats)).toBe(true);
    expect(isItemUnlocked(holoDragon, lvl4Stats)).toBe(false);

    const lvl8Stats = { level: 8, streak: 0, maxStreak: 0, bestQuizScore: 0 };
    expect(isItemUnlocked(holoDragon, lvl8Stats)).toBe(true);
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

    const lvl5Item = getAvatarById('code-ninja');
    expect(getUnlockDescription(lvl5Item)).toContain('Level 5');

    const streakItem = getAvatarById('flame-striker');
    expect(getUnlockDescription(streakItem)).toContain('Streak 5');

    const quizItem = getAvatarById('code-prodigy');
    expect(getUnlockDescription(quizItem)).toContain('Skor 100');
  });
});
