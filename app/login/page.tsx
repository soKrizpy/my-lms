'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { login } from './actions'
import { ThemeToggle } from '@/components/ThemeToggle'

const initialState = {
  error: null as string | null,
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50/60 via-sky-50/40 to-blue-100/50 dark:from-[#0d091e] dark:via-[#120e24] dark:to-[#181232] transition-colors duration-300">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Main Container — Instagram Style */}
      <div className="w-full max-w-[360px] space-y-3">
        {/* Primary Instagram Card */}
        <div className="bg-white dark:bg-[#181232] border border-slate-200/80 dark:border-[#2f2358] rounded-2xl p-7 sm:p-8 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all">
          {/* Logo & Iconic Title */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="relative w-14 h-14 mb-3">
              <Image
                src="/b2blight.webp"
                alt="bits2bytes logo"
                width={56}
                height={56}
                className="dark:hidden object-contain"
                priority
              />
              <Image
                src="/b2bdark.webp"
                alt="bits2bytes logo"
                width={56}
                height={56}
                className="hidden dark:block object-contain"
                priority
              />
            </div>

            {/* Iconic bits2bytes Title: Light mode darkblue + lime green 2 | Dark mode white + lime green 2 */}
            <h1 className="text-3xl font-black tracking-tight select-none font-sans">
              <span className="text-[#0d2137] dark:text-white">bits</span>
              <span className="text-[#7cc62f]">2</span>
              <span className="text-[#0d2137] dark:text-white">bytes</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5">
              Masuk ke akun Anda
            </p>
          </div>

          {/* Instagram-style Form */}
          <form action={formAction} className="space-y-2.5">
            <div>
              <input
                type="text"
                name="email"
                placeholder="Nomor WhatsApp / Email"
                required
                aria-label="Nomor WhatsApp atau Email"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#120e24] border border-slate-200 dark:border-[#382b68] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-purple-400 focus:bg-white dark:focus:bg-[#181232] transition-all"
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Kata Sandi / MPIN"
                required
                aria-label="Kata Sandi atau MPIN"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#120e24] border border-slate-200 dark:border-[#382b68] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-purple-400 focus:bg-white dark:focus:bg-[#181232] transition-all"
              />
            </div>

            {state?.error && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              >
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{state.error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-3 shadow-sm cursor-pointer"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Instagram-style Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-slate-200 dark:border-[#2f2358]"></div>
            <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">ATAU</span>
            <div className="flex-1 border-t border-slate-200 dark:border-[#2f2358]"></div>
          </div>

          <div className="text-center">
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#2563eb] dark:text-purple-400 hover:underline"
            >
              Lupa Kata Sandi / MPIN?
            </a>
          </div>
        </div>

        {/* Secondary Card (Instagram style footer prompt) */}
        <div className="bg-white dark:bg-[#181232] border border-slate-200/80 dark:border-[#2f2358] rounded-2xl p-4 text-center shadow-sm">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Belum punya akun?{' '}
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#2563eb] dark:text-purple-400 hover:underline"
            >
              Hubungi Admin
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
