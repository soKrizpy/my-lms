'use client';

// components/quest-map/QuestMap.tsx
// Main Quest Map component — assembles GamificationHeader + ModulePathSections.
// Replaces the LearningPath accordion in the student dashboard "learning" tab.

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { GamificationHeader } from './GamificationHeader';
import { ModulePathSection } from './ModulePathSection';
import { CustomizeHeroModal } from '@/components/avatar/CustomizeHeroModal';
import { TopicLearningFlowModal } from './TopicLearningFlowModal';
import { TopicLockModal } from './TopicLockModal';
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
  onGoToSchedule?: () => void;
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
  onRefresh,
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
  onGoToSchedule,
}: QuestMapProps) {
  const prevCompletedRef = useRef(completedEngineTopics);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // Dynamic Modals State
  const [selectedUnlockedTopic, setSelectedUnlockedTopic] = useState<{
    topic: TopicNodeTopic;
    moduleTitle: string;
    nodeIndex: number;
  } | null>(null);

  const [selectedLockedTopic, setSelectedLockedTopic] = useState<{
    topic: TopicNodeTopic;
    moduleTitle: string;
    nodeIndex: number;
  } | null>(null);

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

  const handleSelectTopic = useCallback(
    (topic: TopicNodeTopic, moduleTitle: string, nodeIndex: number) => {
      if (topic.isUnlocked) {
        setSelectedUnlockedTopic({ topic, moduleTitle, nodeIndex });
      } else {
        setSelectedLockedTopic({ topic, moduleTitle, nodeIndex });
      }
    },
    []
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

  // All modules locked indicator
  const allLocked = modules.every((m) => m.isModuleLocked);

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

      {/* All Locked Guidance Banner */}
      {allLocked && (
        <div
          className="rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in"
          style={{ background: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.3)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl flex-shrink-0" aria-hidden="true">🔒</span>
            <div>
              <p className="font-bold text-xs sm:text-sm text-white">
                Ikuti kelas belajarmu untuk membuka materi
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Klik "Bergabung Sekarang" di tab Jadwal Belajar saat kelas berlangsung untuk mulai membuka materi!
              </p>
            </div>
          </div>
          {onGoToSchedule && (
            <button
              type="button"
              onClick={onGoToSchedule}
              className="py-2 px-3.5 rounded-xl bg-brand-primary text-white text-xs font-bold whitespace-nowrap hover:brightness-110 active:scale-95 transition-all shadow-md shadow-brand-primary/20 flex-shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Buka Jadwal ➔
            </button>
          )}
        </div>
      )}

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
            onSelectTopic={handleSelectTopic}
          />
        ))}
      </div>

      {/* ── Duolingo / Mimo Style Learning Flow Modal ──────────────────────── */}
      <TopicLearningFlowModal
        isOpen={Boolean(selectedUnlockedTopic)}
        onClose={() => setSelectedUnlockedTopic(null)}
        topic={selectedUnlockedTopic?.topic ?? null}
        moduleTitle={selectedUnlockedTopic?.moduleTitle}
        nodeIndex={selectedUnlockedTopic?.nodeIndex}
        topicProgress={topicProgress}
        quizAttempts={quizAttempts}
        onQuizCompleted={onRefresh}
      />

      {/* ── Locked Topic Preview Modal ─────────────────────────────────────── */}
      <TopicLockModal
        isOpen={Boolean(selectedLockedTopic)}
        onClose={() => setSelectedLockedTopic(null)}
        topic={selectedLockedTopic?.topic ?? null}
        moduleTitle={selectedLockedTopic?.moduleTitle}
        nodeIndex={selectedLockedTopic?.nodeIndex}
        onGoToSchedule={onGoToSchedule}
      />
    </div>
  );
}

export const QuestMap = memo(QuestMapInner);
