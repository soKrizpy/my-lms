"use client";

import React, { useState } from "react";

export default function EditModuleModal({
  module,
  onClose,
  onSuccess,
}: {
  module: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(module.name || "");
  const [description, setDescription] = useState(module.description || "");
  const [level, setLevel] = useState(module.level || "beginner");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: module.id, name, description, level }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        alert("Gagal mengubah modul.");
      }
    } catch {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Edit Modul</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nama Modul</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Tingkat Kelas (Level)</label>
            <select value={level} onChange={e => setLevel(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option value="beginner">Beginner (SD / Pemula)</option>
              <option value="intermediate">Intermediate (SMP / Menengah)</option>
              <option value="advance">Advance (SMA / Mahir)</option>
              <option value="all">Semua Level</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Deskripsi Singkat</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-slate-700 border rounded-md hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={loading || !name} className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
