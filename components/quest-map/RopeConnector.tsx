'use client';

// components/quest-map/RopeConnector.tsx
// Animated rope-like SVG path connector using anime.js v4.
// Mimics a flexible rope (Cut the Rope style) between quest map nodes.

import React, { useRef, useEffect, useId } from 'react';

interface RopeConnectorProps {
  glows: boolean;
  orientation: 'h' | 'v';
  className?: string;
}

// Module-level counter so each rope instance gets a unique phase offset
let _inst = 0;

export function RopeConnector({ glows, orientation, className = '' }: RopeConnectorProps) {
  const pathRef  = useRef<SVGPathElement>(null);
  const hlRef    = useRef<SVGPathElement>(null);
  const uid      = useId();
  // Sanitise React's colon-containing ids for SVG filter references
  const filterId = 'rf' + uid.replace(/[^a-z0-9]/gi, '');

  useEffect(() => {
    _inst++;
    const id = _inst;
    let dead = false;

    // Dynamically import anime.js so it never runs on the server
    import('animejs').then((mod) => {
      if (dead || !pathRef.current) return;
      // anime v4 ships as ESM default export
      const anime = (mod as unknown as { default: typeof import('animejs') }).default ?? mod;

      const maxSag = orientation === 'h' ? 12 : 8;
      const minSag = orientation === 'h' ? 3  : 1;
      // Stagger period per instance so ropes sway out of phase
      const period = 2200 + (id % 9) * 300;
      const s = { t: 0 };

      const tick = () => {
        const el = pathRef.current;
        const hl = hlRef.current;
        if (!el) return;
        const sag = minSag + (maxSag - minSag) * s.t;
        let d: string;
        if (orientation === 'h') {
          // Horizontal rope — control points droop downward
          d = 'M 0 0 C 33 ' + sag + ', 67 ' + sag + ', 100 0';
        } else {
          // Vertical drop — sways left/right alternating per instance
          const sw = sag * (id % 2 === 0 ? 1 : -1);
          d = 'M 0 0 C ' + sw + ' 33, ' + String(-sw) + ' 67, 0 100';
        }
        el.setAttribute('d', d);
        if (hl) hl.setAttribute('d', d);
      };

      (anime as any)({
        targets: s,
        t: 1,
        duration: period,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
        update: tick,
      });
    }).catch(() => { /* anime unavailable — static paths shown */ });

    return () => { dead = true; };
  }, [orientation]);

  /* ── Horizontal rope ─────────────────────────────────────────────── */
  if (orientation === 'h') {
    return (
      <svg
        viewBox="-3 -3 106 18"
        xmlns="http://www.w3.org/2000/svg"
        className={'w-full ' + className}
        style={{ height: '14px', overflow: 'visible' }}
        aria-hidden="true"
      >
        <defs>
          {glows && (
            <filter id={filterId} x="-10%" y="-200%" width="120%" height="500%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>
        {/* Main rope stroke */}
        <path
          ref={pathRef}
          d="M 0 0 C 33 10, 67 10, 100 0"
          fill="none"
          strokeWidth={glows ? 2.2 : 1.4}
          stroke={glows ? '#34d399' : 'rgba(148,163,184,0.45)'}
          strokeLinecap="round"
          filter={glows ? 'url(#' + filterId + ')' : undefined}
          style={{ transition: 'stroke 0.5s, stroke-width 0.5s' }}
        />
        {/* Highlight stripe for rope texture when glowing */}
        {glows && (
          <path
            ref={hlRef}
            d="M 0 0 C 33 10, 67 10, 100 0"
            fill="none"
            strokeWidth={0.8}
            stroke="rgba(255,255,255,0.4)"
            strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>
    );
  }

  /* ── Vertical drop rope ──────────────────────────────────────────── */
  return (
    <svg
      viewBox="-10 -3 20 106"
      xmlns="http://www.w3.org/2000/svg"
      className={'h-full ' + className}
      style={{ width: '20px', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        {glows && (
          <filter id={filterId} x="-200%" y="-10%" width="500%" height="120%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <path
        ref={pathRef}
        d="M 0 0 C 5 33, -5 67, 0 100"
        fill="none"
        strokeWidth={glows ? 2.2 : 1.4}
        stroke={glows ? '#34d399' : 'rgba(148,163,184,0.45)'}
        strokeLinecap="round"
        filter={glows ? 'url(#' + filterId + ')' : undefined}
        style={{ transition: 'stroke 0.5s, stroke-width 0.5s' }}
      />
      {glows && (
        <path
          ref={hlRef}
          d="M 0 0 C 5 33, -5 67, 0 100"
          fill="none"
          strokeWidth={0.8}
          stroke="rgba(255,255,255,0.4)"
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  );
}
