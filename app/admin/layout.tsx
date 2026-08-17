// app/admin/layout.tsx

import React from "react";
import { logout } from "./actions";
import LogoutButton from "./components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-60 glass-panel border-r border-[var(--glass-border)] flex flex-col p-4 shadow-xl z-20">
        <div className="mb-8 px-1 flex items-center justify-between">
          <Logo size={32} showText={true} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary border border-brand-primary/30">Admin</span>
        </div>

        <nav className="flex flex-col gap-3 text-sm font-medium">
          <a
            href="/admin"
            className="px-4 py-2.5 rounded-xl hover:bg-brand-primary/20 hover:text-brand-primary transition-all hover:shadow-[0_0_10px_var(--color-primary-glow)]"
          >
            Dashboard
          </a>
          <a
            href="/admin/modules"
            className="px-4 py-2.5 rounded-xl hover:bg-brand-primary/20 hover:text-brand-primary transition-all hover:shadow-[0_0_10px_var(--color-primary-glow)]"
          >
            Modul
          </a>
          <a
            href="/admin/students"
            className="px-4 py-2.5 rounded-xl hover:bg-brand-primary/20 hover:text-brand-primary transition-all hover:shadow-[0_0_10px_var(--color-primary-glow)]"
          >
            Siswa
          </a>
          <a
            href="/admin/meetings"
            className="px-4 py-2.5 rounded-xl hover:bg-brand-primary/20 hover:text-brand-primary transition-all hover:shadow-[0_0_10px_var(--color-primary-glow)]"
          >
            Jadwal
          </a>
          <a
            href="/admin/invoices"
            className="px-4 py-2.5 rounded-xl hover:bg-brand-primary/20 hover:text-brand-primary transition-all hover:shadow-[0_0_10px_var(--color-primary-glow)]"
          >
            Invoice
          </a>
        </nav>

        <div className="mt-auto pt-4 border-t border-[var(--glass-border)] flex items-center justify-between">
          <LogoutButton />
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 z-10">
        <div className="max-w-5xl mx-auto glass-panel rounded-2xl shadow-lg p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
