'use client';

// components/EngineModal.tsx
// Full-screen iframe modal for the Bits2Bytes Lesson Engine.
//
// — Inherits dark/light theme from LMS via CSS variables on <body>
// — Passes studentId, theme, lang, lmsOrigin to engine via URL params
// — Listens for LESSON_COMPLETE postMessage → calls onComplete then schedules close
// — "Kembali / Back to Dashboard" header button with guard for mid-lesson exit
// — Uses CSS variables from globals.css so it matches light AND dark mode automatically

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface EngineModalProps {
  /** engine_topic_id, e.g. "beginner-html-01" */
  topicId: string;
  /** Supabase auth user.id */
  studentId: string;
  /** Locale from LMS cookie: 'id' | 'en' */
  lang: string;
  onClose: () => void;
  /** Called when engine fires LESSON_COMPLETE. Modal auto-closes after 3.5 s delay. */
  onComplete: (topicId: string) => void;
}

export function EngineModal({ topicId, studentId, lang, onClose, onComplete }: EngineModalProps) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'light' ? 'light' : 'dark';
  const [isCompleted, setIsCompleted] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build iframe URL via same-origin rewrite: /learning/* → engine
  // All params are passed as query string so engine can read them via useUrlParams()
  const engineUrl =
    `/learning/lesson/${encodeURIComponent(topicId)}` +
    `?studentId=${encodeURIComponent(studentId)}` +
    `&theme=${theme}` +
    `&lang=${encodeURIComponent(lang)}` +
    `&lmsOrigin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`;

  // Listen for postMessage events from the engine (same-origin via proxy rewrite)
  useEffect(() => {
    function handleMessage(raw: MessageEvent) {
      // Same-origin only — the rewrite makes /learning/* same-origin
      if (raw.origin !== window.location.origin) return;
      const data = raw.data as {
        source?: string;
        type?: string;
        topicId?: string;
      };
      if (!data || data.source !== 'bits2bytes-lesson-engine') return;

      if (data.type === 'LESSON_COMPLETE') {
        setIsCompleted(true);
        onComplete(topicId);
        // Give the achievement screen inside the engine 3.5 s to render, then close
        closeTimerRef.current = setTimeout(() => {
          onClose();
        }, 3500);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [topicId, onClose, onComplete]);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleClose = useCallback(() => {
    if (isCompleted) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      onClose();
      return;
    }
    const confirmMsg =
      lang === 'en'
        ? 'Leave this lesson? Your progress in this session will be saved locally.'
        : 'Keluar dari lesson? Progress sesi ini sudah tersimpan secara lokal.';
    if (window.confirm(confirmMsg)) {
      onClose();
    }
  }, [isCompleted, lang, onClose]);

  // Keyboard: Escape key triggers guarded close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  const backLabel = lang === 'en' ? 'Back to Dashboard' : 'Kembali ke Dashboard';
  const completedLabel = lang === 'en' ? 'Completed!' : 'Selesai!';
  const loadingLabel = lang === 'en' ? 'Loading lesson…' : 'Memuat lesson…';

  return (
    /* Full-screen overlay — z-50 sits above student page content */
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--background)' }}
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'en' ? 'Lesson Engine' : 'Mesin Belajar'}
    >
      {/* ── Thin header bar ─────────────────────────────────────────── */}
      <header
        className="flex-shrink-0 h-11 flex items-center justify-between px-4 gap-3 border-b"
        style={{
          background: 'var(--glass-bg)',
          borderColor: 'var(--glass-border)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Back button */}
        <button
          onClick={handleClose}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-2 rounded"
          style={{ color: 'var(--text-muted)' }}
          aria-label={backLabel}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">{backLabel}</span>
        </button>

        {/* Centre: brand + topic id */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-xs font-black uppercase tracking-widest hidden sm:inline"
            style={{ color: 'var(--accent)' }}
          >
            BITS2BYTES
          </span>
          <span
            className="text-[11px] font-mono truncate max-w-[140px] sm:max-w-[220px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {topicId}
          </span>
        </div>

        {/* Right: status badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isCompleted ? (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border"
              style={{
                background: 'rgba(16,185,129,0.15)',
                borderColor: 'rgba(16,185,129,0.35)',
                color: 'var(--success)',
              }}
            >
              ✓ {completedLabel}
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
              style={{
                background: 'var(--glass-bg)',
                borderColor: 'var(--glass-border)',
                color: 'var(--text-muted)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--accent)' }}
                aria-hidden="true"
              />
              {lang === 'en' ? 'In Progress' : 'Sedang Belajar'}
            </span>
          )}
        </div>
      </header>

      {/* ── Loading skeleton shown until iframe fires onLoad ─────────── */}
      {!iframeLoaded && (
        <div
          className="flex-shrink-0 flex items-center justify-center gap-3 py-4 text-sm"
          style={{ color: 'var(--text-muted)', background: 'var(--background)' }}
          aria-live="polite"
        >
          <span
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            aria-hidden="true"
          />
          {loadingLabel}
        </div>
      )}

      {/* ── Engine iframe — fills all remaining space ─────────────────── */}
      <iframe
        src={engineUrl}
        title={lang === 'en' ? 'Lesson Engine' : 'Mesin Belajar'}
        className="flex-1 w-full border-0"
        allow="fullscreen"
        loading="eager"
        onLoad={() => setIframeLoaded(true)}
        style={{ display: 'block' }}
      />
    </div>
  );
}
