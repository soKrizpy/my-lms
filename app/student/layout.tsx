import React from "react";
import LogoutButton from "./LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";

// Static imports — always bundled, cannot fail at runtime
import idMessages from "../../messages/id.json";
import enMessages from "../../messages/en.json";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read locale from cookie — default to 'id' if anything fails
  let locale = "id";
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("locale")?.value;
    if (raw === "en") locale = "en";
  } catch {
    // default to 'id'
  }

  const messages = locale === "en" ? enMessages : idMessages;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
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
