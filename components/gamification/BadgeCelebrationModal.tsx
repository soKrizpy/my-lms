'use client';

import type { BadgeDefinition } from '@/lib/gamification/badgeCatalog';
import { triggerConfetti } from '@/lib/triggerConfetti';
import { useEffect, useRef } from 'react';

interface BadgeCelebrationModalProps {
  queue: BadgeDefinition[];   // parent-managed; queue[0] is the active badge
  onDismiss: () => void;      // parent pops queue[0]
}

const RARITY_COLOR: Record<string, string> = {
  common: 'text-sky-400',
  rare: 'text-violet-500',
  epic: 'text-amber-400',
};

const RARITY_LABEL: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
};

export function BadgeCelebrationModal({ queue, onDismiss }: BadgeCelebrationModalProps) {
  const dismissBtnRef = useRef<HTMLButtonElement>(null);

  const activeBadge = queue[0];

  // Fire confetti whenever the active badge changes (new badge shown)
  useEffect(() => {
    if (!activeBadge) return;
    void triggerConfetti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBadge?.id]);

  // Focus the dismiss button on open for accessibility / focus trap
  useEffect(() => {
    if (!activeBadge) return;
    dismissBtnRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBadge?.id]);

  if (!activeBadge) return null;

  const rarityColor = RARITY_COLOR[activeBadge.rarity] ?? 'text-sky-400';
  const rarityLabel = RARITY_LABEL[activeBadge.rarity] ?? activeBadge.rarity;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onDismiss}
      aria-hidden="true"
    >
      {/* Modal card — stop click propagation so clicking the card doesn't dismiss */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-celebration-title"
        className="relative mx-4 w-full max-w-sm rounded-2xl border border-[var(--glass-border,#2d3748)] bg-[#181c24] p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge icon */}
        <div className="mb-4 text-7xl leading-none" role="img" aria-label={activeBadge.name}>
          {activeBadge.icon}
        </div>

        {/* Headline */}
        <p className="mb-1 text-sm font-medium tracking-wide text-white/60">
          Kamu baru mendapatkan badge ini!
        </p>

        {/* Badge name */}
        <h2
          id="badge-celebration-title"
          className="mb-2 text-2xl font-bold text-white"
        >
          {activeBadge.name}
        </h2>

        {/* Rarity label */}
        <p className={`mb-3 text-sm font-semibold uppercase tracking-widest ${rarityColor}`}>
          {rarityLabel}
        </p>

        {/* Description */}
        <p className="mb-8 text-sm leading-relaxed text-white/70">
          {activeBadge.description}
        </p>

        {/* Dismiss button */}
        <button
          ref={dismissBtnRef}
          onClick={onDismiss}
          className="w-full rounded-xl bg-brand-primary px-6 py-3 text-base font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-[#181c24]"
        >
          Keren! 🎉
        </button>
      </div>
    </div>
  );
}
