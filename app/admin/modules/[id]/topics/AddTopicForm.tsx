"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AddTopicForm({
  moduleId,
  onCreated,
}: {
  moduleId: string;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [orderIndex, setOrderIndex] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Judul topik wajib diisi.");
      return;
    }

    if (orderIndex === "" || Number.isNaN(Number(orderIndex))) {
      setErrorMsg("Urutan topik harus angka.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/modules/${moduleId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          orderIndex: Number(orderIndex),
          description: description.trim(),
          projectLink: projectLink.trim(),
        }),
      });
      const result = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMsg(result?.error || "Gagal menyimpan topik.");
        return;
      }

      setTitle("");
      setDescription("");
      setProjectLink("");
      setOrderIndex("");

      if (onCreated) {
        onCreated();
      }

      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        Tambah Topik Baru
      </h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Judul Topik
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="Contoh: Pengantar JavaScript"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Deskripsi Topik / Slide Embed (Canva)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="Contoh: Pada sesi ini kita akan... atau paste kode embed iframe Canva di sini"
          rows={3}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Link Project
        </label>
        <input
          type="url"
          value={projectLink}
          onChange={(e) => setProjectLink(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="https://github.com/..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Urutan Topik (1, 2, 3, ...)
        </label>
        <input
          type="number"
          value={orderIndex}
          onChange={(e) =>
            setOrderIndex(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          placeholder="Contoh: 1"
        />
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : "Simpan Topik"}
      </button>
    </form>
  );
}
