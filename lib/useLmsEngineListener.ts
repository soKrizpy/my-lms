'use client';

// lib/useLmsEngineListener.ts
// Listens for postMessage events from bits2bytes-lesson-engine.
// Use this hook in StudentDashboard.
//
// Origin validation: accepts events only from the configured Lesson Engine origin.
// Falls back to same-origin (window.location.origin) when NEXT_PUBLIC_LESSON_ENGINE_URL
// is not set — this covers local development where the proxy makes both same-origin.

import { useEffect } from 'react';

interface LmsEvent {
  source: string;
  type: 'LESSON_COMPLETE' | 'QUIZ_SUBMITTED' | 'XP_UPDATE';
  topicId: string;
  studentId: string | null;
  payload: Record<string, unknown>;
  sentAt: string;
}

interface UseLmsEngineListenerOptions {
  onEvent?: (event: LmsEvent) => void;
  onSynced?: (topicId: string, type: LmsEvent['type']) => void;
}

export function useLmsEngineListener(options: UseLmsEngineListenerOptions = {}) {
  useEffect(() => {
    // Resolve the allowed origin once per mount.
    // NEXT_PUBLIC_LESSON_ENGINE_URL may be a full URL like https://engine.bits2bytes.id
    // — extract just the origin so sub-paths or trailing slashes are normalised.
    const rawEngineUrl = process.env.NEXT_PUBLIC_LESSON_ENGINE_URL;
    let allowedOrigin: string;
    try {
      allowedOrigin = rawEngineUrl
        ? new URL(rawEngineUrl).origin
        : window.location.origin;
    } catch {
      // If the env var is malformed, fall back to same-origin for safety.
      allowedOrigin = window.location.origin;
    }

    async function handleMessage(raw: MessageEvent) {
      // Reject events from any origin that is not the configured Lesson Engine.
      // Never accept '*'.
      if (raw.origin !== allowedOrigin) return;

      const data = raw.data as LmsEvent;
      if (!data || data.source !== 'bits2bytes-lesson-engine') return;
      if (!['LESSON_COMPLETE', 'QUIZ_SUBMITTED', 'XP_UPDATE'].includes(data.type)) return;

      options.onEvent?.(data);

      // XP_UPDATE is informational only — XP is persisted when LESSON_COMPLETE fires.
      if (data.type === 'XP_UPDATE') return;

      try {
        const res = await fetch('/api/student/engine-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: data.type,
            topicId: data.topicId,
            studentId: data.studentId,
            payload: data.payload,
          }),
        });
        if (res.ok) options.onSynced?.(data.topicId, data.type);
      } catch {
        console.warn('[LMS] Engine sync failed for', data.topicId);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
