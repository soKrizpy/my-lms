'use client';

// components/quest-map/QuestMapRope.tsx
// Renders a thick, winding rope-road through all topic nodes,
// Cut-the-Rope level-map style, as an SVG overlay.
// Unlocked segments glow emerald; locked segments are muted grey-tan.
// Uses anime.js for a subtle breathing glow animation.

import React, { useRef, useEffect } from 'react';

export interface RopePoint {
  x: number;
  y: number;
  unlocked: boolean;
}

// ---------------------------------------------------------------------------
// Catmull-Rom → cubic bezier conversion
// Produces a smooth C-curve path through all points.
// alpha=0.5 gives centripetal Catmull-Rom (avoids cusps at corners).
// ---------------------------------------------------------------------------
function catmullRomPath(pts: { x: number; y: number }[], alpha = 0.5): string {
  if (pts.length < 2) return '';
  const d: string[] = [`M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`];

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * alpha / 3;
    const cp1y = p1.y + (p2.y - p0.y) * alpha / 3;
    const cp2x = p2.x - (p3.x - p1.x) * alpha / 3;
    const cp2y = p2.y - (p3.y - p1.y) * alpha / 3;

    d.push(
      `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)},` +
      ` ${cp2x.toFixed(2)} ${cp2y.toFixed(2)},` +
      ` ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
    );
  }
  return d.join(' ');
}

// Build a single-segment bezier from index i to i+1, using neighbours for smoothing
function segmentPath(
  pts: { x: number; y: number }[],
  i: number,
  alpha = 0.5
): string {
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(pts.length - 1, i + 2)];

  const cp1x = p1.x + (p2.x - p0.x) * alpha / 3;
  const cp1y = p1.y + (p2.y - p0.y) * alpha / 3;
  const cp2x = p2.x - (p3.x - p1.x) * alpha / 3;
  const cp2y = p2.y - (p3.y - p1.y) * alpha / 3;

  return (
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} ` +
    `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)},` +
    ` ${cp2x.toFixed(2)} ${cp2y.toFixed(2)},` +
    ` ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  );
}

// ---------------------------------------------------------------------------
interface QuestMapRopeProps {
  /** Sequential node positions measured from the container top-left */
  points: RopePoint[];
  /** Unique id prefix for SVG defs to avoid collisions */
  uid: string;
}

export function QuestMapRope({ points, uid }: QuestMapRopeProps) {
  const glowGroupRef = useRef<SVGGElement>(null);

  // Breathing glow animation on the unlocked segments
  useEffect(() => {
    let cancelled = false;
    import('animejs').then((mod) => {
      if (cancelled || !glowGroupRef.current) return;
      const anime = (mod as unknown as { default: typeof import('animejs') }).default ?? mod;
      const s = { blur: 5, opacity: 0.7 };

      (anime as any)({
        targets: s,
        blur: [5, 11, 5],
        opacity: [0.7, 1, 0.7],
        duration: 2600,
        loop: true,
        easing: 'easeInOutSine',
        update() {
          if (glowGroupRef.current) {
            glowGroupRef.current.style.filter =
              `drop-shadow(0 0 ${s.blur.toFixed(1)}px rgba(16,185,129,${s.opacity.toFixed(2)}))`;
            glowGroupRef.current.style.opacity = String(s.opacity.toFixed(2));
          }
        },
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (points.length < 2) return null;

  const coords = points.map((p) => ({ x: p.x, y: p.y }));
  const fullD  = catmullRomPath(coords);

  // Collect individual segment paths for unlocked pairs
  const unlockedSegs: string[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].unlocked && points[i + 1].unlocked) {
      unlockedSegs.push(segmentPath(coords, i));
    }
  }

  const strokeBase    = 20;
  const strokeShadow  = 28;
  const strokeHL      = 7;

  return (
    <>
      {/* 1. Outer shadow for depth */}
      <path
        d={fullD}
        fill="none"
        strokeWidth={strokeShadow}
        stroke="rgba(0,0,0,0.12)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. Base path — muted for all nodes (shows locked sections) */}
      <path
        d={fullD}
        fill="none"
        strokeWidth={strokeBase}
        stroke="rgba(148,163,184,0.28)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Unlocked segments — emerald road */}
      <g ref={glowGroupRef} style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.75))' }}>
        {unlockedSegs.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            strokeWidth={strokeBase}
            stroke="#10b981"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* 4. Top highlight stripe — gives the rope/road a 3-D ridge */}
      <path
        d={fullD}
        fill="none"
        strokeWidth={strokeHL}
        stroke="rgba(255,255,255,0.22)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 5. Brighter highlight on unlocked segments */}
      {unlockedSegs.map((d, i) => (
        <path
          key={'hl' + i}
          d={d}
          fill="none"
          strokeWidth={strokeHL}
          stroke="rgba(255,255,255,0.38)"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  );
}
