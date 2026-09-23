// lib/__tests__/moduleGamification.test.ts
import { describe, test, expect } from 'vitest';

describe('Module Gamification Engine Selector', () => {
  const VALID_ENGINES = ['mimo', 'duolingo', 'boardgame', 'quest', 'flashcard'];

  test('validates gamification_type values correctly', () => {
    VALID_ENGINES.forEach((engine) => {
      expect(VALID_ENGINES.includes(engine)).toBe(true);
    });
  });

  test('defaults to mimo when unspecified or empty', () => {
    const defaultEngine = (input?: string) =>
      input && VALID_ENGINES.includes(input) ? input : 'mimo';

    expect(defaultEngine()).toBe('mimo');
    expect(defaultEngine('')).toBe('mimo');
    expect(defaultEngine('invalid_engine')).toBe('mimo');
    expect(defaultEngine('boardgame')).toBe('boardgame');
    expect(defaultEngine('quest')).toBe('quest');
    expect(defaultEngine('duolingo')).toBe('duolingo');
    expect(defaultEngine('flashcard')).toBe('flashcard');
  });
});
