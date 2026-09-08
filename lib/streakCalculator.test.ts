// lib/streakCalculator.test.ts
// Vitest unit tests for calculateStreak().
// Tests cover all documented edge cases.

import { describe, it, expect } from 'vitest';
import { calculateStreak, type MeetingRecord } from './streakCalculator';

// Helper: create a MeetingRecord relative to a fixed reference time
const REF = new Date('2026-09-08T12:00:00Z'); // "now" in tests

function daysAgo(days: number): Date {
  return new Date(REF.getTime() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(REF.getTime() + days * 24 * 60 * 60 * 1000);
}

function met(daysAgoN: number, joined: boolean): MeetingRecord {
  return { meetingDate: daysAgo(daysAgoN), hasJoined: joined };
}

describe('calculateStreak', () => {
  // ── Zero / empty cases ───────────────────────────────────────────────────

  it('returns zeros when meetings array is empty', () => {
    expect(calculateStreak([], REF)).toEqual({
      currentStreak: 0,
      maxStreak: 0,
      lastJoinedDate: null,
    });
  });

  it('returns zeros when all meetings are in the future', () => {
    const meetings: MeetingRecord[] = [
      { meetingDate: daysFromNow(1), hasJoined: false },
      { meetingDate: daysFromNow(7), hasJoined: false },
    ];
    expect(calculateStreak(meetings, REF)).toEqual({
      currentStreak: 0,
      maxStreak: 0,
      lastJoinedDate: null,
    });
  });

  it('returns zeros for a single missed past meeting', () => {
    const result = calculateStreak([met(1, false)], REF);
    expect(result.currentStreak).toBe(0);
    expect(result.maxStreak).toBe(0);
    expect(result.lastJoinedDate).toBeNull();
  });

  // ── Single meeting ───────────────────────────────────────────────────────

  it('returns streak=1 for a single attended past meeting', () => {
    const date = daysAgo(1);
    const result = calculateStreak(
      [{ meetingDate: date, hasJoined: true }],
      REF
    );
    expect(result.currentStreak).toBe(1);
    expect(result.maxStreak).toBe(1);
    expect(result.lastJoinedDate).toEqual(date);
  });

  // ── All joined ───────────────────────────────────────────────────────────

  it('returns streak = total count when all meetings attended', () => {
    const meetings = [met(6, true), met(5, true), met(4, true), met(3, true), met(2, true), met(1, true)];
    const result = calculateStreak(meetings, REF);
    expect(result.currentStreak).toBe(6);
    expect(result.maxStreak).toBe(6);
  });

  // ── Last meeting missed ──────────────────────────────────────────────────

  it('returns currentStreak=0 when most recent past meeting is missed', () => {
    // 3 attended, then the last (most recent) is missed
    const meetings = [met(4, true), met(3, true), met(2, true), met(1, false)];
    const result = calculateStreak(meetings, REF);
    expect(result.currentStreak).toBe(0);
    expect(result.maxStreak).toBe(3);
  });

  // ── Miss in the middle ───────────────────────────────────────────────────

  it('counts only from last miss backwards for currentStreak', () => {
    // Pattern: J J J M J J  (J=joined, M=missed), most recent is rightmost
    const meetings = [
      met(6, true),
      met(5, true),
      met(4, true),
      met(3, false), // miss
      met(2, true),
      met(1, true),
    ];
    const result = calculateStreak(meetings, REF);
    // currentStreak = 2 (only the 2 after the miss count)
    expect(result.currentStreak).toBe(2);
    // maxStreak = 3 (the run before the miss)
    expect(result.maxStreak).toBe(3);
  });

  // ── Multiple misses ──────────────────────────────────────────────────────

  it('handles alternating join/miss correctly', () => {
    // J M J M J M J
    const meetings = [
      met(7, true),
      met(6, false),
      met(5, true),
      met(4, false),
      met(3, true),
      met(2, false),
      met(1, true),
    ];
    const result = calculateStreak(meetings, REF);
    expect(result.currentStreak).toBe(1);
    expect(result.maxStreak).toBe(1);
  });

  // ── maxStreak is the longest historical run ──────────────────────────────

  it('picks the longest run for maxStreak even if current is lower', () => {
    // 5 consecutive, then miss, then 2 consecutive
    const meetings = [
      met(9, true),
      met(8, true),
      met(7, true),
      met(6, true),
      met(5, true),
      met(4, false),
      met(3, true),
      met(2, true),
      met(1, false), // most recent is missed → current=0
    ];
    const result = calculateStreak(meetings, REF);
    expect(result.currentStreak).toBe(0);
    expect(result.maxStreak).toBe(5);
  });

  // ── Future meetings are ignored ──────────────────────────────────────────

  it('ignores future meetings when calculating streak', () => {
    const meetings: MeetingRecord[] = [
      met(2, true),
      met(1, true),
      { meetingDate: daysFromNow(3), hasJoined: false }, // future: ignored
      { meetingDate: daysFromNow(7), hasJoined: true },  // future: ignored
    ];
    const result = calculateStreak(meetings, REF);
    expect(result.currentStreak).toBe(2);
    expect(result.maxStreak).toBe(2);
  });

  // ── Unsorted input ───────────────────────────────────────────────────────

  it('handles unsorted input correctly', () => {
    // Input is in random order; result should be same as sorted
    const meetings = [met(1, true), met(4, true), met(2, false), met(3, true)];
    const result = calculateStreak(meetings, REF);
    // Sorted: [4=J, 3=J, 2=M, 1=J] → currentStreak=1, maxStreak=2
    expect(result.currentStreak).toBe(1);
    expect(result.maxStreak).toBe(2);
  });

  // ── lastJoinedDate ───────────────────────────────────────────────────────

  it('returns the most recent attended date as lastJoinedDate', () => {
    const meetings = [met(3, true), met(2, false), met(1, true)];
    const result = calculateStreak(meetings, REF);
    expect(result.lastJoinedDate).toEqual(daysAgo(1));
  });

  it('returns null for lastJoinedDate if never attended', () => {
    const meetings = [met(3, false), met(2, false), met(1, false)];
    const result = calculateStreak(meetings, REF);
    expect(result.lastJoinedDate).toBeNull();
  });

  // ── Single all-missed ────────────────────────────────────────────────────

  it('returns all zeros with all misses', () => {
    const meetings = [met(4, false), met(3, false), met(2, false), met(1, false)];
    const result = calculateStreak(meetings, REF);
    expect(result.currentStreak).toBe(0);
    expect(result.maxStreak).toBe(0);
    expect(result.lastJoinedDate).toBeNull();
  });
});
