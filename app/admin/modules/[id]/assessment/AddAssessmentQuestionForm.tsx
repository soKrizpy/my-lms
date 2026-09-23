"use client";

import { useActionState, useRef, useEffect } from "react";
import { addQuestionAction } from "./actions";

interface Props {
  assessmentId: number;
  moduleId: string;
  disabled: boolean;
}

type FieldErrors = Record<string, string>;
type ActionState = { error: string | null; fieldErrors: FieldErrors; success: boolean };
const initialState: ActionState = { error: null, fieldErrors: {}, success: false };

const CORRECT_OPTIONS = ["A", "B", "C", "D"] as const;

export function AddAssessmentQuestionForm({ assessmentId, moduleId, disabled }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await addQuestionAction(formData);
      if ("error" in result) {
        // The action returns a single joined error string — split back to field errors
        // if needed, but for now surface as a top-level error.
        return { error: result.error, fieldErrors: {}, success: false };
      }
      return { error: null, fieldErrors: {}, success: true };
    },
    initialState,
  );

  // Reset form on success
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  if (disabled) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-white">Tambah Soal</h2>
        <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
          ⚠️ Batas 20 soal tercapai. Hapus soal yang ada untuk menambah soal baru.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
    >
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <input type="hidden" name="moduleId" value={moduleId} />

      <h2 className="text-base font-bold text-slate-900 dark:text-white">Tambah Soal Baru</h2>

      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠️ {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          ✓ Soal berhasil ditambahkan.
        </div>
      )}

      {/* Question text */}
      <div>
        <label
          htmlFor="add-question-text"
          className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          Teks Soal <span className="text-red-500">*</span>
        </label>
        <textarea
          id="add-question-text"
          name="question_text"
          required
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="Tuliskan pertanyaan di sini... (maks. 500 karakter)"
        />
        {state?.fieldErrors?.question_text && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.question_text}</p>
        )}
      </div>

      {/* Options A–D */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {(["a", "b", "c", "d"] as const).map((letter) => (
          <div key={letter}>
            <label
              htmlFor={`add-option-${letter}`}
              className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Pilihan {letter.toUpperCase()} <span className="text-red-500">*</span>
            </label>
            <input
              id={`add-option-${letter}`}
              name={`option_${letter}`}
              type="text"
              required
              maxLength={200}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder={`Pilihan ${letter.toUpperCase()}`}
            />
            {state?.fieldErrors?.[`option_${letter}`] && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors[`option_${letter}`]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Correct option radio group */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Jawaban Benar <span className="text-red-500">*</span>
        </legend>
        <div className="flex flex-wrap gap-3">
          {CORRECT_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-600 has-[:checked]:text-white transition-colors"
            >
              <input
                type="radio"
                name="correct_option"
                value={opt}
                defaultChecked={opt === "A"}
                className="sr-only"
              />
              {opt}
            </label>
          ))}
        </div>
        {state?.fieldErrors?.correct_option && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.correct_option}</p>
        )}
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Menyimpan..." : "Simpan Soal"}
      </button>
    </form>
  );
}
