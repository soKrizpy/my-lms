'use client';

import { useState } from 'react';
import type { EarnedBadgeRow } from '@/lib/gamification/badgeCatalog';
import { BADGE_CATALOG } from '@/lib/gamification/badgeCatalog';

interface BadgeWallProps {
  earnedBadges: EarnedBadgeRow[];
}

const rarityStyles = {
  common: {
    text: 'text-sky-400',
    pill: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
    label: 'Common',
  },
  rare: {
    text: 'text-violet-500',
    pill: 'text-violet-500 border-violet-500/30 bg-violet-500/10',
    label: 'Rare',
  },
  epic: {
    text: 'text-amber-400',
    pill: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    label: 'Epic',
  },
};

export function BadgeWall({ earnedBadges }: BadgeWallProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: 'var(--glass-bg)',
        borderColor: 'var(--glass-border)',
      }}
    >
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-white">🏅 Badge Wall</span>
        <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Collapsible Grid */}
      {isOpen && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {BADGE_CATALOG.map((badge) => {
            const earnedEntry = earnedBadges.find((e) => e.badge_id === badge.id);
            const isEarned = Boolean(earnedEntry);
            const rarity = rarityStyles[badge.rarity];

            return (
              <div
                key={badge.id}
                className={`relative rounded-xl border p-3 flex flex-col gap-1 transition-all${
                  isEarned ? '' : ' opacity-50 grayscale'
                }`}
                style={{
                  background: 'var(--glass-bg)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                {/* Lock overlay for locked badges */}
                {!isEarned && (
                  <span
                    className="absolute right-2 top-2 text-xs"
                    aria-hidden="true"
                  >
                    🔒
                  </span>
                )}

                {/* Icon */}
                <span className="text-3xl leading-none" aria-hidden="true">
                  {badge.icon}
                </span>

                {/* Name */}
                <p className="font-bold text-sm text-white leading-tight">
                  {badge.name}
                </p>

                {/* Rarity pill */}
                <span
                  className={`inline-block w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium ${rarity.pill}`}
                >
                  {rarity.label}
                </span>

                {/* Description */}
                <p className="text-xs text-gray-400 leading-snug">
                  {badge.description}
                </p>

                {/* Earned date (only for earned badges) */}
                {isEarned && earnedEntry && (
                  <p className={`text-xs font-medium mt-auto pt-1 ${rarity.text}`}>
                    {new Date(earnedEntry.earned_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
