// app/admin/modules/AddModuleForm.tsx
"use client";

import React, { useState } from "react";

interface AddModuleFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    level: string;
    gamification_type?: string;
  }) => Promise<void> | void;
}

export default function AddModuleForm({ onSubmit }: AddModuleFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("beginner");
  const [gamificationType, setGamificationType] = useState("mimo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({ name, description, level, gamification_type: gamificationType });
      setName("");
      setDescription("");
      setLevel("beginner");
      setGamificationType("mimo");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan modul. Silakan coba lagi.",
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Nama Modul
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Misal: Dasar Pemrograman"
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Deskripsi
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ringkasan singkat materi yang dibahas di modul ini."
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="level"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Level (Tingkat Kesulitan)
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          >
            <option value="beginner">Beginner (SD / Pemula)</option>
            <option value="intermediate">Intermediate (SMP / Menengah)</option>
            <option value="advance">Advance (SMA / Mahir)</option>
            <option value="master">Master (Expert)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="gamification_type"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Gamification Engine
          </label>
          <select
            id="gamification_type"
            value={gamificationType}
            onChange={(e) => setGamificationType(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          >
            <option value="mimo">🎯 Mimo (Bite-sized Lesson Path)</option>
            <option value="duolingo">💚 Duolingo (Hearts & Streak Skill Path)</option>
            <option value="boardgame">🎲 Boardgame (Tile Map Progression)</option>
            <option value="quest">⚔️ Quest (Mission & Boss Challenges)</option>
            <option value="flashcard">📇 Flashcard (Flip & Active Recall)</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setName("");
            setDescription("");
            setLevel("beginner");
            setGamificationType("mimo");
            setError(null);
          }}
          className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          disabled={isSubmitting}
        >
          Reset
        </button>

        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Modul"}
        </button>
      </div>
    </form>
  );
}
