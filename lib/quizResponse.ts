/**
 * Extract quiz questions from either supported student-quiz response shape.
 *
 * The API originally returned the question array directly. It now returns a
 * metadata envelope containing that array in `questions`. Keeping this logic
 * here prevents individual quiz entry points from drifting out of sync.
 */
export function getQuizQuestions<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === "object") {
    const questions = (payload as { questions?: unknown }).questions;
    if (Array.isArray(questions)) return questions as T[];
  }

  return [];
}
