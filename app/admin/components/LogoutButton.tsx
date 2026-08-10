"use client";

import React, { useState, useTransition } from "react";
import { logout } from "../actions";

export default function LogoutButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setIsLoggingOut(true);
    // small delay so the full-screen overlay animates in before redirect
    setTimeout(() => {
      startTransition(() => {
        logout();
      });
    }, 600);
  };

  return (
    <>
      {/* Logout trigger button */}
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Keluar
      </button>

      {/* Confirmation Modal */}
      {showConfirm && !isLoggingOut && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
          style={{ animation: "fadeIn 0.2s ease-out" }}
        >
          <div
            className="glass-panel rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full max-w-sm p-6 text-center border border-[var(--glass-border)]"
            style={{ animation: "scaleIn 0.2s ease-out" }}
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 glow-primary" style={{boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'}}>
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Yakin ingin keluar?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Kamu akan keluar dari sesi ini dan diarahkan ke halaman login.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-[var(--glass-border)] text-sm font-semibold text-[var(--foreground)] hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-lg bg-red-500/80 hover:bg-red-500 border border-red-500 text-sm font-semibold text-white transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen logout animation overlay */}
      {isLoggingOut && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900"
          style={{ animation: "fadeIn 0.4s ease-out" }}
        >
          <div className="flex flex-col items-center gap-5">
            {/* Animated logo / spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
              <div
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400"
                style={{ animation: "spin 0.8s linear infinite" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-base">Keluar...</p>
              <p className="text-slate-400 text-sm mt-1">Mengakhiri sesi kamu</p>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.93); } to { opacity: 1; transform: scale(1); } }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}

      {/* Shared keyframes for the modal (also needed when overlay not shown) */}
      {!isLoggingOut && (
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.93); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      )}
    </>
  );
}
