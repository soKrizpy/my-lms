'use client';

// components/quest-map/TopicNode.tsx
// Individual node in the Quest Map learning path.
// State drives the visual appearance: locked / unlocked / active / completed.

import React, { memo } from 'react';
import { getTopicAttachmentUrl } from '../../lib/topicLink';

export type NodeState = 'locked' | 'unlocked' | 'active' | 'completed';

export interface TopicProgress {
  engine_topic_id: string;
  topic_id: number;
  xp_earned: number;
  best_quiz_score: number;
  completed_at: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  score: number;
  total_questions: number;
  attempts_count?: number;
  created_at: string;
}

export interface TopicNodeTopic {
  id: number;
  title: string;
  order_index: number;
  engine_topic_id: string | null;
  isUnlocked: boolean;
  description?: string | null;
  project_link?: string | null;
  topic_link?: string | null;
  status?: string | null;
  lesson_content?: unknown;
  quiz: { id: number; title: string } | null;
}

interface TopicNodeProps {
  topic: TopicNodeTopic;
  isCurrentActive: boolean;
  topicProgress: TopicProgress[];
  onStartLesson?: (engineTopicId: string) => void;
  onOpenQuiz?: (quiz: { id: number; title: string }) => void;
  onSelectTopic?: (topic: TopicNodeTopic) => void;
  quizAttempts: QuizAttempt[];
  nodeIndex: number;
}

/**
 * Derive display state for a topic node.
 *
 * completed rules (in order):
 *  1. Engine lesson finished (topic_progress record exists)
 *  2. Quiz has been ATTEMPTED AT LEAST ONCE regardless of score
 *     (student has used their 2 attempts — the topic is "done")
 *
 * NOTE: We do NOT gate completed on score >= 70, because:
 *  - Quiz max attempts = 2, after which the topic is considered done
 *  - Low-scoring students still completed the topic — they just didn't ace it
 *  - The quiz button logic separately shows "Quiz ✓ {score}" vs "Quiz" (retry)
 */
function deriveNodeState(
  topic: TopicNodeTopic,
  isCurrentActive: boolean,
  topicProgress: TopicProgress[],
  quizAttempts: QuizAttempt[]
): NodeState {
  if (!topic.isUnlocked) return 'locked';

  // Engine lesson completed
  const engineDone =
    topic.engine_topic_id !== null &&
    topicProgress.some((tp) => tp.engine_topic_id === topic.engine_topic_id);

  // Quiz maxed out (2 attempts used) — topic is "done" regardless of score
  const quizAttempt = topic.quiz
    ? quizAttempts.find((qa) => qa.quiz_id === topic.quiz!.id)
    : undefined;
  const quizMaxed = (quizAttempt?.attempts_count ?? 0) >= 2;

  // Quiz attempted at least once with a passing score (>= 70)
  const quizPassed =
    topic.quiz !== null &&
    quizAttempts.some((qa) => qa.quiz_id === topic.quiz!.id && qa.score >= 70);

  if (engineDone || quizMaxed || quizPassed) return 'completed';
  if (isCurrentActive) return 'active';
  return 'unlocked';
}

const NODE_ICONS: Record<NodeState, string> = {
  locked: '🔒',
  unlocked: '📖',
  active: '⚡',
  completed: '✅',
};

function TopicNodeInner({
  topic,
  isCurrentActive,
  topicProgress,
  onStartLesson,
  onOpenQuiz,
  onSelectTopic,
  quizAttempts,
  nodeIndex,
}: TopicNodeProps) {
  const state = deriveNodeState(topic, isCurrentActive, topicProgress, quizAttempts);
  const attachmentUrl = getTopicAttachmentUrl(topic.topic_link);

  // Can student access the engine lesson?
  // Always accessible when unlocked — even after completing quiz or being "completed"
  // Students should always be able to review their material.
  const canStartEngine =
    state !== 'locked' &&
    topic.engine_topic_id !== null &&
    (topic.status === 'published' || topic.lesson_content == null);

  // Quiz state
  const quizAttempt = topic.quiz
    ? quizAttempts.find((qa) => qa.quiz_id === topic.quiz!.id)
    : undefined;
  // (attemptsUsed / quizMaxed removed — quiz section now only checks whether any attempt exists)

  // ── Visual config per state ──────────────────────────────────────────────
  const nodeStyles: Record<NodeState, string> = {
    locked:
      'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700/80 cursor-pointer hover:scale-105 opacity-70 hover:opacity-95 transition-all text-slate-400 dark:text-slate-500',
    unlocked:
      'bg-sky-50 dark:bg-sky-950/30 border-2 border-sky-500 dark:border-sky-400 cursor-pointer hover:scale-105 hover:border-sky-600 dark:hover:border-sky-300 transition-all shadow-[0_0_12px_rgba(14,165,233,0.25)]',
    active:
      'border-2 cursor-pointer hover:scale-105 animate-bounce bg-blue-50/90 dark:bg-purple-950/40 border-blue-600 dark:border-purple-400 shadow-[0_0_18px_rgba(59,130,246,0.4)] dark:shadow-[0_0_18px_rgba(168,85,247,0.4)]',
    completed:
      'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-600 dark:border-emerald-400 cursor-pointer hover:scale-105 transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  };

  const handleNodeClick = () => {
    if (state === 'locked') return;
    // Engine lesson takes priority: open in new tab
    if (canStartEngine && onStartLesson) {
      onStartLesson(topic.engine_topic_id!);
      return;
    }
    // No engine lesson — open the LMS topic flow modal (manual content)
    if (onSelectTopic) {
      onSelectTopic(topic);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5 group">
      {/* ── Node button ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleNodeClick}
        aria-label={`${topic.order_index}. ${topic.title} — ${state}`}
        className={[
          'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl',
          'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-[color:var(--accent)] cursor-pointer',
          nodeStyles[state],
        ].join(' ')}
      >
        {NODE_ICONS[state]}
      </button>

      {/* ── Node index badge ─────────────────────────────────────────────── */}
      <span
        className={[
          'text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs',
          state === 'completed'
            ? 'bg-emerald-600 text-white'
            : state === 'active'
              ? 'bg-brand-primary text-white ring-2 ring-blue-400/40'
              : state === 'unlocked'
                ? 'bg-sky-600 dark:bg-sky-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600',
        ].join(' ')}
      >
        {nodeIndex + 1}
      </span>

      {/* ── Topic title ──────────────────────────────────────────────────── */}
      <p
        className={`text-center text-[11px] font-semibold leading-tight max-w-[84px] line-clamp-2 cursor-pointer transition-colors ${
          state === 'locked'
            ? 'text-slate-500 dark:text-slate-400'
            : 'text-slate-900 dark:text-white font-bold'
        }`}
        title={topic.title}
        onClick={handleNodeClick}
      >
        {topic.title}
      </p>

      {/* ── Action buttons row ───────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 min-h-[20px]">
        {/* State CTA Button */}
        {state === 'locked' ? (
          <button
            type="button"
            onClick={handleNodeClick}
            className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/15 cursor-pointer"
          >
            🔒 Terkunci
          </button>
        ) : state === 'completed' ? (
          <button
            type="button"
            onClick={handleNodeClick}
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-600/50 cursor-pointer"
          >
            ▶ Review
          </button>
        ) : state === 'active' ? (
          <button
            type="button"
            onClick={handleNodeClick}
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors bg-brand-primary hover:brightness-110 text-white shadow-sm shadow-brand-primary/30 cursor-pointer"
          >
            🚀 Mulai!
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNodeClick}
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white shadow-sm cursor-pointer"
          >
            ▶ Buka
          </button>
        )}

        {/* Quiz badge / nudge */}
        {topic.quiz && state !== 'locked' && (
          quizAttempt ? (
            // Attempted — show best score (score column always stores the highest)
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/50"
            >
              Quiz ✓ {quizAttempt.score}
            </span>
          ) : (
            // No attempt yet — nudge student
            <button
              type="button"
              onClick={() => onOpenQuiz?.(topic.quiz!)}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
            >
              📝 Kerjakan Quiz!
            </button>
          )
        )}

        {/* Teacher-attached material (direct URL or iframe embed source). */}
        {attachmentUrl && state !== 'locked' && (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-violet-300 dark:border-violet-500/60 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors cursor-pointer"
          >
            📎 Materi
          </a>
        )}

        {/* Coming soon badge — engine_topic_id linked but lesson not published yet */}
        {topic.engine_topic_id && !canStartEngine && state !== 'locked' && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/50"
          >
            ⏳ Segera
          </span>
        )}
      </div>
    </div>
  );
}

export const TopicNode = memo(TopicNodeInner);
