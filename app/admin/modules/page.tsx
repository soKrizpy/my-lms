// app/admin/modules/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import AddModuleForm from "./AddModuleForm";

interface Module {
  id: string;
  name: string;
  description: string | null;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  async function createModule(data: { name: string; description: string }) {
    await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    // setelah berhasil, reload daftar modul
    await loadModules();
  }

  async function loadModules() {
    setLoading(true);
    const res = await fetch("/api/modules");
    const data = await res.json();
    setModules(data);
    setLoading(false);
  }

  useEffect(() => {
    loadModules();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Modul</h1>
        <p className="text-sm text-slate-600">
          Tambah dan kelola modul pembelajaran untuk LMS ini.
        </p>
      </header>

      <section className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h2 className="text-sm font-medium text-slate-900 mb-3">
          Tambah Modul Baru
        </h2>
        <AddModuleForm onSubmit={createModule} />
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="text-sm font-medium text-slate-900 mb-3">
          Daftar Modul
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">Memuat modul...</p>
        ) : modules.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada modul.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {modules.map((mod) => (
              <li key={mod.id} className="py-2">
                <p className="text-sm font-medium text-slate-900">{mod.name}</p>
                {mod.description && (
                  <p className="text-xs text-slate-600">{mod.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
