"use client";

import { useActionState } from "react";
import { BUILT_IN_LESSONS } from "../../../../../lib/builtInLessons";
import { createTopicAction } from "./actions";

interface Props {
  moduleId: string;
  /** engine_topic_ids already used by other topics — these are greyed out in the dropdown */
  usedEngineTopicIds?: string[];
}

type ActionState = { error: string | null; success: boolean };
const initialState: ActionState = { error: null, success: false };

export function AddTopicForm({ moduleId, usedEngineTopicIds = [] }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await createTopicAction(formData);
      if (!result) return { error: null, success: true };
      if ("error" in result && result.error) return { error: result.error, success: false };
      return { error: null, success: true };
    },
    initialState
  );

  const usedSet = new Set(usedEngineTopicIds);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
    >
      <input type="hidden" name="moduleId" value={moduleId} />

      <h2 className="text-base font-bold text-slate-900 dark:text-white">Tambah Topik Baru</h2>

      {/* Error banner */}
      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          ⚠️ {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          ✓ Topik berhasil ditambahkan.
        </div>
      )}

      <div>
        <label htmlFor="new-topic-title" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Judul Topik
        </label>
        <input
          id="new-topic-title"
          name="title"
          type="text"
          required
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="Contoh: Pengantar JavaScript"
        />
      </div>

      <div>
        <label htmlFor="new-topic-description" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Deskripsi Topik
        </label>
        <textarea
          id="new-topic-description"
          name="description"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="Contoh: Pada sesi ini kita akan..."
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="new-topic-project-link" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Link Project
        </label>
        <input
          id="new-topic-project-link"
          name="projectLink"
          type="text"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="https://github.com/..."
        />
      </div>

      <div>
        <label htmlFor="new-topic-topic-link" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Embed Canva / Topic Link
        </label>
        <textarea
          id="new-topic-topic-link"
          name="topicLink"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="Paste kode embed iframe Canva di sini"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="new-topic-engine-topic-id" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Hubungkan ke Lesson Engine (Opsional)
        </label>
        <select
          id="new-topic-engine-topic-id"
          name="engineTopicId"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">— Tidak dihubungkan —</option>
          {["HTML", "CSS", "JavaScript", "Scratch"].map((cat) => {
            const lessons = BUILT_IN_LESSONS.filter((l) => l.category === cat);
            if (lessons.length === 0) return null;
            return (
              <optgroup key={cat} label={cat}>
                {lessons.map((l) => {
                  const taken = usedSet.has(l.id);
                  return (
                    <option key={l.id} value={l.id} disabled={taken} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {l.id} — {l.title}{taken ? " (sudah dipakai)" : ""}
                    </option>
                  );
                })}
              </optgroup>
            );
          })}
        </select>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Pilih lesson bawaan engine yang akan dibuka siswa saat klik &quot;Mulai Belajar&quot;. ID yang sudah dipakai topik lain dinonaktifkan.
        </p>
      </div>

      <div>
        <label htmlFor="new-topic-order-index" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Urutan Topik (1, 2, 3, ...)
        </label>
        <input
          id="new-topic-order-index"
          name="orderIndex"
          type="number"
          required
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="Contoh: 1"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-60"
      >
        {isPending ? "Menyimpan..." : "Simpan Topik"}
      </button>
    </form>
  );
}
