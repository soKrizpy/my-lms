import type { QuestionResult } from './lmsData';

/**
 * Computes a percentage score rounded to the nearest integer.
 * @param correctCount - Number of correctly answered questions (integer, ≥ 0)
 * @param totalQuestions - Total number of questions (integer, > 0)
 * @returns Integer in range 0–100
 */
export function computeScore(correctCount: number, totalQuestions: number): number {
  return Math.round((correctCount / totalQuestions) * 100);
}

/**
 * Returns the higher of two scores.
 * @param existingBest - The best score recorded so far (0–100)
 * @param newScore - The newly computed score (0–100)
 * @returns The maximum of the two values
 */
export function computeBestScore(existingBest: number, newScore: number): number {
  return Math.max(existingBest, newScore);
}

/**
 * Maps a list of questions and the student's submitted answers into per-question result objects.
 * @param answers - Map of question id (as string) → selected option
 * @param questions - Array of questions with their correct options
 * @returns QuestionResult array in the same order as `questions`
 */
export function buildQuestionResults(
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>,
  questions: Array<{ id: number; question_text: string; correct_option: 'A' | 'B' | 'C' | 'D' }>
): QuestionResult[] {
  return questions.map((q) => {
    const selected_option = answers[String(q.id)];
    const correct_option = q.correct_option;
    return {
      question_id: q.id,
      question_text: q.question_text,
      selected_option,
      correct_option,
      is_correct: selected_option === correct_option,
    };
  });
}
