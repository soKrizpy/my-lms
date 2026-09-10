'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AssessmentQuestionPublic, AssessmentSubmitResult } from '../../lib/lmsData';
import { formatAttemptLabel } from '../../lib/assessmentHelpers';
import AssessmentForm from './AssessmentForm';
import AssessmentResultScreen from './AssessmentResultScreen';

// ── Types ────────────────────────────────────────────────────────────────────

interface AssessmentModalProps {
  assessmentId: number;
  assessmentTitle: string;
  /** Attempt count BEFORE this attempt (0 = no prior attempts, 1 = one prior) */
  attemptCount: 0 | 1;
  onClose: () => void;
  /** Called on successful submission so the parent can refresh dashboard data */
  onSuccess: () => void;
}

type Phase = 'loading' | 'taking' | 'result';

// ── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Memuat soal..." aria-busy="true">
      {[1, 2, 3].map((n) => (
        <div key={n} className="space-y-2">
          {/* Question text placeholder */}
          <div className="h-4 rounded bg-slate-200 dark:bg-white/10 w-4/5" />
          {/* Option placeholders */}
          {[1, 2, 3, 4].map((o) => (
            <div
              key={o}
              className="h-10 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <span className="text-4xl" aria-hidden="true">😞</span>
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Gagal memuat soal. Silakan coba lagi.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Modal that drives the full assessment flow:
 *   loading  →  taking  →  result
 *
 * Validates: Requirements 4.2, 4.5, 4.6, 4.7, 4.8
 */
export function AssessmentModal({
  assessmentId,
  assessmentTitle,
  attemptCount,
  onClose,
  onSuccess,
}: AssessmentModalProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<AssessmentQuestionPublic[]>([]);
  const [loadError, setLoadError] = useState(false);

  // State for taking phase
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // State for result phase
  const [submittedResult, setSubmittedResult] = useState<AssessmentSubmitResult | null>(null);
  // The attempt count AFTER the submission (1 or 2)
  const [newAttemptCount, setNewAttemptCount] = useState<1 | 2>(1);

  // ── Fetch questions ────────────────────────────────────────────────────────

  const fetchQuestions = useCallback(async () => {
    setLoadError(false);
    setPhase('loading');
    try {
      const res = await fetch(`/api/student/assessment?assessmentId=${assessmentId}`);
      if (!res.ok) {
        setLoadError(true);
        return;
      }
      const data: AssessmentQuestionPublic[] = await res.json();
      setQuestions(data);
      setPhase('taking');
    } catch {
      setLoadError(true);
    }
  }, [assessmentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchQuestions();
  }, [fetchQuestions]);

  // ── Submit handler ─────────────────────────────────────────────────────────

  const handleSubmit = async (answers: Record<string, 'A' | 'B' | 'C' | 'D'>) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const res = await fetch('/api/student/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId, answers }),
      });

      if (!res.ok) {
        let message = 'Terjadi kesalahan. Jawabanmu tersimpan, silakan coba kirim lagi.';
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          // keep default message
        }
        setSubmissionError(message);
        return; // stay in 'taking' phase — all answers are preserved in AssessmentForm state
      }

      const result: AssessmentSubmitResult = await res.json();
      const computed = (attemptCount + 1) as 1 | 2;
      setSubmittedResult(result);
      setNewAttemptCount(computed);
      setPhase('result');
    } catch {
      setSubmissionError('Tidak dapat terhubung ke server. Jawabanmu tersimpan, silakan coba kirim lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Close handler (result phase) ───────────────────────────────────────────

  const handleResultClose = () => {
    onSuccess();
    onClose();
  };

  // ── Backdrop click — only close when not submitting ────────────────────────

  const handleBackdropClick = () => {
    if (!isSubmitting) onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Panel — stop propagation so inner clicks don't close the modal */}
      <div
        className="relative w-full max-w-2xl my-auto rounded-2xl border border-[var(--glass-border)] shadow-2xl overflow-hidden"
        style={{ background: 'var(--glass-bg, #fff)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--glass-border)]"
          style={{ background: 'var(--glass-bg)' }}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <h2
              id="assessment-modal-title"
              className="text-base font-bold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {assessmentTitle}
            </h2>
            {/* Attempt label shown only during the taking phase */}
            {phase === 'taking' && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatAttemptLabel(attemptCount)}
              </p>
            )}
          </div>

          {/* X close button — disabled while a submission is in-flight */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup"
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Body (scrollable) ────────────────────────────────────────────── */}
        <div className="px-5 py-5 max-h-[75vh] overflow-y-auto">
          {/* Loading phase */}
          {phase === 'loading' && !loadError && <LoadingSkeleton />}

          {/* Load-error state */}
          {phase === 'loading' && loadError && <LoadError onRetry={fetchQuestions} />}

          {/* Taking phase */}
          {phase === 'taking' && (
            <div className="space-y-4">
              {/* Inline submission error — answers stay intact in AssessmentForm */}
              {submissionError && (
                <div
                  role="alert"
                  className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-sm text-red-700 dark:text-red-300"
                >
                  {submissionError}
                </div>
              )}

              <AssessmentForm
                questions={questions}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          )}

          {/* Result phase */}
          {phase === 'result' && submittedResult && (
            <AssessmentResultScreen
              result={submittedResult}
              attemptCount={newAttemptCount}
              onClose={handleResultClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
