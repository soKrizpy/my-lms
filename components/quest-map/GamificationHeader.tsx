'use client';

// components/quest-map/GamificationHeader.tsx
// Gamification stats header for the Quest Map.
// Shows: XP (animated), Streak badge, Level ring, completed lessons count.
// Uses existing CSS variables so it adapts to light/dark mode automatically.

import React from 'react';
import { MagicalCounter } from '@/components/MagicalCounter';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';
import { getTitleById } from '@/lib/gamification/catalog';

interface GamificationHeaderProps {
  studentName: string;
  avatarId?: string | null;
  titleId?: string | null;
  xpTotal: number;
  streak: number;
  maxStreak: number;
  completedTopics: number;
  onOpenCustomize?: () => void;
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
  avatarId,
  titleId,
  xpTotal,
  streak,
  maxStreak,
  completedTopics,
  onOpenCustomize,
}: GamificationHeaderProps) {
  const { level, xpInLevel, xpToNext } = calcLevel(xpTotal);
  const progressPercent = Math.round((xpInLevel / 100) * 100);
  const title = getTitleById(titleId || 'novice-coder');

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
        className="flex items-center justify-between px-5 py-3 border-b flex-wrap gap-2 bg-slate-50/75 dark:bg-slate-900/50"
        style={{ borderColor: 'var(--glass-border)' }}
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

        {/* Clickable Hero Identity Pill */}
        <button
          type="button"
          onClick={onOpenCustomize}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/90 dark:border-purple-500/40 bg-white/90 dark:bg-slate-900/70 text-xs font-semibold transition-all hover:scale-105 active:scale-95 group text-left shadow-sm dark:shadow-none cursor-pointer"
          title="Klik untuk kustomisasi avatar dan gelarmu!"
        >
          <AvatarDisplay avatarId={avatarId} size="xs" showAura={false} />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>{studentName}</span>
              <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 dark:text-purple-400">
                ✏️
              </span>
            </span>
            <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold mt-0.5">
              {title.name}
            </span>
          </div>
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-4 divide-x divide-slate-200/80 dark:divide-white/10"
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
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700/60"
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
        className="px-5 py-2 border-t bg-slate-50/60 dark:bg-slate-900/40"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
          <span className="font-medium">Level {level}</span>
          <span className="font-semibold">{xpInLevel}/100 XP</span>
          <span className="font-medium">Level {level + 1}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700/60">
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
