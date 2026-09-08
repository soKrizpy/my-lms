'use client';

// components/quest-map/GamificationHeader.tsx
// Gamification stats header for the Quest Map.
// Shows: XP (animated), Streak badge, Level ring, completed lessons count.
// Uses existing CSS variables so it adapts to light/dark mode automatically.

import React from 'react';
import { MagicalCounter } from '@/components/MagicalCounter';

interface GamificationHeaderProps {
  studentName: string;
  xpTotal: number;
  streak: number;
  maxStreak: number;
  completedTopics: number;
}

function calcLevel(xp: number): { level: number; xpInLevel: number; xpToNext: number } {
  const XP_PER_LEVEL = 100;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLevel;
  return { level, xpInLevel, xpToNext };
}

export function GamificationHeader({
  studentName,
  xpTotal,
  streak,
  maxStreak,
  completedTopics,
}: GamificationHeaderProps) {
  const { level, xpInLevel, xpToNext } = calcLevel(xpTotal);
  const progressPercent = Math.round((xpInLevel / 100) * 100);

  return (
    <div
      className="rounded-2xl border overflow-hidden mb-2"
      style={{
        background: 'var(--glass-bg)',
        borderColor: 'var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
      }}
    >
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'var(--glass-border)', background: 'rgba(0,0,0,0.15)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🗺️</span>
          <h2
            className="font-extrabold text-sm uppercase tracking-widest"
            style={{ color: 'var(--accent)' }}
          >
            Quest Map
          </h2>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold"
          style={{
            background: 'rgba(0,0,0,0.2)',
            borderColor: 'var(--glass-border)',
            color: 'var(--text-secondary)',
          }}
        >
          <span aria-hidden="true">👤</span>
          <span>{studentName}</span>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 divide-x divide-white/10"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        {/* XP */}
        <div className="flex flex-col items-center justify-center px-2 py-4 gap-1">
          <span className="text-lg leading-none" aria-hidden="true">⭐</span>
          <span style={{ color: 'var(--accent)' }}>
            <MagicalCounter
              value={xpTotal}
              suffix=" XP"
              className="text-base font-extrabold tabular-nums"
            />
          </span>
          <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Total XP
          </span>
        </div>

        {/* Streak */}
        <div className="flex flex-col items-center justify-center px-2 py-4 gap-1">
          <span
            className="text-lg leading-none"
            aria-hidden="true"
            style={{ filter: streak > 0 ? 'drop-shadow(0 0 6px #f97316)' : 'none' }}
          >
            🔥
          </span>
          <span
            className="text-base font-extrabold tabular-nums"
            style={{ color: streak > 0 ? '#f97316' : 'var(--text-muted)' }}
          >
            {streak}
          </span>
          <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Streak
          </span>
          {maxStreak > 0 && (
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
              best: {maxStreak}
            </span>
          )}
        </div>

        {/* Level */}
        <div className="flex flex-col items-center justify-center px-2 py-4 gap-1">
          {/* Circular level ring */}
          <div className="relative w-9 h-9">
            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="rgba(128,128,128,0.2)"
                strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeDasharray={`${(progressPercent / 100) * 94.2} 94.2`}
                strokeLinecap="round"
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-xs font-extrabold"
              style={{ color: 'var(--accent)' }}
            >
              {level}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Level
          </span>
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            {xpToNext} XP lagi
          </span>
        </div>

        {/* Lessons Done */}
        <div className="flex flex-col items-center justify-center px-2 py-4 gap-1">
          <span className="text-lg leading-none" aria-hidden="true">🏆</span>
          <span
            className="text-base font-extrabold tabular-nums"
            style={{ color: 'var(--text-primary)' }}
          >
            {completedTopics}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-center" style={{ color: 'var(--text-muted)' }}>
            Lesson<br />Selesai
          </span>
        </div>
      </div>

      {/* ── Level XP progress bar ───────────────────────────────────────── */}
      <div
        className="px-5 py-2 border-t"
        style={{ borderColor: 'var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}
      >
        <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
          <span>Level {level}</span>
          <span>{xpInLevel}/100 XP</span>
          <span>Level {level + 1}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(128,128,128,0.2)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPercent}%`,
              background: 'var(--accent)',
              boxShadow: '0 0 6px var(--accent-glow)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
