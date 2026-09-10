export interface AssessmentXPRow {
  assessment_id: number;
  score: number;
}

/**
 * Computes Total_XP = engineXpTotal + Σ floor(max_score_per_assessment / 100 * 50).
 *
 * De-duplicates assessment rows by selecting the highest score per `assessment_id`.
 * Returns `engineXpTotal` unchanged when `assessmentRows` is empty.
 */
export function computeTotalXP(
  engineXpTotal: number,
  assessmentRows: AssessmentXPRow[]
): number {
  // Group by assessment_id and keep the max score per group
  const bestPerAssessment = new Map<number, number>();
  for (const row of assessmentRows) {
    const current = bestPerAssessment.get(row.assessment_id) ?? 0;
    bestPerAssessment.set(row.assessment_id, Math.max(current, row.score));
  }

  // Sum assessment bonuses: floor(maxScore / 100 * 50), clamped to >= 0
  let assessmentBonus = 0;
  for (const maxScore of bestPerAssessment.values()) {
    assessmentBonus += Math.max(0, Math.floor((maxScore / 100) * 50));
  }

  return engineXpTotal + assessmentBonus;
}

/**
 * Derives level from Total_XP.
 * Level 1 = 0–99 XP, Level 2 = 100–199 XP, no upper cap.
 */
export function computeLevel(totalXP: number): number {
  return Math.floor(totalXP / 100) + 1;
}
