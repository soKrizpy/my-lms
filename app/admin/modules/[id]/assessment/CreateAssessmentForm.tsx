"use client";

import { useActionState } from "react";
import { createAssessmentAction } from "./actions";

interface Props {
  moduleId: string;
}

type ActionState = { error: string | null; success: boolean };
const initialState: ActionState = { error: null, success: false };

export function CreateAssessmentForm({ moduleId }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await createAssessmentAction(formData);
      if ("error" in result) return { error: result.error, success: false };
      return { error: null, success: true };
    },
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="moduleId" value={moduleId} />

      <h2 className="text-sm font-semibold text-slate-900">Buat Assessment Baru</h2>

      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠️ {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="assessment-title"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Judul Assessment
        </label>
        <input
          id="assessment-title"
          name="title"
          type="text"
          required
          maxLength={255}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="Contoh: Tryout Akhir Modul 1"
        />
        <p className="mt-1 text-xs text-slate-500">Maksimal 255 karakter.</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
      >
        {isPending ? "Menyimpan..." : "Buat Assessment"}
      </button>
    </form>
  );
}
