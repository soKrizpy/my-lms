'use client'

import { useActionState } from 'react'
import { login } from './actions'
import { ThemeToggle } from '@/components/ThemeToggle'

const initialState = {
  error: null as string | null,
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* CSS Orb Backgrounds */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-primary/20 blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[0%] -right-[10%] w-[60%] h-[60%] rounded-full bg-brand-secondary/20 blur-[150px] mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] mix-blend-screen"></div>
      </div>

      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 max-w-md w-full glass-panel rounded-3xl p-8 mx-4 shadow-[0_0_40px_rgba(124,58,237,0.15)] dark:shadow-[0_0_50px_rgba(124,58,237,0.25)] border-[1.5px] border-[var(--glass-border)] transition-shadow duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-brand-primary tracking-tight">Kelas Coding</h1>
          <p className="text-sm text-[var(--foreground)] mt-2 font-medium opacity-80">Masuk ke akun Anda</p>
        </div>

        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5 uppercase tracking-wide opacity-90">
              USERNAME (EMAIL / NO WA)
            </label>
            <input
              type="text"
              name="email"
              placeholder="e.g. 0812..."
              required
              className="w-full px-4 py-3.5 bg-blue-50/60 dark:bg-slate-100 border border-blue-200 dark:border-transparent text-slate-900 placeholder-slate-400 font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all glow-focus"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5 uppercase tracking-wide opacity-90">
              MPIN / PASSWORD
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="w-full px-4 py-3.5 bg-blue-50/60 dark:bg-slate-100 border border-blue-200 dark:border-transparent text-slate-900 placeholder-slate-400 font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all glow-focus"
            />
          </div>

          {state?.error && (
            <div className="p-3 bg-red-500/20 text-red-200 text-sm rounded-xl border border-red-500/30 backdrop-blur-md flex items-start gap-2">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{state.error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Masuk...
              </>
            ) : (
              'Masuk'
            )}
          </button>
          
          <div className="text-center mt-6">
            <p className="text-xs text-[var(--foreground)] opacity-70">
              Belum punya akun? Hubungi Admin untuk pendaftaran.
            </p>
          </div>
        </form>
      </div>

      <style>{`
        .glow-focus:focus {
          box-shadow: 0 0 15px var(--color-brand-primary);
        }
      `}</style>
    </div>
  )
}
