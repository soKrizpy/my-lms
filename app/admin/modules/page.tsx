// app/admin/modules/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import AddModuleForm from "./AddModuleForm";

interface TopicSummary {
  id: number;
  title: string;
  order_index: number;
}

interface Module {
  id: string;
  name: string;
  description: string | null;
  level: string;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [topicMap, setTopicMap] = useState<Record<string, TopicSummary[]>>({});
  const [loading, setLoading] = useState(true);

  async function createModule(data: { name: string; description: string; level: string }) {
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
    try {
      const res = await fetch("/api/modules");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Gagal memuat modul.");
      }

      setModules(data);

      const topicResults = await Promise.all(
        data.map(async (mod: Module) => {
          const topicRes = await fetch(`/api/modules/${mod.id}/topics`);
          const topics = topicRes.ok ? await topicRes.json() : [];
          return [mod.id, topics] as const;
        }),
      );

      const nextTopicMap = Object.fromEntries(topicResults) as Record<
        string,
        TopicSummary[]
      >;
      setTopicMap(nextTopicMap);
    } catch (err) {
      console.error(err);
      setModules([]);
      setTopicMap({});
    } finally {
      setLoading(false);
    }
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
              <li
                key={mod.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-slate-900">
                      {mod.name}
                    </p>
                    {mod.level && (
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${
                          mod.level === "beginner"
                            ? "bg-green-50 text-green-700 ring-green-600/20"
                            : mod.level === "intermediate"
                              ? "bg-orange-50 text-orange-700 ring-orange-600/20"
                              : mod.level === "advance"
                                ? "bg-red-50 text-red-700 ring-red-600/20"
                                : "bg-blue-50 text-blue-700 ring-blue-700/10"
                        }`}
                      >
                        {mod.level}
                      </span>
                    )}
                  </div>
                  {mod.description && (
                    <p className="text-xs text-slate-600">{mod.description}</p>
                  )}

                  <details className="mt-3 group rounded-md border border-slate-200 bg-slate-50 p-3">
                    <summary className="flex cursor-pointer items-center justify-between list-none outline-none">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <svg className="h-4 w-4 transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                        Lihat Topik
                      </p>
                      <Link
                        href={`/admin/modules/${mod.id}/topics`}
                        className="text-xs font-semibold text-slate-900 underline"
                      >
                        Kelola semua
                      </Link>
                    </summary>

                    <div className="mt-3">
                      {(topicMap[mod.id] ?? []).length === 0 ? (
                        <p className="text-sm text-slate-500">Belum ada topik.</p>
                      ) : (
                        <ul className="space-y-2">
                          {(topicMap[mod.id] ?? []).map((topic) => (
                            <li
                              key={topic.id}
                              className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2"
                            >
                              <span className="text-sm text-slate-700">
                                {topic.order_index}. {topic.title}
                              </span>
                              <Link
                                href={`/admin/modules/${mod.id}/topics/${topic.id}/quiz`}
                                className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                              >
                                Open quiz
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
