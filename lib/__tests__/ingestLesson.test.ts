// lib/__tests__/ingestLesson.test.ts
// Unit tests for the lesson ingestion adapter utilities.
// Run with: npx vitest run lib/__tests__/ingestLesson.test.ts

import { describe, test, expect } from 'vitest';

import {
  mapCorrectAnswerToOption,
  toInsertableQuestion,
  normalizeLessonContentNodes,
  normalizeLessonContentQuiz,
  type EngineQuizQuestion,
} from '../lessonContract';

// ─── mapCorrectAnswerToOption ─────────────────────────────────────────────────

describe('mapCorrectAnswerToOption', () => {
  const baseQuestion: EngineQuizQuestion = {
    id: 'q1',
    question: 'What is HTML?',
    options: ['A markup language', 'A programming language', 'A database', 'An OS'],
    correctAnswer: 'A markup language',
    explanation: 'HTML is a markup language.',
    points: 20,
  };

  test('maps index 0 → A', () => {
    expect(mapCorrectAnswerToOption(baseQuestion)).toBe('A');
  });

  test('maps index 1 → B', () => {
    const q = { ...baseQuestion, correctAnswer: 'A programming language' };
    expect(mapCorrectAnswerToOption(q)).toBe('B');
  });

  test('maps index 2 → C', () => {
    const q = { ...baseQuestion, correctAnswer: 'A database' };
    expect(mapCorrectAnswerToOption(q)).toBe('C');
  });

  test('maps index 3 → D', () => {
    const q = { ...baseQuestion, correctAnswer: 'An OS' };
    expect(mapCorrectAnswerToOption(q)).toBe('D');
  });

  test('returns null when correctAnswer does not match any option', () => {
    const q = { ...baseQuestion, correctAnswer: 'Something else entirely' };
    expect(mapCorrectAnswerToOption(q)).toBeNull();
  });

  test('returns null when options array is missing', () => {
    const q = { ...baseQuestion, options: undefined };
    expect(mapCorrectAnswerToOption(q as any)).toBeNull();
  });

  test('returns null when options array has wrong length', () => {
    const q = { ...baseQuestion, options: ['Only one'] as any };
    expect(mapCorrectAnswerToOption(q)).toBeNull();
  });

  test('returns null when correctAnswer is undefined', () => {
    const q = { ...baseQuestion, correctAnswer: undefined };
    expect(mapCorrectAnswerToOption(q as any)).toBeNull();
  });

  test('trims whitespace before matching', () => {
    const q = { ...baseQuestion, correctAnswer: '  A markup language  ' };
    expect(mapCorrectAnswerToOption(q)).toBe('A');
  });
});

// ─── toInsertableQuestion ─────────────────────────────────────────────────────

describe('toInsertableQuestion', () => {
  const engineQ: EngineQuizQuestion = {
    id: 'q2',
    question: 'What does CSS stand for?',
    options: ['Cascading Style Sheets', 'Computer Style System', 'Creative Styling Scripts', 'Coded Style Syntax'],
    correctAnswer: 'Cascading Style Sheets',
    explanation: 'CSS = Cascading Style Sheets.',
    points: 20,
  };

  test('produces a complete LmsQuizQuestion', () => {
    const row = toInsertableQuestion(engineQ, 42, 'csv');
    expect(row).not.toBeNull();
    expect(row!.quiz_id).toBe(42);
    expect(row!.question_text).toBe('What does CSS stand for?');
    expect(row!.option_a).toBe('Cascading Style Sheets');
    expect(row!.option_b).toBe('Computer Style System');
    expect(row!.option_c).toBe('Creative Styling Scripts');
    expect(row!.option_d).toBe('Coded Style Syntax');
    expect(row!.correct_option).toBe('A');
    expect(row!.source).toBe('csv');
  });

  test('returns null for unmappable question', () => {
    const q = { ...engineQ, correctAnswer: 'WRONG' };
    expect(toInsertableQuestion(q, 42, 'csv')).toBeNull();
  });
});

// ─── normalizeLessonContentNodes ─────────────────────────────────────────────

describe('normalizeLessonContentNodes', () => {
  test('returns empty array for null input', () => {
    expect(normalizeLessonContentNodes(null)).toEqual([]);
  });

  test('returns empty array for non-object input', () => {
    expect(normalizeLessonContentNodes('not an object')).toEqual([]);
    expect(normalizeLessonContentNodes(42)).toEqual([]);
  });

  test('reads engine format learningPath[]', () => {
    const input = {
      learningPath: [
        { id: 'n1', type: 'lesson', title: 'Intro', explanation: 'Hello world' },
      ],
    };
    const nodes = normalizeLessonContentNodes(input);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('n1');
    expect(nodes[0].type).toBe('lesson');
  });

  test('reads legacy CSV format nodes[]', () => {
    const input = {
      nodes: [
        { nodeId: 'n-old', nodeType: 'lesson', title: 'Old Node', content: 'content here', xp: 10 },
      ],
    };
    const nodes = normalizeLessonContentNodes(input);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('n-old');
    expect(nodes[0].type).toBe('lesson');
    expect(nodes[0].explanation).toBe('content here');
    expect(nodes[0].xp).toBe(10);
  });

  test('reads raw array format', () => {
    const input = [
      { id: 'n-raw', type: 'practice', title: 'Raw node' },
    ];
    const nodes = normalizeLessonContentNodes(input);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('n-raw');
  });

  test('prefers learningPath[] over nodes[] when both present', () => {
    const input = {
      learningPath: [{ id: 'lp', type: 'lesson', title: 'From LP' }],
      nodes: [{ nodeId: 'nd', nodeType: 'lesson', title: 'From Nodes' }],
    };
    const nodes = normalizeLessonContentNodes(input);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('lp');
  });
});

// ─── normalizeLessonContentQuiz ───────────────────────────────────────────────

describe('normalizeLessonContentQuiz', () => {
  test('returns empty array for null/missing input', () => {
    expect(normalizeLessonContentQuiz(null)).toEqual([]);
    expect(normalizeLessonContentQuiz({})).toEqual([]);
    expect(normalizeLessonContentQuiz({ quiz: null })).toEqual([]);
    expect(normalizeLessonContentQuiz({ quiz: { questions: null } })).toEqual([]);
  });

  test('returns questions array from valid lesson JSON', () => {
    const input = {
      quiz: {
        questions: [
          { id: 'q1', question: 'Test?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'Ok', points: 20 },
        ],
      },
    };
    const qs = normalizeLessonContentQuiz(input);
    expect(qs).toHaveLength(1);
    expect(qs[0].id).toBe('q1');
  });
});
