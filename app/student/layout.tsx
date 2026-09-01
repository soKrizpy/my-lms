// app/student/layout.tsx
// "i18n without routing" pattern (next-intl 3.26.3).
// - Locale is read from cookie manually (same source as i18n/request.ts)
// - Messages are loaded via getMessages() which reads from i18n/request.ts
// - NextIntlClientProvider passes both to all client components in this subtree
import React from "react";
import LogoutButton from "./LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { cookies } from 'next/headers';
import { LanguageToggle } from '@/components/LanguageToggle';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  // Read locale from cookie — same logic as i18n/request.ts so they always agree
  const cookieStore = await cookies();
  const raw = cookieStore.get('locale')?.value;
  const locale = raw === 'en' ? 'en' : 'id';

  // getMessages() reads i18n/request.ts which also reads the same cookie
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        {/* Top navbar */}
        <header className="glass-panel sticky top-0 z-30 border-b border-[var(--glass-border)] shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size={34} showText={true} />
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/30">Student</span>
            </div>
            <div className="flex items-center gap-4">
              <LanguageToggle currentLocale={locale} />
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
