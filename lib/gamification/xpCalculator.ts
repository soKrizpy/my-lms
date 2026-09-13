export interface AssessmentXPRow {
  assessment_id: number;
  score: number;
}

/**
 * Calculates the exact XP required to advance from `level` to `level + 1`.
 * Uses a +30% progressive growth curve (Base 100 XP * 1.3^(level-1)).
 */
export function getXPNeededForLevel(level: number): number {
  if (level <= 1) return 100;
  return Math.round(100 * Math.pow(1.3, level - 1));
}

/**
 * Calculates the cumulative minimum Total XP required to reach a specific level.
 */
export function getMinXPForLevel(targetLevel: number): number {
  if (targetLevel <= 1) return 0;
  let totalMinXP = 0;
  for (let lvl = 1; lvl < targetLevel; lvl++) {
    totalMinXP += getXPNeededForLevel(lvl);
  }
  return totalMinXP;
}

/**
 * Derives level from Total_XP using a progressive +30% curve.
 * Level 1 = 0–99 XP, Level 2 = 100–229 XP, Level 3 = 230–399 XP, etc.
 */
export function computeLevel(totalXP: number): number {
  if (totalXP <= 0) return 1;
  let level = 1;
  let accumulatedXP = 0;
  while (true) {
    const needed = getXPNeededForLevel(level);
    if (totalXP < accumulatedXP + needed) {
      return level;
    }
    accumulatedXP += needed;
    level++;
  }
}

/**
 * Calculates detailed level progress metrics for UI progress bars.
 */
export function getLevelProgress(totalXP: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
} {
  const currentLevel = computeLevel(totalXP);
  const minXPForCurrent = getMinXPForLevel(currentLevel);
  const xpNeededForNextLevel = getXPNeededForLevel(currentLevel);
  const xpInCurrentLevel = Math.max(0, totalXP - minXPForCurrent);
  const progressPercent = Math.min(
    100,
    Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100)
  );

  return {
    currentLevel,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercent,
  };
}

/**
 * Computes Total_XP = engineXpTotal + Σ floor(max_score_per_assessment / 100 * 50) + perfect quiz bonuses + module mastery bonuses.
 */
export function computeTotalXP(
  engineXpTotal: number,
  assessmentRows: AssessmentXPRow[],
  options?: { completedModulesCount?: number }
): number {
  const bestPerAssessment = new Map<number, number>();
  for (const row of assessmentRows) {
    const current = bestPerAssessment.get(row.assessment_id) ?? 0;
    bestPerAssessment.set(row.assessment_id, Math.max(current, row.score));
  }

  let assessmentBonus = 0;
  let perfectQuizBonus = 0;

  for (const maxScore of bestPerAssessment.values()) {
    assessmentBonus += Math.max(0, Math.floor((maxScore / 100) * 50));
    // Perfect score (100%) awards +25 XP bonus
    if (maxScore >= 100) {
      perfectQuizBonus += 25;
    }
  }

  // Module Mastery Bonus (+100 XP per completed module)
  const moduleBonus = (options?.completedModulesCount || 0) * 100;

  return engineXpTotal + assessmentBonus + perfectQuizBonus + moduleBonus;
}
