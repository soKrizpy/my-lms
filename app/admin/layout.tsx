// app/admin/layout.tsx

import React from "react";
import { logout } from "./actions";
import LogoutButton from "./components/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-60 glass-panel border-r border-[var(--glass-border)] flex flex-col p-4 shadow-xl z-20">
        <h2 className="text-xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Admin LMS</h2>

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
        </nav>

        <div className="mt-auto pt-4 border-t border-[var(--glass-border)]">
          <LogoutButton />
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
