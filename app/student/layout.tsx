// app/student/layout.tsx
// Server Component — authentication + role guard for the student area.
//
// Defence-in-depth: middleware handles unauthenticated redirects, but
// this layout provides server-side enforcement that the logged-in user
// is actually a student (or at minimum not an admin trying to snoop).

import React from "react";
import { redirect } from 'next/navigation';
import LogoutButton from "./LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { getSessionRole } from "@/lib/auth";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Role guard ─────────────────────────────────────────────────────────────
  const role = await getSessionRole();

  if (role === null) {
    // Not logged in → login page
    redirect('/login');
  }

  if (role === 'admin') {
    // Admin accidentally landed on /student → send to admin dashboard
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <header className="glass-panel sticky top-0 z-30 border-b border-[var(--glass-border)] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={34} showText={true} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/30">
              Student
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-6">
        {children}
      </main>
    </div>
  );
}
