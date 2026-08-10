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
        className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>

      {/* Confirmation Modal */}
      {showConfirm && !isLoggingOut && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", animation: "fadeIn 0.2s ease-out" }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            style={{ animation: "scaleIn 0.2s ease-out" }}
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Yakin ingin keluar?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Kamu akan keluar dari sesi ini dan diarahkan ke halaman login.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors"
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
