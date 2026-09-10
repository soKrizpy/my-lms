'use client';

// components/quest-map/ModulePathSection.tsx
// Renders one module as a "chapter" with a winding path of TopicNodes.
// Desktop: 3-column zigzag layout (matching gamifikasi3.html style).
// Mobile: single vertical column.

import React, { memo } from 'react';
import { TopicNode, type TopicNodeTopic, type TopicProgress, type QuizAttempt } from './TopicNode';
import { AssessmentNode } from './AssessmentNode';
import { type AssessmentState } from '../../lib/lmsData';

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

interface ModulePathSectionProps {
  module: Module;
  topicProgress: TopicProgress[];
  quizAttempts: QuizAttempt[];
  onStartLesson?: (engineTopicId: string) => void;
  onOpenQuiz?: (quiz: { id: number; title: string }) => void;
  onSelectTopic?: (topic: TopicNodeTopic, moduleTitle: string, nodeIndex: number) => void;
  assessmentState?: AssessmentState;
  onOpenAssessment?: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-500/50',
  intermediate: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-500/50',
  advance: 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-500/50',
  advanced: 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-500/50',
  master: 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-500/50',
};

function findFirstActiveIndex(
  topics: TopicNodeTopic[],
  topicProgress: TopicProgress[],
  quizAttempts: QuizAttempt[]
): number {
  // The first unlocked topic that is NOT yet "done"
  // "Done" = engine finished OR quiz maxed (2 attempts) OR quiz passed (score >= 70)
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    if (!topic.isUnlocked) continue;

    const engineDone =
      topic.engine_topic_id !== null &&
      topicProgress.some((tp) => tp.engine_topic_id === topic.engine_topic_id);

    const quizAttempt = topic.quiz
      ? quizAttempts.find((qa) => qa.quiz_id === topic.quiz!.id)
      : undefined;
    const attemptsUsed = quizAttempt?.attempts_count ?? (quizAttempt ? 1 : 0);
    const quizMaxed = attemptsUsed >= 2;
    const quizPassed = topic.quiz !== null &&
      quizAttempts.some((qa) => qa.quiz_id === topic.quiz!.id && qa.score >= 70);

    if (!engineDone && !quizMaxed && !quizPassed) return i;
  }
  return -1; // all completed
}

function ModulePathSectionInner({
  module,
  topicProgress,
  quizAttempts,
  onStartLesson,
  onOpenQuiz,
  onSelectTopic,
  assessmentState,
  onOpenAssessment,
}: ModulePathSectionProps) {
  const { topics, isModuleLocked, isModuleComplete } = module;
  const unlockedCount = topics.filter((t) => t.isUnlocked).length;
  const progressPercent =
    topics.length > 0 ? Math.round((unlockedCount / topics.length) * 100) : 0;
  const levelClass =
    LEVEL_COLORS[module.level?.toLowerCase()] ??
    'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-500/50';

  const activeIndex = findFirstActiveIndex(topics, topicProgress, quizAttempts);

  // Group topics into rows of 3 for the zigzag layout (desktop)
  const rows: TopicNodeTopic[][] = [];
  for (let i = 0; i < topics.length; i += 3) {
    rows.push(topics.slice(i, i + 3));
  }

  return (
    <div
      className={[
        'rounded-2xl border overflow-hidden transition-all',
        isModuleLocked ? 'opacity-55' : '',
      ].join(' ')}
      style={{
        background: 'var(--glass-bg)',
        borderColor: isModuleComplete
          ? '#10b981'
          : isModuleLocked
            ? 'rgba(128,128,128,0.25)'
            : 'var(--glass-border)',
        boxShadow: isModuleLocked ? 'none' : 'var(--glass-shadow)',
      }}
    >
      {/* ── Module header ─────────────────────────────────────────────── */}
      <div
        className="px-5 py-4 border-b bg-slate-100/70 dark:bg-black/30"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {isModuleLocked && (
              <span className="text-base" aria-hidden="true">🔒</span>
            )}
            {isModuleComplete && (
              <span className="text-base" aria-hidden="true">🏆</span>
            )}
            {!isModuleLocked && !isModuleComplete && (
              <span className="text-base" aria-hidden="true">📚</span>
            )}
            <h3
              className="font-bold text-sm truncate text-slate-900 dark:text-white"
            >
              {module.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize shadow-xs ${levelClass}`}
            >
              {module.level}
            </span>
            <span
              className={[
                'text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs',
                isModuleComplete
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-500/40'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-200 dark:border-white/15',
              ].join(' ')}
            >
              {unlockedCount}/{topics.length}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700/60">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPercent}%`,
              background: isModuleComplete ? '#10b981' : 'var(--accent)',
            }}
          />
        </div>
        {isModuleLocked && (
          <p className="text-xs mt-2 text-slate-600 dark:text-slate-300 font-medium">
            🔒 Modul ini terkunci. Ikuti kelas untuk membuka topik pembelajaran di bab ini.
          </p>
        )}
      </div>

      {/* ── Topic nodes (always rendered dynamically) ─────────────────── */}
      <div className="p-5">
        {/* ── Mobile: single column ──────────────────────────────── */}
        <div className="flex flex-col items-center gap-6 lg:hidden">
          {topics.map((topic, idx) => (
            <React.Fragment key={topic.id}>
              <TopicNode
                topic={topic}
                isCurrentActive={idx === activeIndex}
                topicProgress={topicProgress}
                quizAttempts={quizAttempts}
                onStartLesson={onStartLesson}
                onOpenQuiz={onOpenQuiz}
                onSelectTopic={(t) => onSelectTopic?.(t, module.title, idx)}
                nodeIndex={idx}
              />
              {/* Connector */}
              {idx < topics.length - 1 && (
                <div
                  className="w-0.5 h-6 rounded-full"
                  style={{
                    background: topic.isUnlocked
                      ? 'var(--accent)'
                      : 'rgba(128,128,128,0.3)',
                  }}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          ))}
          {/* Assessment node — shown after the last topic */}
          {assessmentState && assessmentState.status !== 'no_assessment' && (
            <>
              <div
                className="w-0.5 h-6 rounded-full"
                style={{ background: 'var(--accent)' }}
                aria-hidden="true"
              />
              <AssessmentNode
                assessmentState={assessmentState}
                onOpen={onOpenAssessment ?? (() => {})}
              />
            </>
          )}
        </div>

        {/* ── Desktop: zigzag 3-column ────────────────────────────── */}
        <div className="hidden lg:flex flex-col items-center gap-8">
          {rows.map((row, rowIdx) => {
            // Alternate direction: even rows go left→right, odd rows right→left
            const reversed = rowIdx % 2 === 1;
            const orderedRow = reversed ? [...row].reverse() : row;
            const startIdx = rowIdx * 3;

            return (
              <React.Fragment key={rowIdx}>
                {/* Connector from previous row */}
                {rowIdx > 0 && (
                  <div
                    className="w-0.5 h-6 rounded-full"
                    style={{ background: 'rgba(128,128,128,0.3)' }}
                    aria-hidden="true"
                  />
                )}

                {/* Node row */}
                <div className="grid grid-cols-3 gap-8 w-full max-w-sm">
                  {orderedRow.map((topic, colIdx) => {
                    // Map back to original index for active detection
                    const originalIdx = reversed
                        ? startIdx + (row.length - 1 - colIdx)
                        : startIdx + colIdx;
                    return (
                      <div key={topic.id} className="flex flex-col items-center">
                        <TopicNode
                          topic={topic}
                          isCurrentActive={originalIdx === activeIndex}
                          topicProgress={topicProgress}
                          quizAttempts={quizAttempts}
                          onStartLesson={onStartLesson}
                          onOpenQuiz={onOpenQuiz}
                          onSelectTopic={(t) => onSelectTopic?.(t, module.title, originalIdx)}
                          nodeIndex={originalIdx}
                        />
                      </div>
                    );
                  })}
                  {/* Fill empty cells in last row */}
                  {orderedRow.length < 3 &&
                    Array.from({ length: 3 - orderedRow.length }).map((_, i) => (
                      <div key={`empty-${i}`} aria-hidden="true" />
                    ))}
                </div>

                {/* Horizontal connector line between nodes */}
                {row.length > 1 && (
                  <div className="hidden" aria-hidden="true" />
                )}
              </React.Fragment>
            );
          })}
          {/* Assessment node — shown after the last row */}
          {assessmentState && assessmentState.status !== 'no_assessment' && (
            <>
              <div
                className="w-0.5 h-6 rounded-full"
                style={{ background: 'var(--accent)' }}
                aria-hidden="true"
              />
              <div className="flex justify-center">
                <AssessmentNode
                  assessmentState={assessmentState}
                  onOpen={onOpenAssessment ?? (() => {})}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const ModulePathSection = memo(ModulePathSectionInner);
