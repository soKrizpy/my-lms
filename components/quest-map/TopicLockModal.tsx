'use client';

import React, { useEffect } from 'react';
import type { TopicNodeTopic } from './TopicNode';

interface TopicLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: TopicNodeTopic | null;
  moduleTitle?: string;
  nodeIndex?: number;
  onGoToSchedule?: () => void;
}

export function TopicLockModal({
  isOpen,
  onClose,
  topic,
  moduleTitle,
  nodeIndex = 0,
  onGoToSchedule,
}: TopicLockModalProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !topic) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          background: 'var(--glass-bg, #0f172a)',
          borderColor: 'var(--glass-border, rgba(255, 255, 255, 0.1))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="relative p-6 text-center border-b border-[var(--glass-border)] bg-gradient-to-b from-amber-500/15 via-transparent to-transparent">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Tutup modal"
          >
            ✕
          </button>

          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse">
            🔒
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold tracking-wide uppercase mb-2">
            <span>Materi Terkunci</span>
          </div>

          <h3
            id="lock-modal-title"
            className="text-lg sm:text-xl font-black text-white leading-tight"
          >
            {nodeIndex + 1}. {topic.title}
          </h3>

          {moduleTitle && (
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Bagian dari {moduleTitle}
            </p>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-left">
          {topic.description ? (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Tentang Topik Ini:
              </p>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                {topic.description.replace(/<[^>]*>?/gm, '')}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-slate-300 leading-relaxed">
                Materi seru dan tantangan koding menunggumu di topik ini!
              </p>
            </div>
          )}

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-start gap-3">
            <span className="text-xl flex-shrink-0" aria-hidden="true">💡</span>
            <div className="text-xs leading-relaxed text-blue-200">
              <span className="font-bold text-blue-100 block mb-0.5">Cara Membuka Topik Ini:</span>
              Ikuti sesi kelas belajarmu dan klik tombol <span className="font-bold text-white">"Bergabung Sekarang"</span> di tab Jadwal Belajar. Topik akan otomatis terbuka!
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--glass-border)] bg-black/20 flex flex-col sm:flex-row gap-2.5">
          {onGoToSchedule && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToSchedule();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-primary/30 cursor-pointer"
            >
              <span>📅</span>
              <span>Buka Jadwal Belajar</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
