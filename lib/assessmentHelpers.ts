/**
 * Pure helper functions for the Module Assessment (Tryout) feature.
 * No imports required — all functions are self-contained.
 */

/**
 * Returns the action label for the assessment entry point based on how many
 * attempts the student has already used.
 *
 * - 0 attempts → "Mulai Tryout"   (start a fresh attempt)
 * - 1 attempt  → "Ulangi Tryout"  (retry for a better score)
 *
 * Validates: Requirements 5.2
 */
export function getAssessmentActionLabel(attemptCount: 0 | 1): string {
  return attemptCount === 0 ? 'Mulai Tryout' : 'Ulangi Tryout';
}

/**
 * Returns the attempt progress label shown to the student before or after
 * taking the assessment.
 *
 * - 0 attempts used → "Percobaan 1 dari 2"
 * - 1 attempt used  → "Percobaan 2 dari 2"
 *
 * Validates: Requirements 5.5
 */
export function formatAttemptLabel(attemptCount: 0 | 1): string {
  return `Percobaan ${attemptCount + 1} dari 2`;
}

/**
 * Sorts an array of student result objects for display in the admin overview.
 *
 * Sort rules (applied in order):
 * 1. Results with `attempt_count > 0` precede results with `attempt_count === 0`.
 * 2. Within each group, results are ordered by `best_score` descending.
 * 3. Results with equal `best_score` maintain their original relative order
 *    (stable sort).
 *
 * Does NOT mutate the input array — returns a new array.
 *
 * Validates: Requirements 7.3
 */
export function sortStudentResults<T extends { attempt_count: number; best_score: number }>(
  results: T[]
): T[] {
  // Spread to avoid mutating the caller's array.
  return [...results].sort((a, b) => {
    const aHasAttempt = a.attempt_count > 0 ? 0 : 1; // 0 = has attempts, 1 = no attempts
    const bHasAttempt = b.attempt_count > 0 ? 0 : 1;

    // Primary: students with attempts come first
    if (aHasAttempt !== bHasAttempt) {
      return aHasAttempt - bHasAttempt;
    }

    // Secondary: higher best_score first (descending)
    return b.best_score - a.best_score;
  });
}
