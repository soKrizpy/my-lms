'use client';

// components/PostClassQuizModal.tsx
// Modal for post-class quiz — System B (lesson_content.post_class_quiz JSONB)
// with automatic fallback to System A (relational quiz_questions).
// Gate: quiz only opens if hasProgressReport === true (teacher submitted report).

import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation?: string;
}

interface QuizData {
  gated: boolean;
  hasProgressReport: boolean;
  source: 'jsonb' | 'relational' | 'none';
  topicId: number;
  topicTitle: string;
  quizId?: number;
  cypeco_exp_reward: number;
  questions: QuizQuestion[];
  attempt: { attemptsCount: number; score: number };
  message?: string;
}

interface SubmitResult {
  score: number;
  bestScore: number;
  total: number;
  correct: number;
  correctAnswers: Record<string, string>;
  attemptsCount: number;
  cypeco_exp_awarded: number;
}

interface PostClassQuizModalProps {
  topicId: number;
  topicTitle: string;
  onClose: () => void;
  onComplete: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PostClassQuizModal({
  topicId,
  topicTitle,
  onClose,
  onComplete,
}: PostClassQuizModalProps) {
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Quiz state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch on mount
  useEffect(() => {
    setLoading(true);
    fetch(`/api/student/post-class-quiz?topicId=${topicId}`)
      .then((r) => r.json())
      .then((data: QuizData) => {
        setQuizData(data);
      })
      .catch(() => {
        setFetchError('Gagal memuat data kuis. Coba lagi nanti.');
      })
      .finally(() => setLoading(false));
  }, [topicId]);

  function selectOption(questionId: string, optionId: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function handleSubmit() {
    if (!quizData) return;
    const unanswered = quizData.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setSubmitError(`Masih ada ${unanswered.length} soal yang belum dijawab.`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/student/post-class-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          source: quizData.source,
          quizId: quizData.quizId,
          answers,
        }),
      });
      const data = await res.json() as SubmitResult & { error?: string };

      if (!res.ok) {
        setSubmitError(data.error ?? 'Gagal submit kuis.');
        return;
      }

      setResult(data);
      setSubmitted(true);
      onComplete();
    } catch {
      setSubmitError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  const allAnswered = quizData
    ? quizData.questions.every((q) => answers[q.id])
    : false;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              📝 Kuis Post-Class
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">
              {topicTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm text-slate-500">Memuat soal kuis...</p>
            </div>
          )}

          {/* Fetch error */}
          {!loading && fetchError && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* Gate locked */}
          {!loading && quizData?.gated && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <span className="text-5xl">🔒</span>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Kuis Belum Tersedia
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Kuis post-class akan terbuka setelah guru menyampaikan laporan pertemuan kelas ini.
                Pantau terus ya!
              </p>
            </div>
          )}

          {/* No questions */}
          {!loading && quizData && !quizData.gated && quizData.questions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <span className="text-4xl">📭</span>
              <p className="text-sm text-slate-500">Topik ini belum memiliki soal kuis.</p>
            </div>
          )}

          {/* Already maxed out */}
          {!loading && quizData && !quizData.gated && quizData.attempt.attemptsCount >= 2 && !submitted && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  Kamu sudah mengerjakan kuis ini (maks. 2 percobaan).
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Skor terbaikmu: <span className="font-extrabold text-base">{quizData.attempt.score}</span>
                </p>
              </div>
            </div>
          )}

          {/* Result screen (after submit) */}
          {submitted && result && (
            <div className="space-y-5">
              {/* Score card */}
              <div className={`p-5 rounded-2xl text-center border ${
                result.score >= 70
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
              }`}>
                <p className="text-5xl font-extrabold mb-1" style={{
                  color: result.score >= 70 ? '#059669' : '#d97706'
                }}>
                  {result.score}
                </p>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {result.correct}/{result.total} benar
                  {result.attemptsCount >= 2 && (
                    <span className="ml-2 text-xs text-slate-400">(percobaan ke-{result.attemptsCount}, maks 2)</span>
                  )}
                </p>
                {result.cypeco_exp_awarded > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/40 border border-violet-300 dark:border-violet-700/50 text-xs font-bold text-violet-700 dark:text-violet-300">
                    🐾 +{result.cypeco_exp_awarded} CyPeCo EXP diberikan!
                  </div>
                )}
              </div>

              {/* Answer review */}
              {quizData && quizData.questions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    Kunci Jawaban
                  </p>
                  {quizData.questions.map((q, idx) => {
                    const studentAnswer = answers[q.id];
                    const correctId = result.correctAnswers[q.id];
                    const isCorrect = studentAnswer === correctId;
                    const correctOption = q.options.find((o) => o.id === correctId);

                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-xl border text-xs ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-1.5 mb-1.5">
                          {isCorrect
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            : <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                          }
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {idx + 1}. {q.question}
                          </span>
                        </div>
                        {!isCorrect && (
                          <p className="ml-5 text-red-600 dark:text-red-400">
                            Jawabanmu: {q.options.find((o) => o.id === studentAnswer)?.text ?? studentAnswer}
                          </p>
                        )}
                        <p className={`ml-5 font-semibold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          ✓ {correctOption?.text ?? correctId}
                        </p>
                        {q.explanation && (
                          <p className="ml-5 mt-1 text-slate-500 dark:text-slate-400 italic">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quiz form */}
          {!loading && quizData && !quizData.gated &&
           quizData.questions.length > 0 &&
           quizData.attempt.attemptsCount < 2 &&
           !submitted && (
            <div className="space-y-5">
              {/* Attempt counter */}
              {quizData.attempt.attemptsCount === 1 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Percobaan ke-2 (terakhir). Skor sebelumnya: <strong>{quizData.attempt.score}</strong></span>
                </div>
              )}

              {/* Questions */}
              {quizData.questions.map((q, idx) => (
                <div key={q.id} className="space-y-2.5">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {idx + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => selectOption(q.id, opt.id)}
                          className={[
                            'w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all',
                            selected
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-semibold'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20',
                          ].join(' ')}
                        >
                          <span className="font-bold mr-2">{opt.id}.</span>
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Cypeco reward hint */}
              {quizData.cypeco_exp_reward > 0 && quizData.attempt.attemptsCount === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 text-xs text-violet-700 dark:text-violet-300">
                  <span>🐾</span>
                  <span>Selesaikan kuis ini untuk mendapat <strong>+{quizData.cypeco_exp_reward} CyPeCo EXP</strong>!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {submitted ? 'Tutup' : 'Batal'}
          </button>

          {!loading && quizData && !quizData.gated &&
           quizData.questions.length > 0 &&
           quizData.attempt.attemptsCount < 2 &&
           !submitted && (
            <div className="flex items-center gap-3">
              {submitError && (
                <span className="text-xs text-red-600 dark:text-red-400">{submitError}</span>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !allAnswered}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  '✅ Kirim Jawaban'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
