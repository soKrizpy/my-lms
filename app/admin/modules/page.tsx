// app/admin/modules/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import AdminToast, { type AdminNotice } from "../components/AdminToast";
import EditModuleModal from "./EditModuleModal";
import AssignModuleModal from "./AssignModuleModal";
import { CreateModuleModal } from "./CreateModuleModal";
import { EngineModal } from "@/components/EngineModal";
import {
  Plus,
  Search,
  BookOpen,
  Edit3,
  Trash2,
  UserCheck,
  Eye,
  ChevronRight,
  Layers,
  Sparkles,
  Filter,
} from "lucide-react";

interface TopicSummary {
  id: number;
  title: string;
  order_index: number;
  engine_topic_id?: string | null;
  status?: string | null;
}

interface Module {
  id: string;
  name: string;
  description: string | null;
  level: string;
  gamification_type?: string;
}

type FilterTab = "all" | "published" | "drafts";

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [topicMap, setTopicMap] = useState<Record<string, TopicSummary[]>>({});
  const [loading, setLoading] = useState(true);
  
  // UI Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [assigningModule, setAssigningModule] = useState<Module | null>(null);
  const [previewTopicId, setPreviewTopicId] = useState<string | null>(null);
  const [notice, setNotice] = useState<AdminNotice | null>(null);

  async function handleDeleteModule(id: string) {
    if (
      !confirm(
        "Yakin ingin menghapus modul ini beserta semua topik dan kuis di dalamnya?",
      )
    )
      return;
    try {
      const res = await fetch(`/api/modules?id=${id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(payload?.error || "Gagal menghapus modul.");
      }

      await loadModules();
      setNotice({ type: "success", text: "Modul berhasil dihapus." });
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
      });
    }
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

  const getEngineBadge = (type?: string) => {
    switch (type) {
      case "duolingo":
        return { label: "💚 Duolingo", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" };
      case "boardgame":
        return { label: "🎲 Boardgame", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800" };
      case "quest":
        return { label: "⚔️ Quest", cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800" };
      case "flashcard":
        return { label: "📇 Flashcard", cls: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-800" };
      case "mimo":
      default:
        return { label: "🎯 Mimo", cls: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800" };
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  // Filter & Search Logic
  const filteredModules = modules.filter((mod) => {
    const matchesSearch =
      mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mod.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    const topics = topicMap[mod.id] ?? [];
    const hasPublished = topics.some((t) => t.status === "published");

    if (filterTab === "published") return matchesSearch && hasPublished;
    if (filterTab === "drafts") return matchesSearch && !hasPublished;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* ── STICKY HEADER & BREADCRUMBS ─────────────────────────────────── */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-[var(--glass-border,#e2e8f0)] -mx-4 px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted,#64748b)] mb-1">
              <Link href="/admin" className="hover:text-[var(--accent,#3b82f6)] transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="font-semibold text-[var(--text-primary,#0f172a)]">Modules</span>
            </nav>
            <h1 className="text-xl font-bold text-[var(--text-primary,#0f172a)] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[var(--accent,#3b82f6)]" /> Kelola Modul Pembelajaran
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Module</span>
          </button>
        </div>
      </div>

      <AdminToast notice={notice} onDismiss={() => setNotice(null)} />

      {/* ── SEARCH & FILTER TABS ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3 rounded-2xl">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterTab === "all"
                ? "bg-white dark:bg-slate-900 text-[var(--text-primary,#0f172a)] shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            All ({modules.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("published")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterTab === "published"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Published
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("drafts")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterTab === "drafts"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Drafts
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari modul atau materi..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[var(--glass-border,#e2e8f0)] bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ── MODULE CARDS LIST ────────────────────────────────────────────── */}
      <section>
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Memuat modul pembelajaran...
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="py-12 text-center glass-panel rounded-2xl space-y-3 p-8">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {searchQuery ? "Modul tidak ditemukan" : "Belum ada modul terdaftar"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? "Coba gunakan kata kunci pencarian yang lain."
                : "Klik tombol '+ Create New Module' untuk memulai modul baru atau mengimpor template siap pakai."}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Buat Modul Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredModules.map((mod) => {
              const engineBadge = getEngineBadge(mod.gamification_type);
              const topics = topicMap[mod.id] ?? [];
              const publishedCount = topics.filter((t) => t.status === "published").length;
              const firstEngineTopicId = topics.find((t) => t.engine_topic_id)?.engine_topic_id ?? null;

              return (
                <div
                  key={mod.id}
                  className="glass-panel p-5 rounded-2xl border border-[var(--glass-border,#e2e8f0)] hover:border-[var(--accent,#3b82f6)]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2 flex-1">
                    {/* Header Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${engineBadge.cls}`}>
                        {engineBadge.label}
                      </span>

                      {mod.level && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {mod.level}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        <Layers className="w-3 h-3" /> {topics.length} Topik ({publishedCount} Published)
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary,#0f172a)] group-hover:text-blue-600 transition-colors">
                        {mod.name}
                      </h3>
                      {mod.description && (
                        <p className="text-xs text-[var(--text-muted,#64748b)] mt-0.5 line-clamp-2 leading-relaxed">
                          {mod.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                    {/* Preview as Student */}
                    {firstEngineTopicId && (
                      <button
                        type="button"
                        onClick={() => setPreviewTopicId(firstEngineTopicId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
                        title="Pratinjau tampilan siswa"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                        <span className="hidden md:inline">Preview</span>
                      </button>
                    )}

                    {/* Assign to Student */}
                    <button
                      type="button"
                      onClick={() => setAssigningModule(mod)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                      title="Assign ke siswa"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Assign</span>
                    </button>

                    {/* Edit Metadata */}
                    <button
                      type="button"
                      onClick={() => setEditingModule(mod)}
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                      title="Edit metadata modul"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      title="Hapus modul"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Open Builder / Editor */}
                    <Link
                      href={`/admin/modules/${mod.id}/topics?tab=topics`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity ml-1 shadow-sm"
                    >
                      <span>Edit & Build</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── CREATION CHOICE MODAL ──────────────────────────────────────── */}
      {showCreateModal && (
        <CreateModuleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadModules();
            setNotice({ type: "success", text: "Modul baru berhasil dibuat!" });
          }}
        />
      )}

      {/* ── EDIT METADATA MODAL ────────────────────────────────────────── */}
      {editingModule && (
        <EditModuleModal
          module={editingModule}
          onClose={() => setEditingModule(null)}
          onSuccess={() => {
            setEditingModule(null);
            loadModules();
            setNotice({ type: "success", text: "Modul berhasil diperbarui." });
          }}
        />
      )}

      {/* ── ASSIGN MODULE MODAL ────────────────────────────────────────── */}
      {assigningModule && (
        <AssignModuleModal
          module={assigningModule}
          onClose={() => setAssigningModule(null)}
          onSuccess={() => {
            setAssigningModule(null);
            setNotice({ type: "success", text: "Modul berhasil di-assign ke siswa." });
          }}
        />
      )}

      {/* ── STUDENT PREVIEW ENGINE MODAL ──────────────────────────────── */}
      {previewTopicId && (
        <EngineModal
          topicId={previewTopicId}
          studentId="teacher-preview-admin"
          lang="id"
          onClose={() => setPreviewTopicId(null)}
          onComplete={() => {}}
        />
      )}
    </div>
  );
}
