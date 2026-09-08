// lib/streakCalculator.ts
// Pure function for calculating class attendance streak.
//
// A streak is defined as consecutive meetings with has_joined = true,
// counting backwards from the most recent past meeting.
// The streak BREAKS if any past meeting has has_joined = false.
//
// Only meetings that have already happened (meetingDate <= now) are considered.
// Future meetings are ignored entirely.

export interface MeetingRecord {
  meetingDate: Date;
  hasJoined: boolean;
}

export interface StreakResult {
  /** Consecutive meetings attended counting back from most recent past meeting. */
  currentStreak: number;
  /** Historical best consecutive streak across all past meetings. */
  maxStreak: number;
  /** Date of the most recently attended meeting, or null if none. */
  lastJoinedDate: Date | null;
}

/**
 * Calculates the student's current and max attendance streak.
 *
 * Algorithm:
 *   1. Filter to past meetings only (meetingDate <= now).
 *   2. Sort ascending by date.
 *   3. currentStreak: walk backwards from the most recent;
 *      count consecutive hasJoined=true until a miss or the start.
 *      If the most recent past meeting is missed → currentStreak = 0.
 *   4. maxStreak: scan all past meetings for the longest consecutive run
 *      of hasJoined=true.
 *
 * Pure function — no side effects, deterministic for a given `now`.
 *
 * @param meetings - Unsorted array of meeting records (may include future meetings)
 * @param now      - Reference timestamp for "past" determination. Defaults to Date.now().
 */
export function calculateStreak(
  meetings: MeetingRecord[],
  now: Date = new Date()
): StreakResult {
  // 1. Filter past-only and sort ascending
  const past = meetings
    .filter((m) => m.meetingDate <= now)
    .sort((a, b) => a.meetingDate.getTime() - b.meetingDate.getTime());

  if (past.length === 0) {
    return { currentStreak: 0, maxStreak: 0, lastJoinedDate: null };
  }

  // 2. currentStreak — walk backwards
  let currentStreak = 0;
  for (let i = past.length - 1; i >= 0; i--) {
    if (past[i].hasJoined) {
      currentStreak++;
    } else {
      // A missed class breaks the streak immediately
      break;
    }
  }

  // 3. maxStreak — full forward scan
  let maxStreak = 0;
  let runningMax = 0;
  for (const m of past) {
    if (m.hasJoined) {
      runningMax++;
      if (runningMax > maxStreak) maxStreak = runningMax;
    } else {
      runningMax = 0;
    }
  }

  // 4. lastJoinedDate — most recent attended meeting
  let lastJoinedDate: Date | null = null;
  for (let i = past.length - 1; i >= 0; i--) {
    if (past[i].hasJoined) {
      lastJoinedDate = past[i].meetingDate;
      break;
    }
  }

  return { currentStreak, maxStreak, lastJoinedDate };
}
