'use client';

// components/quest-map/TopicNode.tsx
// Individual node in the Quest Map learning path.
// State drives the visual appearance: locked / unlocked / active / completed.

import React, { memo } from 'react';

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
  quizAttempts: QuizAttempt[];
  nodeIndex: number;
}

function deriveNodeState(
  topic: TopicNodeTopic,
  isCurrentActive: boolean,
  topicProgress: TopicProgress[],
  quizAttempts: QuizAttempt[]
): NodeState {
  if (!topic.isUnlocked) return 'locked';

  // Completed: has a topic_progress record (engine lesson done)
  // OR has a quiz attempt with score >= 70
  const engineDone =
    topic.engine_topic_id !== null &&
    topicProgress.some((tp) => tp.engine_topic_id === topic.engine_topic_id);

  const quizDone =
    topic.quiz !== null &&
    quizAttempts.some((qa) => qa.quiz_id === topic.quiz!.id && qa.score >= 70);

  if (engineDone || quizDone) return 'completed';
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
  quizAttempts,
  nodeIndex,
}: TopicNodeProps) {
  const state = deriveNodeState(topic, isCurrentActive, topicProgress, quizAttempts);

  // Can student start the engine lesson?
  const canStartEngine =
    state !== 'locked' &&
    topic.engine_topic_id !== null &&
    (topic.status === 'published' || topic.lesson_content == null);

  // Quiz state
  const quizAttempt = topic.quiz
    ? quizAttempts.find((qa) => qa.quiz_id === topic.quiz!.id)
    : undefined;
  const quizMaxed = (quizAttempt?.attempts_count ?? 0) >= 2;

  // ── Visual config per state ──────────────────────────────────────────────
  const nodeStyles: Record<NodeState, string> = {
    locked:
      'bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 cursor-not-allowed opacity-60',
    unlocked:
      'border-sky-400 dark:border-sky-500 cursor-pointer hover:scale-105 hover:border-sky-300',
    active:
      'border-2 cursor-pointer hover:scale-105 animate-bounce',
    completed:
      'border-2 cursor-pointer hover:scale-105',
  };

  const nodeColorStyle: Record<NodeState, React.CSSProperties> = {
    locked: {},
    unlocked: {
      background: 'rgba(14,165,233,0.12)',
      borderColor: '#38bdf8',
      boxShadow: '0 0 10px rgba(56,189,248,0.3)',
    },
    active: {
      background: 'rgba(var(--accent-rgb, 168,85,247),0.15)',
      borderColor: 'var(--accent)',
      boxShadow: '0 0 14px var(--accent-glow)',
    },
    completed: {
      background: 'rgba(132,204,22,0.15)',
      borderColor: '#84cc16',
      boxShadow: '0 0 10px rgba(132,204,22,0.25)',
    },
  };

  const handleNodeClick = () => {
    if (state === 'locked') return;
    if (canStartEngine && onStartLesson) {
      onStartLesson(topic.engine_topic_id!);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5 group">
      {/* ── Node button ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleNodeClick}
        disabled={state === 'locked'}
        aria-label={`${topic.order_index}. ${topic.title} — ${state}`}
        className={[
          'w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl',
          'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-[color:var(--accent)]',
          nodeStyles[state],
        ].join(' ')}
        style={nodeColorStyle[state]}
      >
        {NODE_ICONS[state]}
      </button>

      {/* ── Node index badge ─────────────────────────────────────────────── */}
      <span
        className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
        style={{
          background: state === 'completed' ? '#84cc16' : state === 'active' ? 'var(--accent)' : 'rgba(128,128,128,0.2)',
          color: state === 'locked' ? 'var(--text-muted)' : '#fff',
        }}
      >
        {nodeIndex + 1}
      </span>

      {/* ── Topic title ──────────────────────────────────────────────────── */}
      <p
        className="text-center text-[11px] font-medium leading-tight max-w-[80px] line-clamp-2"
        style={{ color: state === 'locked' ? 'var(--text-muted)' : 'var(--text-secondary)' }}
        title={topic.title}
      >
        {topic.title}
      </p>

      {/* ── Action buttons row ───────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 min-h-[20px]">
        {canStartEngine && state !== 'completed' && (
          <button
            type="button"
            onClick={() => onStartLesson?.(topic.engine_topic_id!)}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors focus:outline-none focus-visible:ring-1"
            style={{
              background: 'var(--accent)',
              color: '#fff',
            }}
          >
            {state === 'active' ? '🚀 Mulai!' : '▶ Lanjut'}
          </button>
        )}

        {topic.quiz && state !== 'locked' && (
          quizMaxed ? (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(132,204,22,0.2)', color: '#84cc16' }}
            >
              Quiz ✓ {quizAttempt?.score ?? 0}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onOpenQuiz?.(topic.quiz!)}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors focus:outline-none focus-visible:ring-1"
              style={{
                borderColor: '#38bdf8',
                color: '#38bdf8',
                background: 'rgba(56,189,248,0.1)',
              }}
            >
              Quiz
            </button>
          )
        )}

        {topic.engine_topic_id && !canStartEngine && state !== 'locked' && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
          >
            ⏳ Segera
          </span>
        )}
      </div>
    </div>
  );
}

export const TopicNode = memo(TopicNodeInner);
