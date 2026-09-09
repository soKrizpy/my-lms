'use client';

// components/quest-map/QuestMap.tsx
// Main Quest Map component — assembles GamificationHeader + ModulePathSections.
// Replaces the LearningPath accordion in the student dashboard "learning" tab.

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { GamificationHeader } from './GamificationHeader';
import { ModulePathSection } from './ModulePathSection';
import { CustomizeHeroModal } from '@/components/avatar/CustomizeHeroModal';
import type { TopicNodeTopic, TopicProgress, QuizAttempt } from './TopicNode';

// ── Badge definitions ─────────────────────────────────────────────────────────

interface Badge {
  id: string;
  icon: string;
  label: string;
  description: string;
  unlocked: boolean;
}

function computeBadges(
  completedTopics: number,
  streak: number,
  maxStreak: number,
  quizAttempts: QuizAttempt[]
): Badge[] {
  const hasHighQuiz = quizAttempts.some((qa) => qa.score >= 90);

  return [
    {
      id: 'first-step',
      icon: '🌱',
      label: 'First Step',
      description: 'Selesaikan lesson pertama',
      unlocked: completedTopics >= 1,
    },
    {
      id: 'on-fire',
      icon: '🔥',
      label: 'On Fire',
      description: 'Raih streak kehadiran 3×',
      unlocked: streak >= 3,
    },
    {
      id: 'engine-starter',
      icon: '⚡',
      label: 'Engine Starter',
      description: 'Selesaikan 1 lesson engine',
      unlocked: completedTopics >= 1,
    },
    {
      id: 'quiz-master',
      icon: '🧠',
      label: 'Quiz Master',
      description: 'Raih skor quiz ≥ 90',
      unlocked: hasHighQuiz,
    },
    {
      id: 'consistent',
      icon: '💪',
      label: 'Consistent',
      description: 'Raih streak terbaik 5×',
      unlocked: maxStreak >= 5,
    },
  ];
}

// ── Module type (matches dashboard response) ──────────────────────────────────

interface Module {
  id: number;
  title: string;
  description?: string | null;
  level: string;
  topics: TopicNodeTopic[];
  isModuleLocked: boolean;
  isModuleActive: boolean;
  isModuleComplete: boolean;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface QuestMapProps {
  modules: Module[];
  quizAttempts: QuizAttempt[];
  topicProgress: TopicProgress[];
  onStartLesson?: (engineTopicId: string) => void;
  onRefresh: () => void;
  studentName: string;
  avatarId?: string | null;
  titleId?: string | null;
  bestQuizScore?: number;
  engineXpTotal: number;
  streak: number;
  maxStreak: number;
  completedEngineTopics: number;
  onOpenQuiz?: (quiz: { id: number; title: string }) => void;
  onUpdateProfile?: (avatarId: string, titleId: string) => Promise<boolean> | void;
}

// ── Confetti using animejs ────────────────────────────────────────────────────

async function triggerConfetti(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const { animate, stagger, utils } = await import('animejs');
    const container = document.getElementById('quest-map-confetti');
    if (!container) return;

    // Create 30 confetti dots
    const colors = ['#a3e635', '#38bdf8', '#f97316', '#c084fc', '#ef4444', '#fbbf24'];
    const dots = Array.from({ length: 30 }, () => {
      const el = document.createElement('div');
      el.style.cssText = [
        'position:fixed',
        `left:${utils.random(10, 90)}vw`,
        'top:-20px',
        'width:8px',
        'height:8px',
        `border-radius:${utils.random(0, 50)}%`,
        `background:${colors[utils.random(0, colors.length - 1)]}`,
        'pointer-events:none',
        'z-index:9999',
      ].join(';');
      document.body.appendChild(el);
      return el;
    });

    animate(dots, {
      translateY: ['0vh', '110vh'],
      rotate: () => utils.random(-360, 360),
      opacity: [1, 0],
      duration: 1800,
      delay: stagger(60),
      ease: 'outQuad',
      onComplete: () => dots.forEach((d) => d.remove()),
    });
  } catch {
    // animejs unavailable — silently skip
  }
}

// ── BadgePanel ────────────────────────────────────────────────────────────────

function BadgePanel({ badges }: { badges: Badge[] }) {
  return (
    <div
      className="rounded-xl border p-4 mb-4"
      style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
    >
      <h3
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        🏅 Achievement Badges
      </h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            title={badge.description}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all',
              badge.unlocked ? '' : 'opacity-35 grayscale',
            ].join(' ')}
            style={{
              background: badge.unlocked
                ? 'rgba(var(--accent-rgb, 168,85,247), 0.15)'
                : 'rgba(128,128,128,0.1)',
              borderColor: badge.unlocked ? 'var(--accent)' : 'rgba(128,128,128,0.3)',
              color: badge.unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: badge.unlocked ? '0 0 8px var(--accent-glow)' : 'none',
            }}
          >
            <span aria-hidden="true">{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── QuestMap ──────────────────────────────────────────────────────────────────

function QuestMapInner({
  modules,
  quizAttempts,
  topicProgress,
  onStartLesson,
  studentName,
  avatarId,
  titleId,
  bestQuizScore,
  engineXpTotal,
  streak,
  maxStreak,
  completedEngineTopics,
  onOpenQuiz,
  onUpdateProfile,
}: QuestMapProps) {
  const prevCompletedRef = useRef(completedEngineTopics);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // Trigger confetti when a new topic is completed
  useEffect(() => {
    if (completedEngineTopics > prevCompletedRef.current) {
      void triggerConfetti();
    }
    prevCompletedRef.current = completedEngineTopics;
  }, [completedEngineTopics]);

  const badges = computeBadges(completedEngineTopics, streak, maxStreak, quizAttempts);

  const handleStartLesson = useCallback(
    (engineTopicId: string) => onStartLesson?.(engineTopicId),
    [onStartLesson]
  );

  const handleOpenQuiz = useCallback(
    (quiz: { id: number; title: string }) => onOpenQuiz?.(quiz),
    [onOpenQuiz]
  );

  const studentLevel = Math.floor(engineXpTotal / 100) + 1;

  // Empty state
  if (modules.length === 0) {
    return (
      <div
        className="rounded-2xl border p-10 text-center"
        style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
      >
        <p className="text-3xl mb-3" aria-hidden="true">🗺️</p>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          Belum ada modul
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Modul pembelajaran akan muncul di sini setelah di-assign oleh teacher.
        </p>
      </div>
    );
  }

  // All modules locked
  const allLocked = modules.every((m) => m.isModuleLocked);
  if (allLocked) {
    return (
      <div
        className="rounded-2xl border p-10 text-center"
        style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
      >
        <p className="text-3xl mb-3" aria-hidden="true">🔒</p>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          Ikuti kelas untuk membuka materi
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Bergabung ke kelas pertamamu untuk mulai belajar!
        </p>
      </div>
    );
  }

  return (
    <div id="quest-map-root" className="space-y-4">
      {/* Hidden anchor for confetti container */}
      <div id="quest-map-confetti" aria-hidden="true" />

      {/* Gamification header */}
      <GamificationHeader
        studentName={studentName}
        avatarId={avatarId}
        titleId={titleId}
        xpTotal={engineXpTotal}
        streak={streak}
        maxStreak={maxStreak}
        completedTopics={completedEngineTopics}
        onOpenCustomize={() => setIsCustomizeOpen(true)}
      />

      {/* Hero Customization Modal */}
      <CustomizeHeroModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        studentName={studentName}
        currentAvatarId={avatarId || 'pixel-bot'}
        currentTitleId={titleId || 'novice-coder'}
        stats={{
          level: studentLevel,
          xp: engineXpTotal,
          streak,
          maxStreak,
          bestQuizScore: bestQuizScore ?? 0,
        }}
        onSaveProfile={async (newAvatarId, newTitleId) => {
          if (onUpdateProfile) {
            await onUpdateProfile(newAvatarId, newTitleId);
          }
        }}
      />

      {/* Achievement badges */}
      <BadgePanel badges={badges} />

      {/* Module path sections */}
      <div className="space-y-4">
        {modules.map((mod) => (
          <ModulePathSection
            key={mod.id}
            module={mod}
            topicProgress={topicProgress}
            quizAttempts={quizAttempts}
            onStartLesson={handleStartLesson}
            onOpenQuiz={handleOpenQuiz}
          />
        ))}
      </div>
    </div>
  );
}

export const QuestMap = memo(QuestMapInner);
