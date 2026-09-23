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
  const [gamificationType, setGamificationType] = useState(
    module.gamification_type || "mimo",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: module.id,
          name,
          description,
          level,
          gamification_type: gamificationType,
        }),
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(payload?.error || "Gagal mengubah modul.");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Modul</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nama Modul
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tingkat Kelas (Level)
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="beginner" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Beginner (SD / Pemula)</option>
              <option value="intermediate" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                Intermediate (SMP / Menengah)
              </option>
              <option value="advance" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Advance (SMA / Mahir)</option>
              <option value="master" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Master (Expert)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Gamification Engine
            </label>
            <select
              value={gamificationType}
              onChange={(e) => setGamificationType(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="mimo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🎯 Mimo (Bite-sized Lesson Path)</option>
              <option value="duolingo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">💚 Duolingo (Hearts & Streak Skill Path)</option>
              <option value="boardgame" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🎲 Boardgame (Tile Map Progression)</option>
              <option value="quest" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">⚔️ Quest (Mission & Boss Challenges)</option>
              <option value="flashcard" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">📇 Flashcard (Flip & Active Recall)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Deskripsi Singkat
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !name}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
