// app/admin/modules/AddModuleForm.tsx
"use client";

import React, { useState } from "react";

interface AddModuleFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    level: string;
  }) => Promise<void> | void;
}

export default function AddModuleForm({ onSubmit }: AddModuleFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("beginner");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({ name, description, level });
      setName("");
      setDescription("");
      setLevel("beginner");
    } catch (err) {
      setError("Gagal menyimpan modul. Silakan coba lagi.");
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
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advance">Advance</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setName("");
            setDescription("");
            setLevel("beginner");
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
