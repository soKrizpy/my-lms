"use client";

// app/admin/modules/[id]/ModuleTabShell.tsx
// Pure UI shell — no logic, no server actions.
// Receives the active tab as a prop (resolved by the Server Component parent
// from the page's searchParams prop — no useSearchParams needed here).
// Tab switching uses <Link> with scroll:false behaviour via router.replace.

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type TabId = "topics" | "quiz" | "assessment";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "topics",     label: "Topik",  emoji: "📚" },
  { id: "quiz",       label: "Quiz Topik", emoji: "🧩" },
  { id: "assessment", label: "Tryout", emoji: "📋" },
];

interface ModuleTabShellProps {
  moduleTitle: string;
  moduleDescription?: string | null;
  activeTab: TabId;
  tabs: {
    topics: React.ReactNode;
    quiz: React.ReactNode;
    assessment: React.ReactNode;
  };
}

export default function ModuleTabShell({
  moduleTitle,
  moduleDescription,
  activeTab,
  tabs,
}: ModuleTabShellProps) {
  const pathname = usePathname();

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary,#0f172a)]">
          {moduleTitle}
        </h1>
        {moduleDescription && (
          <p className="mt-1 text-sm text-[var(--text-secondary,#64748b)]">
            {moduleDescription}
          </p>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-[var(--glass-border,#e2e8f0)] bg-[var(--input-bg,#f8fafc)] p-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`${pathname}?tab=${tab.id}`}
              scroll={false}
              replace
              className={[
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                isActive
                  ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/30"
                  : "text-[var(--text-secondary,#64748b)] hover:bg-brand-primary/10 hover:text-brand-primary",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Tab content — only the active tab is rendered */}
      <div>{tabs[activeTab]}</div>
    </section>
  );
}
