'use client';

// components/quest-map/ModulePathSection.tsx
// Renders one module as a "chapter" with a winding path of TopicNodes.
// Desktop: 3-column zigzag layout (matching gamifikasi3.html style).
// Mobile: single vertical column.

import React, { memo } from 'react';
import { TopicNode, type TopicNodeTopic, type TopicProgress, type QuizAttempt } from './TopicNode';

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
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 ring-green-600/20',
  intermediate: 'bg-orange-100 text-orange-700 ring-orange-600/20',
  advance: 'bg-red-100 text-red-700 ring-red-600/20',
  advanced: 'bg-red-100 text-red-700 ring-red-600/20',
  master: 'bg-purple-100 text-purple-700 ring-purple-600/20',
};

function findFirstActiveIndex(
  topics: TopicNodeTopic[],
  topicProgress: TopicProgress[],
  quizAttempts: QuizAttempt[]
): number {
  // The first unlocked topic that is NOT yet completed
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    if (!topic.isUnlocked) continue;

    const engineDone =
      topic.engine_topic_id !== null &&
      topicProgress.some((tp) => tp.engine_topic_id === topic.engine_topic_id);
    const quizDone =
      topic.quiz !== null &&
      quizAttempts.some((qa) => qa.quiz_id === topic.quiz!.id && qa.score >= 70);

    if (!engineDone && !quizDone) return i;
  }
  return -1; // all completed
}

function ModulePathSectionInner({
  module,
  topicProgress,
  quizAttempts,
  onStartLesson,
  onOpenQuiz,
}: ModulePathSectionProps) {
  const { topics, isModuleLocked, isModuleComplete } = module;
  const unlockedCount = topics.filter((t) => t.isUnlocked).length;
  const progressPercent =
    topics.length > 0 ? Math.round((unlockedCount / topics.length) * 100) : 0;
  const levelClass =
    LEVEL_COLORS[module.level?.toLowerCase()] ??
    'bg-blue-100 text-blue-700 ring-blue-600/20';

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
        isModuleLocked ? 'opacity-50' : '',
      ].join(' ')}
      style={{
        background: 'var(--glass-bg)',
        borderColor: isModuleComplete
          ? '#84cc16'
          : isModuleLocked
            ? 'rgba(128,128,128,0.3)'
            : 'var(--glass-border)',
        boxShadow: isModuleLocked ? 'none' : 'var(--glass-shadow)',
      }}
    >
      {/* ── Module header ─────────────────────────────────────────────── */}
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: 'var(--glass-border)', background: 'rgba(0,0,0,0.15)' }}
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
              className="font-bold text-sm truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {module.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-inset capitalize ${levelClass}`}
            >
              {module.level}
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: isModuleComplete
                  ? 'rgba(132,204,22,0.2)'
                  : 'rgba(128,128,128,0.15)',
                color: isModuleComplete ? '#84cc16' : 'var(--text-muted)',
              }}
            >
              {unlockedCount}/{topics.length}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {!isModuleLocked && (
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(128,128,128,0.2)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: isModuleComplete ? '#84cc16' : 'var(--accent)',
              }}
            />
          </div>
        )}
        {isModuleLocked && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Selesaikan module sebelumnya untuk membuka ini.
          </p>
        )}
      </div>

      {/* ── Topic nodes ───────────────────────────────────────────────── */}
      {!isModuleLocked && (
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
          </div>
        </div>
      )}
    </div>
  );
}

export const ModulePathSection = memo(ModulePathSectionInner);
