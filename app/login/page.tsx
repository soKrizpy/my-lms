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
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50/70 via-sky-50/50 to-blue-100/60 dark:from-[#0c081c] dark:via-[#120e24] dark:to-[#1a1435] transition-colors duration-300 overflow-hidden">
      {/* Ambient Outer Glow Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[25%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-blue-400/20 dark:bg-purple-600/25 blur-[110px] animate-pulse"></div>
        <div className="absolute bottom-[15%] right-[25%] w-[300px] h-[300px] rounded-full bg-sky-300/20 dark:bg-indigo-600/20 blur-[100px]"></div>
      </div>

      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Main Container — Instagram Glassmorphism Style */}
      <div className="relative z-10 w-full max-w-[360px] space-y-3">
        {/* Primary Glass Card with Outer Glow */}
        <div className="bg-white/85 dark:bg-[#16102f]/80 backdrop-blur-xl backdrop-saturate-150 border border-white/80 dark:border-[rgba(168,85,247,0.35)] rounded-2xl p-7 sm:p-8 shadow-[0_12px_40px_rgba(37,99,235,0.14),0_0_24px_rgba(37,99,235,0.08)] dark:shadow-[0_12px_40px_rgba(168,85,247,0.25),0_0_30px_rgba(168,85,247,0.18)] transition-all">
          {/* Logo & Iconic Title */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="relative w-14 h-14 mb-3 drop-shadow-md">
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
            <h1 className="text-3xl font-black tracking-tight select-none font-sans drop-shadow-sm">
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
                className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-[#120e24]/80 backdrop-blur-sm border border-slate-200 dark:border-[#382b68] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-purple-400 focus:bg-white dark:focus:bg-[#181232] focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Kata Sandi / MPIN"
                required
                aria-label="Kata Sandi atau MPIN"
                className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-[#120e24]/80 backdrop-blur-sm border border-slate-200 dark:border-[#382b68] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-purple-400 focus:bg-white dark:focus:bg-[#181232] focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-purple-500/20 transition-all"
              />
            </div>

            {state?.error && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/90 p-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300 backdrop-blur-sm"
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
              className="w-full py-2.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] dark:bg-[#a855f7] dark:hover:bg-[#9333ea] dark:active:bg-[#7e22ce] text-white font-semibold text-xs rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-3 shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] dark:shadow-[0_4px_14px_rgba(168,85,247,0.35)] dark:hover:shadow-[0_6px_20px_rgba(168,85,247,0.45)] cursor-pointer"
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
            <div className="flex-1 border-t border-slate-200/80 dark:border-[#2f2358]"></div>
            <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">ATAU</span>
            <div className="flex-1 border-t border-slate-200/80 dark:border-[#2f2358]"></div>
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

        {/* Secondary Glass Card */}
        <div className="bg-white/85 dark:bg-[#16102f]/80 backdrop-blur-xl backdrop-saturate-150 border border-white/80 dark:border-[rgba(168,85,247,0.35)] rounded-2xl p-4 text-center shadow-[0_4px_20px_rgba(37,99,235,0.10)] dark:shadow-[0_4px_20px_rgba(168,85,247,0.18)] transition-all">
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
