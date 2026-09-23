"use client";

// app/admin/modules/[id]/ModuleTabShell.tsx
// Header & Tab Shell for the Module Editor / Builder with Back Navigation,
// Breadcrumbs, Gamification Style Selector, and Tab Navigation.

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Layers, Eye, Sparkles, Check, ChevronRight } from "lucide-react";
import { EngineModal } from "@/components/EngineModal";

export type TabId = "topics" | "quiz" | "assessment";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "topics",     label: "Topik & Alur Belajar",  emoji: "📚" },
  { id: "quiz",       label: "Quiz Topik", emoji: "🧩" },
  { id: "assessment", label: "Tryout Evaluasi", emoji: "📋" },
];

interface ModuleTabShellProps {
  moduleId: string;
  moduleTitle: string;
  moduleDescription?: string | null;
  moduleLevel?: string | null;
  gamificationType?: string | null;
  firstTopicEngineId?: string | null;
  activeTab: TabId;
  tabs: {
    topics: React.ReactNode;
    quiz: React.ReactNode;
    assessment: React.ReactNode;
  };
}

export default function ModuleTabShell({
  moduleId,
  moduleTitle,
  moduleDescription,
  moduleLevel,
  gamificationType: initialGamificationType,
  firstTopicEngineId,
  activeTab,
  tabs,
}: ModuleTabShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [gamificationType, setGamificationType] = useState<string>(
    initialGamificationType || "mimo"
  );
  const [updatingEngine, setUpdatingEngine] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  async function handleGamificationChange(newType: string) {
    setGamificationType(newType);
    setUpdatingEngine(true);
    try {
      const res = await fetch("/api/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: moduleId,
          name: moduleTitle,
          description: moduleDescription,
          level: moduleLevel || "beginner",
          gamification_type: newType,
        }),
      });
      if (res.ok) {
        setToastMessage("Engine Style diperbarui!");
        setTimeout(() => setToastMessage(null), 3000);
        router.refresh();
      }
    } catch {
      console.error("Failed to update gamification style");
    } finally {
      setUpdatingEngine(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* ── STICKY BUILDER HEADER ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-[var(--glass-border,#e2e8f0)] -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Back Button & Breadcrumbs */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/admin/modules"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Modules</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted,#64748b)]">
                <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
                <span>/</span>
                <Link href="/admin/modules" className="hover:text-blue-600">Modules</Link>
                <span>/</span>
                <span className="font-semibold text-[var(--text-primary,#0f172a)] truncate max-w-[180px]">
                  {moduleTitle}
                </span>
              </nav>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--text-primary,#0f172a)]">
                {moduleTitle}
              </h1>

              {moduleLevel && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 border text-slate-700 dark:text-slate-300">
                  {moduleLevel}
                </span>
              )}
            </div>
          </div>

          {/* Right: Controls (Gamification Selector + Preview as Student) */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Toast notice */}
            {toastMessage && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 animate-pulse">
                ✓ {toastMessage}
              </span>
            )}

            {/* Gamification Style Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 ml-1.5" />
              <select
                value={gamificationType}
                disabled={updatingEngine}
                onChange={(e) => handleGamificationChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-[var(--text-primary,#0f172a)] focus:outline-none pr-1 cursor-pointer"
              >
                <option value="mimo">🎯 Mimo Engine</option>
                <option value="duolingo">💚 Duolingo Engine</option>
                <option value="boardgame">🎲 Boardgame Engine</option>
                <option value="quest">⚔️ Quest Engine</option>
                <option value="flashcard">📇 Flashcard Engine</option>
              </select>
            </div>

            {/* Preview as Student */}
            {firstTopicEngineId && (
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Preview as Student</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── TAB BAR ─────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 rounded-2xl border border-[var(--glass-border,#e2e8f0)] bg-slate-100/50 dark:bg-slate-800/40 p-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`${pathname}?tab=${tab.id}`}
              scroll={false}
              replace
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all",
                isActive
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                  : "text-[var(--text-secondary,#64748b)] hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-[var(--text-primary,#0f172a)]",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────────────── */}
      <div>{tabs[activeTab]}</div>

      {/* ── STUDENT PREVIEW MODAL ────────────────────────────────────── */}
      {showPreviewModal && firstTopicEngineId && (
        <EngineModal
          topicId={firstTopicEngineId}
          studentId="teacher-preview-admin"
          lang="id"
          onClose={() => setShowPreviewModal(false)}
          onComplete={() => {}}
        />
      )}
    </section>
  );
}
