'use client';

import { useState } from 'react';
import type { AssessmentQuestionPublic } from '../../lib/lmsData';

interface AssessmentFormProps {
  questions: AssessmentQuestionPublic[];
  onSubmit: (answers: Record<string, 'A' | 'B' | 'C' | 'D'>) => Promise<void>;
  isSubmitting: boolean;
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const;

function getOptionText(
  question: AssessmentQuestionPublic,
  option: (typeof OPTIONS)[number],
): string {
  switch (option) {
    case 'A': return question.option_a;
    case 'B': return question.option_b;
    case 'C': return question.option_c;
    case 'D': return question.option_d;
  }
}

export default function AssessmentForm({
  questions,
  onSubmit,
  isSubmitting,
}: AssessmentFormProps) {
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});

  const allAnswered = questions.length > 0 && questions.every((q) => answers[String(q.id)] !== undefined);
  const submitDisabled = !allAnswered || isSubmitting;

  const handleSelect = (questionId: number, option: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: option }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitDisabled) return;
    await onSubmit(answers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {questions.map((q, idx) => {
        const selectedOption = answers[String(q.id)];
        const fieldsetId = `question-${q.id}`;

        return (
          <fieldset key={q.id} className="space-y-2">
            <legend
              id={fieldsetId}
              className="font-medium text-sm leading-snug"
              style={{ color: 'var(--text-primary)' }}
            >
              {idx + 1}. {q.question_text}
            </legend>

            <div className="grid grid-cols-1 gap-2 mt-2" role="radiogroup" aria-labelledby={fieldsetId}>
              {OPTIONS.map((opt) => {
                const isChosen = selectedOption === opt;
                const inputId = `q-${q.id}-opt-${opt}`;

                return (
                  <label
                    key={opt}
                    htmlFor={inputId}
                    className={[
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer',
                      isChosen
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium dark:bg-blue-600/30 dark:border-blue-400 dark:text-blue-100 shadow-[0_0_8px_rgba(59,130,246,0.2)] ring-2 ring-blue-500/20'
                        : 'border-[var(--glass-border)] hover:bg-[var(--glass-bg)]',
                    ].join(' ')}
                    style={!isChosen ? { color: 'var(--text-primary)' } : undefined}
                  >
                    <input
                      type="radio"
                      id={inputId}
                      name={`question-${q.id}`}
                      value={opt}
                      checked={isChosen}
                      onChange={() => handleSelect(q.id, opt)}
                      className="sr-only"
                    />
                    <span className="font-bold flex-shrink-0">{opt}.</span>
                    <span>{getOptionText(q, opt)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div className="pt-2 flex items-center justify-between gap-4">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {Object.keys(answers).length} / {questions.length} terjawab
        </p>
        <button
          type="submit"
          disabled={submitDisabled}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Mengirim...' : 'Kirim Jawaban'}
        </button>
      </div>
    </form>
  );
}
