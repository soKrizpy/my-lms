'use client';

// components/quest-map/AssessmentNode.tsx
// End-of-module "Tryout" node appended after all topic nodes in the Quest Map.
// Visual states mirror TopicNode styling for visual consistency.

import React, { memo } from 'react';
import { AssessmentState, AttemptScore } from '../../lib/lmsData';
import { getAssessmentActionLabel, formatAttemptLabel } from '../../lib/assessmentHelpers';

interface AssessmentNodeProps {
  assessmentState: AssessmentState;
  onOpen: () => void;
}

function AssessmentNodeInner({ assessmentState, onOpen }: AssessmentNodeProps) {
  // no_assessment → render nothing
  if (assessmentState.status === 'no_assessment') {
    return null;
  }

  const { status } = assessmentState;

  // ── Locked state ─────────────────────────────────────────────────────────
  if (status === 'locked') {
    return (
      <div className="flex flex-col items-center gap-1.5">
        {/* Node button — non-interactive */}
        <div
          role="img"
          aria-label="Tryout — terkunci"
          className={[
            'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl',
            'bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/80',
            'opacity-70 text-slate-400 dark:text-slate-500',
          ].join(' ')}
        >
          🏆
        </div>

        {/* Title */}
        <p className="text-center text-[11px] font-semibold leading-tight max-w-[84px] text-slate-500 dark:text-slate-400">
          Tryout
        </p>

        {/* Locked pill */}
        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/15">
          🔒 Terkunci
        </span>
      </div>
    );
  }

  // ── Available — 0 attempts ────────────────────────────────────────────────
  if (status === 'available' && assessmentState.attempt_count === 0) {
    const label = getAssessmentActionLabel(0);
    const attemptChip = formatAttemptLabel(0);

    return (
      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Tryout — ${label}`}
          className={[
            'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl',
            'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'focus-visible:ring-[color:var(--accent)] cursor-pointer hover:scale-105',
            'bg-sky-50 dark:bg-sky-950/30 border-2 border-sky-500 dark:border-sky-400',
            'hover:border-sky-600 dark:hover:border-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.25)]',
          ].join(' ')}
        >
          🏆
        </button>

        {/* Title */}
        <p className="text-center text-[11px] font-bold leading-tight max-w-[84px] text-slate-900 dark:text-white">
          Tryout
        </p>

        {/* Action button */}
        <button
          type="button"
          onClick={onOpen}
          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white shadow-sm cursor-pointer"
        >
          {label}
        </button>

        {/* Attempt progress chip */}
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-sky-300 dark:border-sky-500/60 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300">
          {attemptChip}
        </span>
      </div>
    );
  }

  // ── Available — 1 attempt ─────────────────────────────────────────────────
  if (status === 'available' && assessmentState.attempt_count === 1) {
    const label = getAssessmentActionLabel(1);
    const attemptChip = formatAttemptLabel(1);

    return (
      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Tryout — ${label}`}
          className={[
            'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl',
            'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'focus-visible:ring-[color:var(--accent)] cursor-pointer hover:scale-105',
            'bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500 dark:border-amber-400',
            'hover:border-amber-600 dark:hover:border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
          ].join(' ')}
        >
          🏆
        </button>

        {/* Title */}
        <p className="text-center text-[11px] font-bold leading-tight max-w-[84px] text-slate-900 dark:text-white">
          Tryout
        </p>

        {/* Action button */}
        <button
          type="button"
          onClick={onOpen}
          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-300 text-white shadow-sm cursor-pointer"
        >
          {label}
        </button>

        {/* Attempt progress chip */}
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
          {attemptChip}
        </span>
      </div>
    );
  }

  // ── Exhausted — 2 attempts used ───────────────────────────────────────────
  if (status === 'exhausted') {
    const { best_score, attempt_scores } = assessmentState;

    return (
      <div className="flex flex-col items-center gap-1.5">
        <div
          role="img"
          aria-label="Tryout — selesai"
          className={[
            'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl',
            'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-600 dark:border-emerald-400',
            'shadow-[0_0_12px_rgba(16,185,129,0.25)]',
          ].join(' ')}
        >
          🏆
        </div>

        {/* Title */}
        <p className="text-center text-[11px] font-bold leading-tight max-w-[84px] text-slate-900 dark:text-white">
          Tryout
        </p>

        {/* Best score badge */}
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-600/50 whitespace-nowrap">
          Nilai Terbaik: {best_score}
        </span>

        {/* Individual attempt scores */}
        <div className="flex flex-col items-center gap-0.5">
          {attempt_scores.map((attempt: AttemptScore) => (
            <span
              key={attempt.attempt_number}
              className="text-[9px] font-semibold text-slate-500 dark:text-slate-400"
            >
              Percobaan {attempt.attempt_number}: {attempt.score}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Fallback — should never be reached given exhaustive status checks above
  return null;
}

export const AssessmentNode = memo(AssessmentNodeInner);
