import { BUILT_IN_LESSONS } from "../../../../../lib/builtInLessons";
import { createTopicAction } from "./actions";

export function AddTopicForm({ moduleId }: { moduleId: string }) {
  return (
    <form
      action={createTopicAction}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="moduleId" value={moduleId} />

      <h2 className="text-sm font-semibold text-slate-900">
        Tambah Topik Baru
      </h2>

      <div>
        <label
          htmlFor="new-topic-title"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Judul Topik
        </label>
        <input
          id="new-topic-title"
          name="title"
          type="text"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="Contoh: Pengantar JavaScript"
        />
      </div>

      <div>
        <label
          htmlFor="new-topic-description"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Deskripsi Topik
        </label>
        <textarea
          id="new-topic-description"
          name="description"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="Contoh: Pada sesi ini kita akan..."
          rows={3}
        />
      </div>

      <div>
        <label
          htmlFor="new-topic-project-link"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Link Project
        </label>
        <input
          id="new-topic-project-link"
          name="projectLink"
          type="text"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="https://github.com/..."
        />
      </div>

      <div>
        <label
          htmlFor="new-topic-topic-link"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Embed Canva / Topic Link
        </label>
        <textarea
          id="new-topic-topic-link"
          name="topicLink"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="Paste kode embed iframe Canva di sini"
          rows={3}
        />
      </div>

      <div>
        <label
          htmlFor="new-topic-engine-topic-id"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Hubungkan ke Lesson Engine (Opsional)
        </label>
        <select
          id="new-topic-engine-topic-id"
          name="engineTopicId"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">— Tidak dihubungkan —</option>
          <optgroup label="HTML">
            {BUILT_IN_LESSONS.filter(l => l.category === 'HTML').map(l => (
              <option key={l.id} value={l.id}>{l.id} — {l.title}</option>
            ))}
          </optgroup>
          <optgroup label="CSS">
            {BUILT_IN_LESSONS.filter(l => l.category === 'CSS').map(l => (
              <option key={l.id} value={l.id}>{l.id} — {l.title}</option>
            ))}
          </optgroup>
          <optgroup label="JavaScript">
            {BUILT_IN_LESSONS.filter(l => l.category === 'JavaScript').map(l => (
              <option key={l.id} value={l.id}>{l.id} — {l.title}</option>
            ))}
          </optgroup>
        </select>
        <p className="mt-1 text-xs text-slate-500">Pilih lesson bawaan engine yang akan dibuka siswa saat klik "Mulai Belajar".</p>
      </div>

      <div>
        <label
          htmlFor="new-topic-order-index"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Urutan Topik (1, 2, 3, ...)
        </label>
        <input
          id="new-topic-order-index"
          name="orderIndex"
          type="number"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="Contoh: 1"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
      >
        Simpan Topik
      </button>
    </form>
  );
}
