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
import { AssessmentModal } from '../assessment/AssessmentModal';
import { triggerConfetti } from '@/lib/triggerConfetti';
import type { TopicNodeTopic, TopicProgress, QuizAttempt } from './TopicNode';
import type { AssessmentSummary, AssessmentState } from '../../lib/lmsData';
import { BadgeWall } from '@/components/gamification/BadgeWall';
import type { EarnedBadgeRow, BadgeDefinition } from '@/lib/gamification/badgeCatalog';

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
  assessmentId?: number | null;
  assessmentTitle?: string | null;
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
  assessmentSummaries?: AssessmentSummary[];
  totalXP?: number;
  earnedBadges?: EarnedBadgeRow[];
  onAssessmentSuccess?: (newBadges: BadgeDefinition[]) => void;
}

// ── BadgePanel ────────────────────────────────────────────────────────────────

function BadgePanel({ badges }: { badges: Badge[] }) {
  return (
    <div
      className="rounded-xl border p-4 mb-4"
      style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
    >
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
        <span aria-hidden="true">🏅</span> Achievement Badges
      </h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            title={badge.description}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all select-none',
              badge.unlocked
                ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs dark:bg-purple-950/60 dark:border-purple-500/60 dark:text-purple-100 dark:shadow-[0_0_8px_rgba(168,85,247,0.35)]'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400',
            ].join(' ')}
          >
            <span aria-hidden="true" className={badge.unlocked ? '' : 'grayscale opacity-60'}>
              {badge.icon}
            </span>
            <span>{badge.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Assessment state builder ──────────────────────────────────────────────────

function buildAssessmentState(
  mod: Module,
  summaries: AssessmentSummary[],
): AssessmentState {
  if (!mod.assessmentId) return { status: 'no_assessment' };
  if (!mod.isModuleComplete) return { status: 'locked' };
  const summary = summaries.find((s) => s.assessment_id === mod.assessmentId);
  const attemptCount = summary?.attempt_count ?? 0;
  if (attemptCount >= 2) {
    return {
      status: 'exhausted',
      assessment_id: mod.assessmentId,
      best_score: summary?.best_score ?? 0,
      attempt_scores: [],
    };
  }
  return {
    status: 'available',
    assessment_id: mod.assessmentId,
    attempt_count: attemptCount as 0 | 1,
  };
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
  assessmentSummaries,
  totalXP,
  earnedBadges,
  onAssessmentSuccess,
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

  const [activeAssessment, setActiveAssessment] = useState<{
    assessmentId: number;
    assessmentTitle: string;
    attemptCount: 0 | 1;
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

  const studentLevel = Math.floor((totalXP ?? engineXpTotal) / 100) + 1;

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
        xpTotal={totalXP ?? engineXpTotal}
        streak={streak}
        maxStreak={maxStreak}
        completedTopics={completedEngineTopics}
        onOpenCustomize={() => setIsCustomizeOpen(true)}
      />

      {/* All Locked Guidance Banner */}
      {allLocked && (
        <div
          className="rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-500/30"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl flex-shrink-0" aria-hidden="true">🔒</span>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Ikuti kelas belajarmu untuk membuka materi
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Klik &quot;Bergabung Sekarang&quot; di tab Jadwal Belajar saat kelas berlangsung untuk mulai membuka materi!
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

      {/* Badge Wall — full catalog with earned/locked state */}
      <BadgeWall earnedBadges={earnedBadges ?? []} />

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
            assessmentState={buildAssessmentState(mod, assessmentSummaries ?? [])}
            onOpenAssessment={() => {
              if (!mod.assessmentId) return;
              const state = buildAssessmentState(mod, assessmentSummaries ?? []);
              if (state.status !== 'available') return;
              setActiveAssessment({
                assessmentId: mod.assessmentId,
                assessmentTitle: mod.assessmentTitle ?? 'Tryout',
                attemptCount: state.attempt_count,
              });
            }}
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

      {/* ── Assessment Modal ───────────────────────────────────────────────── */}
      {activeAssessment && (
        <AssessmentModal
          assessmentId={activeAssessment.assessmentId}
          assessmentTitle={activeAssessment.assessmentTitle}
          attemptCount={activeAssessment.attemptCount}
          onClose={() => setActiveAssessment(null)}
          onSuccess={(newBadges) => {
              setActiveAssessment(null);
              onAssessmentSuccess?.(newBadges);
              onRefresh();
            }}
        />
      )}
    </div>
  );
}

export const QuestMap = memo(QuestMapInner);
