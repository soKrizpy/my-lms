'use client';

import type { AssessmentSubmitResult, QuestionResult } from '../../lib/lmsData';
import { formatAttemptLabel } from '../../lib/assessmentHelpers';

interface AssessmentResultScreenProps {
  result: AssessmentSubmitResult;
  /** Total attempts used after this submission (1 = one attempt done, 2 = both done) */
  attemptCount: 1 | 2;
  onClose: () => void;
}

/** Label shown above the score circle depending on pass/fail threshold (≥ 70). */
function ScoreLabel({ score }: { score: number }) {
  if (score >= 70) {
    return (
      <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
        Bagus! Kamu lulus 🎉
      </p>
    );
  }
  return (
    <p className="text-lg font-semibold text-red-500 dark:text-red-400">
      Belum lulus. Semangat!
    </p>
  );
}

/** Single row in the per-question breakdown list. */
function QuestionResultRow({ item, index }: { item: QuestionResult; index: number }) {
  return (
    <div className="pb-4 border-b border-[var(--glass-border)] last:border-0 last:pb-0 space-y-1">
      {/* Question text */}
      <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
        {index + 1}. {item.question_text}
      </p>

      {/* Student's answer */}
      <div className="flex items-center gap-1.5 text-sm">
        <span style={{ color: 'var(--text-muted)' }}>Jawabanmu:</span>
        <span
          className={[
            'font-semibold',
            item.is_correct
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-500 dark:text-red-400',
          ].join(' ')}
        >
          {item.selected_option}
        </span>
        {item.is_correct ? (
          <span
            className="text-emerald-600 dark:text-emerald-400"
            aria-label="Benar"
          >
            ✓
          </span>
        ) : (
          <span
            className="text-red-500 dark:text-red-400"
            aria-label="Salah"
          >
            ✗
          </span>
        )}
      </div>

      {/* Correct answer — only shown when the student got it wrong */}
      {!item.is_correct && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          Jawaban benar: {item.correct_option}
        </p>
      )}
    </div>
  );
}

/**
 * Result screen shown inside `AssessmentModal` after a successful submission.
 *
 * Validates: Requirements 4.5, 4.6, 5.3, 5.5
 */
export default function AssessmentResultScreen({
  result,
  attemptCount,
  onClose,
}: AssessmentResultScreenProps) {
  const { score, best_score, total_questions, correct_count, question_results } = result;

  const passingScore = score >= 70;

  // Attempt status line:
  //   attemptCount === 1 → one attempt used → formatAttemptLabel(0) = "Percobaan 1 dari 2"
  //                        plus "1 percobaan tersisa"
  //   attemptCount === 2 → both used → "Semua percobaan habis"
  const attemptStatusText =
    attemptCount === 1
      ? `${formatAttemptLabel(0)} · 1 percobaan tersisa`
      : 'Semua percobaan habis';

  return (
    <div className="space-y-6">
      {/* ── Score section ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 text-center">
        {/* Score circle */}
        <div
          aria-label={`Nilai kamu: ${score} dari 100`}
          className={[
            'w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-md select-none',
            passingScore
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-300'
              : 'bg-red-100 text-red-600 dark:bg-red-700/30 dark:text-red-300',
          ].join(' ')}
        >
          <span className="text-3xl font-black leading-none">{score}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5 opacity-70">
            / 100
          </span>
        </div>

        <ScoreLabel score={score} />

        {/* Correct count */}
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {correct_count} jawaban benar dari {total_questions} soal
        </p>

        {/* Best score badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--glass-border)] text-sm"
          style={{ background: 'var(--glass-bg)', color: 'var(--text-secondary)' }}
        >
          <span>🏆</span>
          <span>
            Nilai Terbaik:{' '}
            <strong className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {best_score}
            </strong>
          </span>
        </div>

        {/* Attempt status */}
        <p
          className={[
            'text-xs px-3 py-1 rounded-full border inline-block',
            attemptCount === 2
              ? 'text-orange-600 bg-orange-50 border-orange-100 dark:text-orange-300 dark:bg-orange-900/20 dark:border-orange-800'
              : 'text-sky-600 bg-sky-50 border-sky-100 dark:text-sky-300 dark:bg-sky-900/20 dark:border-sky-800',
          ].join(' ')}
        >
          {attemptStatusText}
        </p>
      </div>

      {/* ── Per-question breakdown ─────────────────────────────────────────── */}
      {question_results.length > 0 && (
        <div className="rounded-xl border border-[var(--glass-border)] overflow-hidden text-sm">
          <div
            className="px-4 py-2.5 border-b border-[var(--glass-border)] font-semibold text-xs uppercase tracking-wide"
            style={{ background: 'var(--glass-bg)', color: 'var(--text-secondary)' }}
          >
            Kunci Jawaban
          </div>
          <div className="p-4 space-y-4 max-h-[35vh] overflow-y-auto">
            {question_results.map((item, idx) => (
              <QuestionResultRow key={item.question_id} item={item} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* ── Close button ──────────────────────────────────────────────────── */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onClose}
          className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
