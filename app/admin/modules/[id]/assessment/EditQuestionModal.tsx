"use client";

import { useActionState, useEffect } from "react";
import { updateQuestionAction } from "./actions";
import { AssessmentQuestionRecord } from "../../../../../lib/lmsData";

interface Props {
  question: AssessmentQuestionRecord;
  moduleId: string;
  onClose: () => void;
}

type ActionState = { error: string | null; fieldErrors: Record<string, string>; success: boolean };

const CORRECT_OPTIONS = ["A", "B", "C", "D"] as const;

export function EditQuestionModal({ question, moduleId, onClose }: Props) {
  const initialState: ActionState = { error: null, fieldErrors: {}, success: false };

  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await updateQuestionAction(formData);
      if ("error" in result) return { error: result.error, fieldErrors: {}, success: false };
      return { error: null, fieldErrors: {}, success: true };
    },
    initialState,
  );

  // Close modal on success
  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit soal assessment"
    >
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">Edit Soal</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto p-4">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="assessmentId" value={question.assessment_id} />
            <input type="hidden" name="moduleId" value={moduleId} />

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                ⚠️ {state.error}
              </div>
            )}

            {/* Question text */}
            <div>
              <label
                htmlFor="edit-question-text"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Teks Soal <span className="text-red-500">*</span>
              </label>
              <textarea
                id="edit-question-text"
                name="question_text"
                required
                rows={3}
                maxLength={500}
                defaultValue={question.question_text}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {state?.fieldErrors?.question_text && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors.question_text}</p>
              )}
            </div>

            {/* Options A–D */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(["a", "b", "c", "d"] as const).map((letter) => {
                const fieldName = `option_${letter}` as const;
                const defaultValue = question[fieldName as keyof AssessmentQuestionRecord] as string;
                return (
                  <div key={letter}>
                    <label
                      htmlFor={`edit-option-${letter}`}
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Pilihan {letter.toUpperCase()} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={`edit-option-${letter}`}
                      name={fieldName}
                      type="text"
                      required
                      maxLength={200}
                      defaultValue={defaultValue}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    {state?.fieldErrors?.[fieldName] && (
                      <p className="mt-1 text-xs text-red-600">{state.fieldErrors[fieldName]}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Correct option radio group */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">
                Jawaban Benar <span className="text-red-500">*</span>
              </legend>
              <div className="flex flex-wrap gap-3">
                {CORRECT_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-900 has-[:checked]:text-white"
                  >
                    <input
                      type="radio"
                      name="correct_option"
                      value={opt}
                      defaultChecked={question.correct_option === opt}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {state?.fieldErrors?.correct_option && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors.correct_option}</p>
              )}
            </fieldset>

            {/* Footer actions */}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
