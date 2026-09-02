'use client';

import React, { useEffect, useRef } from 'react';

interface MagicalCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function MagicalCounter({
  value,
  duration = 1400,
  prefix = '',
  suffix = '',
  className = '',
}: MagicalCounterProps) {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const prevValueRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!spanRef.current) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const startVal = prevValueRef.current;
    const endVal = value;

    if (prefersReduced || startVal === endVal) {
      if (spanRef.current) {
        spanRef.current.textContent = `${prefix}${endVal.toLocaleString()}${suffix}`;
      }
      prevValueRef.current = endVal;
      return;
    }

    const startTime = performance.now();

    function easeOutExpo(t: number): number {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = Math.round(startVal + (endVal - startVal) * eased);

      if (spanRef.current) {
        spanRef.current.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = endVal;
      }
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration, prefix, suffix]);

  return (
    <span ref={spanRef} className={className}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}
