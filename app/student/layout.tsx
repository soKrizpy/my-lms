// app/student/layout.tsx
import React from "react";
import LogoutButton from "./LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { cookies } from 'next/headers';
import { LanguageToggle } from '@/components/LanguageToggle';

// Dynamically import NextIntlClientProvider to prevent top-level import errors
async function getNextIntlProvider() {
  try {
    const { NextIntlClientProvider: Provider } = await import('next-intl');
    return Provider;
  } catch (e) {
    console.error('[StudentLayout] Failed to dynamically import NextIntlClientProvider:', e);
    return null;
  }
}

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  console.log('[StudentLayout] Initializing layout');
  
  let locale = 'id';
  let messages: Record<string, any> = {};
  let NextIntlClientProvider: React.ComponentType<any> | null = null;

  // Step 1: Get NextIntlClientProvider
  console.log('[StudentLayout] Loading NextIntlClientProvider');
  try {
    NextIntlClientProvider = await getNextIntlProvider();
  } catch (error) {
    console.error('[StudentLayout] Error loading NextIntlClientProvider:', error);
  }

  // Step 2: Get locale from cookies
  console.log('[StudentLayout] Attempting to read locale from cookies');
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('locale')?.value;
    locale = raw === 'en' ? 'en' : 'id';
    console.log(`[StudentLayout] Locale from cookies: ${locale}`);
  } catch (error) {
    console.error('[StudentLayout] Error reading cookies:', error);
    // Continue with default locale 'id'
  }

  // Step 3: Load messages
  console.log(`[StudentLayout] Attempting to load messages for locale: ${locale}`);
  try {
    const module = await import(`../../messages/${locale}.json`);
    messages = module.default;
    console.log(`[StudentLayout] Successfully loaded ${locale} messages`);
  } catch (importError) {
    console.error(`[StudentLayout] Failed to import messages for locale '${locale}':`, importError);
    
    // Fallback to ID messages
    console.log('[StudentLayout] Attempting fallback to id.json');
    try {
      const fallbackModule = await import(`../../messages/id.json`);
      messages = fallbackModule.default;
      console.log('[StudentLayout] Successfully loaded fallback id.json messages');
    } catch (fallbackError) {
      console.error('[StudentLayout] Failed to import fallback id.json:', fallbackError);
      messages = {};
      console.warn('[StudentLayout] Using empty messages object - translations will not be available');
    }
  }

  // Step 4: Validate locale and messages before rendering
  console.log('[StudentLayout] Validating locale and messages');
  if (typeof locale !== 'string' || !locale) {
    console.warn('[StudentLayout] Invalid locale, resetting to default');
    locale = 'id';
  }
  if (typeof messages !== 'object' || messages === null) {
    console.warn('[StudentLayout] Invalid messages object, resetting to empty');
    messages = {};
  }
  console.log(`[StudentLayout] Final state - locale: ${locale}, messages keys: ${Object.keys(messages).length}`);

  // Step 5: Build layout content
  const layoutContent = (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
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
  );

  // Step 6: Wrap with NextIntlClientProvider if available and valid
  if (NextIntlClientProvider && typeof locale === 'string' && locale && typeof messages === 'object' && messages !== null) {
    console.log('[StudentLayout] Rendering with NextIntlClientProvider');
    try {
      return (
        <NextIntlClientProvider locale={locale} messages={messages}>
          {layoutContent}
        </NextIntlClientProvider>
      );
    } catch (providerError) {
      console.error('[StudentLayout] Error rendering with NextIntlClientProvider:', providerError);
      console.log('[StudentLayout] Falling back to layout without provider');
      return layoutContent;
    }
  } else {
    if (!NextIntlClientProvider) {
      console.log('[StudentLayout] NextIntlClientProvider not available, rendering layout directly');
    } else {
      console.log('[StudentLayout] Invalid locale or messages, rendering layout without provider');
    }
    return layoutContent;
  }
}
