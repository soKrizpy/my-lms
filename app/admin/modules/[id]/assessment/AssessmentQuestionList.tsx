"use client";

import { useState, useTransition } from "react";
import { deleteQuestionAction } from "./actions";
import { AssessmentQuestionRecord } from "../../../../../lib/lmsData";
import { EditQuestionModal } from "./EditQuestionModal";

interface Props {
  questions: AssessmentQuestionRecord[];
  assessmentId: number;
  moduleId: string;
}

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

function optionValue(q: AssessmentQuestionRecord, letter: (typeof OPTION_KEYS)[number]) {
  const map: Record<(typeof OPTION_KEYS)[number], string> = {
    A: q.option_a,
    B: q.option_b,
    C: q.option_c,
    D: q.option_d,
  };
  return map[letter];
}

export function AssessmentQuestionList({ questions, assessmentId: _assessmentId, moduleId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingQuestion, setEditingQuestion] = useState<AssessmentQuestionRecord | null>(null);

  const questionCount = questions.length;

  if (questions.length === 0) {
    return <p className="text-sm text-slate-500">Belum ada soal.</p>;
  }

  return (
    <>
      {/* Count badge */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            questionCount >= 10
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {questionCount} / 20 soal
        </span>
        {questionCount < 10 && (
          <span className="text-xs text-amber-700">
            (Minimal 10 soal diperlukan)
          </span>
        )}
      </div>

      <ol className="space-y-3">
        {questions.map((q, idx) => (
          <li
            key={q.id}
            className="rounded-md border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Question number + text */}
              <p className="text-sm font-semibold text-slate-900 flex-1 min-w-0">
                {idx + 1}. {q.question_text}
              </p>

              {/* Action buttons */}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(q)}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>

                <form
                  action={(formData) => {
                    if (!confirm("Hapus soal ini?")) return;
                    startTransition(async () => {
                      const result = await deleteQuestionAction(formData);
                      if (result && "error" in result && result.error) {
                        alert("Gagal hapus: " + result.error);
                      }
                    });
                  }}
                >
                  <input type="hidden" name="questionId" value={q.id} />
                  <input type="hidden" name="moduleId" value={moduleId} />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </form>
              </div>
            </div>

            {/* Options A–D */}
            <ul className="mt-3 space-y-1.5">
              {OPTION_KEYS.map((letter) => {
                const isCorrect = q.correct_option === letter;
                return (
                  <li
                    key={letter}
                    className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 text-sm ${
                      isCorrect
                        ? "bg-green-50 text-green-800"
                        : "text-slate-700"
                    }`}
                  >
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ${
                        isCorrect
                          ? "bg-green-600 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="flex-1">{optionValue(q, letter)}</span>
                    {isCorrect && (
                      <span className="shrink-0 text-xs font-semibold text-green-700">
                        ✓ Benar
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      {/* Edit modal */}
      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          moduleId={moduleId}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </>
  );
}
