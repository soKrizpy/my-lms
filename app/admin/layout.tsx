"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from '@/components/LanguageToggle';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  Receipt,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Read locale from cookie for language toggle
  const locale = typeof document !== 'undefined'
    ? document.cookie.split('; ').find(r => r.startsWith('locale='))?.split('=')[1] ?? 'id'
    : 'id';

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Modul", href: "/admin/modules", icon: BookOpen },
    { label: "Siswa", href: "/admin/students", icon: Users },
    { label: "Jadwal", href: "/admin/meetings", icon: Calendar },
    { label: "Invoice", href: "/admin/invoices", icon: Receipt },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 glass-panel border-b border-[var(--glass-border)] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Logo size={30} showText={true} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle currentLocale={locale} />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 glass-panel border-r border-[var(--glass-border)] flex-col p-5 shadow-xl z-20 sticky top-0 h-screen">
        <div className="mb-8 px-1 flex items-center justify-between">
          <Logo size={34} showText={true} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
            Admin
          </span>
        </div>

        <nav className="flex flex-col gap-2 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                  active
                    ? "bg-brand-primary/20 text-brand-primary font-bold shadow-[0_0_12px_var(--color-primary-glow)] border border-brand-primary/30"
                    : "hover:bg-brand-primary/10 hover:text-brand-primary text-slate-400 hover:text-slate-100"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-brand-primary" : "opacity-70"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-[var(--glass-border)] flex items-center justify-between">
          <LogoutButton />
          <LanguageToggle currentLocale={locale} />
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content Container */}
      <main className="flex-1 p-4 md:p-8 z-10 pb-28 md:pb-8">
        <div className="max-w-5xl mx-auto glass-panel rounded-2xl shadow-lg p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Floating Bottom Nav Dock */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 glass-panel rounded-2xl p-1.5 flex items-center justify-around shadow-2xl border border-[var(--glass-border)] bg-slate-900/85 backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${
                active
                  ? "text-brand-primary font-bold scale-105"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-brand-primary animate-pulse" : "opacity-80"}`} />
              <span className="text-[10px] mt-1 tracking-tight font-medium">{item.label}</span>

              {/* Active Indicator Glow Pill */}
              {active && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-brand-primary shadow-[0_0_8px_var(--color-brand-primary)]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
