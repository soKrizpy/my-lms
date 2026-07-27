"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function TopicList({ initialTopics, moduleId }: { initialTopics: any[], moduleId: string }) {
  const router = useRouter();
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [orderIndex, setOrderIndex] = useState<number | "">("");

  const handleEdit = (topic: any) => {
    setEditingTopic(topic);
    setTitle(topic.title);
    setDescription(topic.description || "");
    setProjectLink(topic.project_link || "");
    setOrderIndex(topic.order_index);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/modules/${moduleId}/topics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTopic.id,
          title,
          description,
          projectLink,
          orderIndex: Number(orderIndex)
        }),
      });
      if (res.ok) {
        setEditingTopic(null);
        router.refresh();
      } else {
        alert("Gagal mengubah topik.");
      }
    } catch {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus topik ini beserta semua kuis di dalamnya?")) return;
    try {
      const res = await fetch(`/api/modules/${moduleId}/topics?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Gagal menghapus topik.");
      }
    } catch {
      alert("Terjadi kesalahan.");
    }
  };

  if (!initialTopics || initialTopics.length === 0) {
    return <p className="text-sm text-slate-500">Belum ada topik untuk modul ini.</p>;
  }

  return (
    <>
      <ol className="space-y-2">
        {initialTopics.map((topic: any) => (
          <li key={topic.id} className="flex flex-col space-y-3 rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">
                {topic.order_index}. {topic.title}
              </span>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(topic)} className="text-slate-400 hover:text-blue-600 p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDelete(topic.id)} className="text-slate-400 hover:text-red-600 p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <Link href={`/admin/modules/${moduleId}/topics/${topic.id}/quiz`} className="text-sm font-medium text-slate-900 underline ml-2">
                  Kelola quiz
                </Link>
              </div>
            </div>

            {topic.description && (
              <div className="text-sm text-slate-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: topic.description }} />
            )}
            
            {topic.project_link && (
              <div>
                <a href={topic.project_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline">
                  <svg className="mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  Buka Project
                </a>
              </div>
            )}
          </li>
        ))}
      </ol>

      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Edit Topik</h2>
              <button onClick={() => setEditingTopic(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Judul Topik</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Urutan (Order)</label>
                <input type="number" required value={orderIndex} onChange={e => setOrderIndex(Number(e.target.value))} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Deskripsi / Iframe Embed</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Link Project</label>
                <input type="url" value={projectLink} onChange={e => setProjectLink(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingTopic(null)} className="px-3 py-2 text-sm text-slate-700 border rounded-md hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={loading || !title} className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
