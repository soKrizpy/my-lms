// lib/lessonContract.ts
// Shared TypeScript contract between bits2bytes-lesson-engine and bits2bytes-lms.
//
// This file is the single source of truth for the Lesson Engine JSON shape
// as consumed by the LMS ingestion layer. It mirrors the engine's
// src/types/lesson.ts (MAJOR version 1.x) — do NOT import from the engine
// package directly to avoid a circular/cross-repo dependency.
//
// Also exports helper utilities needed by the ingestion adapter:
//   - mapCorrectAnswerToOption()  — engine free-text → LMS letter A|B|C|D
//   - normalizeLessonContentNodes() — unifies old `nodes[]` and new `learningPath[]` shapes

// ─── Core types (mirrors engine's src/types/lesson.ts) ───────────────────────

export type LessonLevel = 'beginner' | 'intermediate' | 'advanced';

export type EngineStyle =
  | 'mimo'
  | 'boardgame'
  | 'flashcard'
  | 'story'
  | 'arcade'
  | 'slide'
  | 'quest';

export interface LessonMetadata {
  /** Stable topic identifier, e.g. "beginner-html-01" */
  id: string;
  title: string;
  description: string;
  level: LessonLevel;
  category: string;
  topicNumber: number;
  estimatedTime: number;
  xp: number;
  engineStyle?: EngineStyle;
}

export type NodeType = 'lesson' | 'code' | 'practice' | 'challenge' | 'quiz';

/** Minimal shape for a learning-path node as stored in lesson_content.learningPath */
export interface LearningNode {
  id: string;
  type: NodeType;
  title: string;
  xp?: number;
  explanation?: string;
  instructions?: string;
  interactionType?: string;
  options?: string[];
  correctOption?: string;
  content?: string;
  code?: { language: string; content: string };
  language?: string;
  codeContent?: string;
  // Legacy CSV-imported keys (flat shape written by buildNode())
  nodeId?: string;
  nodeType?: NodeType;
}

/** Engine-format quiz question (4 free-text options + correctAnswer string) */
export interface EngineQuizQuestion {
  id: string;
  type?: 'multiple-choice' | 'image-choice';
  question: string;
  options?: [string, string, string, string];
  correctAnswer?: string;
  explanation: string;
  points: number;
}

/** Root contract for a complete Lesson JSON (v1.x) */
export interface LessonContract {
  schemaVersion: string;
  metadata: LessonMetadata;
  objectives?: string[];
  learningPath: LearningNode[];
  quiz: {
    questions: EngineQuizQuestion[];
  };
  completion?: {
    title: string;
    message: string;
    achievementName: string;
    achievementIcon?: string;
  };
}

// ─── LMS relational types ─────────────────────────────────────────────────────

/** The letter key stored in quiz_questions.correct_option */
export type CorrectOption = 'A' | 'B' | 'C' | 'D';

/** A quiz question ready to INSERT into quiz_questions */
export interface LmsQuizQuestion {
  quiz_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: CorrectOption;
  source: 'manual' | 'csv' | 'engine';
}

// ─── Utility: correctAnswer → correct_option ──────────────────────────────────

const OPTION_LETTERS: CorrectOption[] = ['A', 'B', 'C', 'D'];

/**
 * Maps an engine-format quiz question to its LMS `correct_option` letter.
 *
 * The engine stores `correctAnswer` as a free-text string that must match one
 * of the four `options[]` entries exactly. The LMS stores a letter `A|B|C|D`.
 *
 * @returns The letter, or null if the answer cannot be mapped (question skipped).
 */
export function mapCorrectAnswerToOption(
  question: EngineQuizQuestion,
): CorrectOption | null {
  const { options, correctAnswer } = question;

  if (!options || options.length !== 4 || !correctAnswer) return null;

  const idx = options.findIndex(
    (opt) => opt.trim() === correctAnswer.trim(),
  );

  if (idx === -1) {
    console.warn(
      `[lessonContract] Cannot map correctAnswer "${correctAnswer}" for question "${question.id}". ` +
        `Options: ${JSON.stringify(options)}. Question will be skipped.`,
    );
    return null;
  }

  return OPTION_LETTERS[idx] ?? null;
}

/**
 * Converts an `EngineQuizQuestion` to an `LmsQuizQuestion` ready for DB insert.
 * Returns null if the question cannot be mapped (e.g. wrong option count, no match).
 */
export function toInsertableQuestion(
  q: EngineQuizQuestion,
  quizId: number,
  source: LmsQuizQuestion['source'],
): LmsQuizQuestion | null {
  const correct_option = mapCorrectAnswerToOption(q);
  if (!correct_option) return null;

  const opts = q.options!;
  return {
    quiz_id: quizId,
    question_text: q.question,
    option_a: opts[0],
    option_b: opts[1],
    option_c: opts[2],
    option_d: opts[3],
    correct_option,
    source,
  };
}

// ─── Utility: normalize lesson_content nodes ──────────────────────────────────

/**
 * Normalises the raw `lesson_content` JSONB value from the `topics` table into
 * a consistent array of `LearningNode` objects.
 *
 * Handles two historical shapes:
 *  (a) Engine format (post-adapter):  `{ learningPath: [...] }`
 *  (b) Legacy CSV format (pre-adapter): `{ nodes: [...] }` or just `[...]`
 *
 * Used by TopicLearningFlowModal and extractMateriSlides/extractMimoQuestions.
 */
export function normalizeLessonContentNodes(raw: unknown): LearningNode[] {
  if (!raw || typeof raw !== 'object') return [];

  // Engine format — preferred
  if (Array.isArray((raw as Record<string, unknown>).learningPath)) {
    return (raw as { learningPath: LearningNode[] }).learningPath;
  }

  // Legacy flat-node format written by the old buildNode() / buildLessonJson()
  if (Array.isArray((raw as Record<string, unknown>).nodes)) {
    const nodes = (raw as { nodes: unknown[] }).nodes;
    return nodes
      .filter((n): n is Record<string, unknown> => n != null && typeof n === 'object')
      .map((n) => ({
        // Normalise legacy keys to engine-format keys
        id: (n.nodeId as string) || (n.id as string) || '',
        type: ((n.nodeType as NodeType) || (n.type as NodeType) || 'lesson'),
        title: (n.title as string) || '',
        xp: typeof n.xp === 'number' ? n.xp : undefined,
        explanation: (n.explanation as string) || (n.content as string) || undefined,
        instructions: (n.instructions as string) || undefined,
        interactionType: (n.interactionType as string) || undefined,
        options: Array.isArray(n.options) ? n.options as string[] : undefined,
        correctOption: (n.correctOption as string) || undefined,
        code: n.code as { language: string; content: string } | undefined,
      }));
  }

  // Raw array (very old shape)
  if (Array.isArray(raw)) {
    return raw as LearningNode[];
  }

  return [];
}

/**
 * Normalises the quiz questions from a raw lesson_content JSONB value.
 * Returns an empty array if the content has no quiz section.
 */
export function normalizeLessonContentQuiz(raw: unknown): EngineQuizQuestion[] {
  if (!raw || typeof raw !== 'object') return [];
  const quiz = (raw as Record<string, unknown>).quiz;
  if (!quiz || typeof quiz !== 'object') return [];
  const questions = (quiz as Record<string, unknown>).questions;
  if (!Array.isArray(questions)) return [];
  return questions as EngineQuizQuestion[];
}
