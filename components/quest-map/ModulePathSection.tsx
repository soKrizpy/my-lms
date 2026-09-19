'use client';

// components/quest-map/ModulePathSection.tsx
// Renders one module as a "chapter" with a winding path of TopicNodes.
// Desktop: zigzag 3-column layout with a thick Cut-the-Rope-style SVG rope overlay.
// Mobile: single vertical column with thin animated rope connectors.

import React, { memo, useEffect, useLayoutEffect, useRef, useState, useId } from 'react';
import { TopicNode, type TopicNodeTopic, type TopicProgress, type QuizAttempt } from './TopicNode';
import { AssessmentNode } from './AssessmentNode';
import { RopeConnector } from './RopeConnector';
import { QuestMapRope, type RopePoint } from './QuestMapRope';
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
  moduleStatus?: 'active' | 'paused';
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
  beginner:     'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-500/50',
  intermediate: 'bg-amber-100  text-amber-800  border border-amber-300  dark:bg-amber-950/80  dark:text-amber-200  dark:border-amber-500/50',
  advance:      'bg-rose-100   text-rose-800   border border-rose-300   dark:bg-rose-950/80   dark:text-rose-200   dark:border-rose-500/50',
  advanced:     'bg-rose-100   text-rose-800   border border-rose-300   dark:bg-rose-950/80   dark:text-rose-200   dark:border-rose-500/50',
  master:       'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-500/50',
};

function findFirstActiveIndex(
  topics: TopicNodeTopic[],
  topicProgress: TopicProgress[],
  quizAttempts: QuizAttempt[]
): number {
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
    const quizMaxed    = attemptsUsed >= 2;
    const quizPassed   =
      topic.quiz !== null &&
      quizAttempts.some((qa) => qa.quiz_id === topic.quiz!.id && qa.score >= 70);

    if (!engineDone && !quizMaxed && !quizPassed) return i;
  }
  return -1;
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
  const isPaused = module.moduleStatus === 'paused';
  const uid = useId().replace(/[^a-z0-9]/gi, '');

  const hasSavedCompletion = topics.some((topic) => {
    const engineCompleted =
      topic.engine_topic_id !== null &&
      topicProgress.some((p) => p.engine_topic_id === topic.engine_topic_id);
    const quizCompleted =
      topic.quiz !== null &&
      quizAttempts.some((a) => a.quiz_id === topic.quiz!.id);
    return engineCompleted || quizCompleted;
  });

  const [isExpanded, setIsExpanded] = useState(!isPaused || hasSavedCompletion);
  useEffect(() => {
    if (hasSavedCompletion) setIsExpanded(true);
  }, [hasSavedCompletion]);

  const unlockedCount   = topics.filter((t) => t.isUnlocked).length;
  const progressPercent = topics.length > 0 ? Math.round((unlockedCount / topics.length) * 100) : 0;
  const levelClass =
    LEVEL_COLORS[module.level?.toLowerCase()] ??
    'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-500/50';

  const activeIndex = findFirstActiveIndex(topics, topicProgress, quizAttempts);

  // Group into rows of 3 for the zigzag desktop layout
  const rows: TopicNodeTopic[][] = [];
  for (let i = 0; i < topics.length; i += 3) rows.push(topics.slice(i, i + 3));

  // ── Rope overlay: measure node positions ──────────────────────────
  // nodeRefs[i] points to the icon-button wrapper of sequential topic i
  const nodeRefs       = useRef<(HTMLDivElement | null)[]>([]);
  const assessRef      = useRef<HTMLDivElement | null>(null);
  const containerRef   = useRef<HTMLDivElement | null>(null);
  const [ropePoints, setRopePoints] = useState<RopePoint[]>([]);
  const [svgSize, setSvgSize]       = useState({ w: 0, h: 0 });

  // Resize-aware measurement: runs after paint on desktop
  useLayoutEffect(() => {
    if (!isExpanded) return;
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const cr = container.getBoundingClientRect();
      if (cr.width === 0) return;

      const pts: RopePoint[] = [];

      // Sequential topics
      topics.forEach((topic, idx) => {
        const el = nodeRefs.current[idx];
        if (!el) return;
        const r = el.getBoundingClientRect();
        pts.push({
          // Centre of the node icon (icon is h-14 = 56px; centre = 28px from top of el)
          x: r.left - cr.left + r.width / 2,
          y: r.top  - cr.top  + 28,
          unlocked: topic.isUnlocked,
        });
      });

      // Assessment node (if present)
      if (assessRef.current && assessmentState && assessmentState.status !== 'no_assessment') {
        const r = assessRef.current.getBoundingClientRect();
        pts.push({
          x: r.left - cr.left + r.width / 2,
          y: r.top  - cr.top  + 28,
          unlocked: assessmentState.status !== 'locked',
        });
      }

      setRopePoints(pts);
      setSvgSize({ w: cr.width, h: cr.height });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [isExpanded, topics, assessmentState]);

  return (
    <div
      className={['rounded-2xl border overflow-hidden transition-all', isModuleLocked ? 'opacity-55' : ''].join(' ')}
      style={{
        background:  'var(--glass-bg)',
        borderColor: isModuleComplete ? '#10b981' : isPaused ? '#f59e0b' : isModuleLocked ? 'rgba(128,128,128,0.25)' : 'var(--glass-border)',
        boxShadow:   isModuleLocked || isPaused ? 'none' : 'var(--glass-shadow)',
        opacity:     isPaused ? 0.85 : 1,
      }}
    >
      {/* ── Module header ──────────────────────────────────────────── */}
      <div
        className="px-5 py-4 border-b bg-slate-100/70 dark:bg-black/30 cursor-pointer select-none"
        style={{ borderColor: 'var(--glass-border)' }}
        onClick={() => setIsExpanded((p) => !p)}
        role="button"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {isModuleLocked  && <span className="text-base" aria-hidden="true">🔒</span>}
            {isModuleComplete && <span className="text-base" aria-hidden="true">🏆</span>}
            {!isModuleLocked && !isModuleComplete && <span className="text-base" aria-hidden="true">📚</span>}
            <h3 className="font-bold text-sm truncate text-slate-900 dark:text-white">{module.title}</h3>
            {isPaused && (
              <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-500/50 flex-shrink-0">
                ⏸ Dijeda
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={'text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize shadow-xs ' + levelClass}>
              {module.level}
            </span>
            <span className={[
              'text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs',
              isModuleComplete
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-500/40'
                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-200 dark:border-white/15',
            ].join(' ')}>
              {unlockedCount}/{topics.length}
            </span>
          </div>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700/60">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: progressPercent + '%', background: isModuleComplete ? '#10b981' : 'var(--accent)' }} />
        </div>
        {isModuleLocked && (
          <p className="text-xs mt-2 text-slate-600 dark:text-slate-300 font-medium">
            🔒 Modul ini terkunci. Ikuti kelas untuk membuka topik pembelajaran di bab ini.
          </p>
        )}
      </div>

      {/* ── Topic nodes ─────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="p-5">

          {/* ── Mobile: single vertical column (thin rope connectors) ── */}
          <div className="flex flex-col items-center gap-2 lg:hidden">
            {topics.map((topic, idx) => {
              const nextTopic = topics[idx + 1];
              const lineGlows = topic.isUnlocked && (nextTopic?.isUnlocked ?? false);
              return (
                <React.Fragment key={topic.id}>
                  <TopicNode
                    topic={topic}
                    isCurrentActive={idx === activeIndex}
                    topicProgress={topicProgress}
                    quizAttempts={quizAttempts}
                    onStartLesson={isPaused ? undefined : onStartLesson}
                    onOpenQuiz={isPaused ? undefined : onOpenQuiz}
                    onSelectTopic={(t) => onSelectTopic?.(t, module.title, idx)}
                    nodeIndex={idx}
                  />
                  {idx < topics.length - 1 && (
                    <div style={{ height: '36px', width: '20px' }}>
                      <RopeConnector glows={lineGlows} orientation="v" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            {assessmentState && assessmentState.status !== 'no_assessment' && (() => {
              const lastTopic = topics[topics.length - 1];
              const glow = !!(lastTopic?.isUnlocked && assessmentState.status !== 'locked');
              return (
                <>
                  <div style={{ height: '36px', width: '20px' }}>
                    <RopeConnector glows={glow} orientation="v" />
                  </div>
                  <AssessmentNode assessmentState={assessmentState} onOpen={onOpenAssessment ?? (() => {})} />
                </>
              );
            })()}
          </div>

          {/* ── Desktop: zigzag 3-column with thick SVG rope overlay ── */}
          {/*
            The SVG overlay is absolutely positioned over the node grid.
            It draws ONE continuous thick Catmull-Rom path through all node
            centres, measured via refs after paint. Emerald on unlocked
            segments; muted grey on locked ones.

            Node row layout:
              Even rows (0,2,…) → L→R:  topics displayed left, mid, right
              Odd  rows (1,3,…) → R→L:  topics reversed visually

            Between rows: a 44px spacer div keeps the vertical gap consistent.
            No RopeConnector divs here — the SVG overlay handles all connections.
          */}
          <div
            ref={containerRef}
            className="relative hidden lg:flex flex-col items-center"
          >
            {/* SVG rope overlay — rendered behind node content */}
            {ropePoints.length > 1 && svgSize.w > 0 && (
              <svg
                className="absolute inset-0 pointer-events-none"
                width={svgSize.w}
                height={svgSize.h}
                style={{ overflow: 'visible', zIndex: 0 }}
                aria-hidden="true"
              >
                <QuestMapRope points={ropePoints} uid={uid} />
              </svg>
            )}

            {rows.map((row, rowIdx) => {
              const reversed   = rowIdx % 2 === 1;
              const orderedRow = reversed ? [...row].reverse() : row;
              const startIdx   = rowIdx * 3;

              return (
                <React.Fragment key={rowIdx}>
                  {/* Vertical gap spacer between rows (rope drawn in SVG overlay) */}
                  {rowIdx > 0 && <div style={{ height: '44px' }} aria-hidden="true" />}

                  {/* Node row — nodes only, no connector divs */}
                  <div className="relative flex items-start justify-between w-full max-w-sm" style={{ zIndex: 10 }}>
                    {orderedRow.map((topic, colIdx) => {
                      const originalIdx = reversed
                        ? startIdx + (row.length - 1 - colIdx)
                        : startIdx + colIdx;

                      return (
                        <div
                          key={topic.id}
                          // Store ref to the node wrapper so we can measure its position
                          ref={(el) => { nodeRefs.current[originalIdx] = el; }}
                          className="flex flex-col items-center"
                          style={{ width: '88px' }}
                        >
                          <TopicNode
                            topic={topic}
                            isCurrentActive={originalIdx === activeIndex}
                            topicProgress={topicProgress}
                            quizAttempts={quizAttempts}
                            onStartLesson={isPaused ? undefined : onStartLesson}
                            onOpenQuiz={isPaused ? undefined : onOpenQuiz}
                            onSelectTopic={(t) => onSelectTopic?.(t, module.title, originalIdx)}
                            nodeIndex={originalIdx}
                          />
                        </div>
                      );
                    })}

                    {/* Empty slots for incomplete last row */}
                    {orderedRow.length < 3 &&
                      Array.from({ length: 3 - orderedRow.length }).map((_, i) => (
                        <div key={'e' + i} style={{ width: '88px' }} aria-hidden="true" />
                      ))}
                  </div>
                </React.Fragment>
              );
            })}

            {/* Assessment node */}
            {assessmentState && assessmentState.status !== 'no_assessment' && (
              <>
                <div style={{ height: '44px' }} aria-hidden="true" />
                <div
                  ref={assessRef}
                  className="relative flex justify-center"
                  style={{ zIndex: 10 }}
                >
                  <AssessmentNode
                    assessmentState={assessmentState}
                    onOpen={onOpenAssessment ?? (() => {})}
                  />
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export const ModulePathSection = memo(ModulePathSectionInner);
