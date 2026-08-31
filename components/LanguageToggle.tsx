'use client';

// components/LanguageToggle.tsx
// Language switcher button. Reads current locale from cookie,
// calls server action to flip locale, then refreshes the page.

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border transition-colors disabled:opacity-50
        bg-slate-800/60 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
      aria-label={currentLocale === 'id' ? 'Switch to English' : 'Switch to Indonesian'}
    >
      🌐 {label}
    </button>
  );
}
