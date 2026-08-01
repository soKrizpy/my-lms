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
          Deskripsi Topik / Slide Embed (Canva)
        </label>
        <textarea
          id="new-topic-description"
          name="description"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="Contoh: Pada sesi ini kita akan... atau paste kode embed iframe Canva di sini"
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
          type="url"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="https://github.com/..."
        />
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
