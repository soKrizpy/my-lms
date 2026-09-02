'use client';

// components/LanguageToggle.tsx
// Language switcher button. Reads current locale from cookie,
// calls server action to flip locale, then refreshes the page.

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { setLocale } from '@/app/actions/locale';

interface LanguageToggleProps {
  currentLocale: string;
}

export function LanguageToggle({ currentLocale }: LanguageToggleProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const nextLocale = currentLocale === 'id' ? 'en' : 'id';
  const label = currentLocale === 'id' ? 'EN' : 'ID';

  function handleToggle() {
    startTransition(async () => {
      await setLocale(nextLocale as 'id' | 'en');
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={currentLocale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      aria-label={currentLocale === 'id' ? 'Switch to English' : 'Switch to Indonesian'}
      className="relative flex items-center justify-center w-9 h-9 rounded-full glass-panel hover:bg-black/10 transition-colors border border-[var(--glass-border)] cursor-pointer disabled:opacity-50"
    >
      <Globe className="w-4 h-4" />
      {/* locale badge */}
      <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-[14px] h-[14px] rounded-full bg-[var(--brand-primary,#6366f1)] text-white text-[8px] font-bold leading-none">
        {label}
      </span>
    </button>
  );
}
