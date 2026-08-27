'use client';

import React, { useEffect, useRef } from 'react';
import * as animeModule from 'animejs';

const anime = (animeModule as any).default || animeModule;

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

  useEffect(() => {
    if (!spanRef.current) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof anime !== 'function') {
      if (spanRef.current) {
        spanRef.current.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
      }
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    const targetObj = { count: startVal };

    const anim = anime({
      targets: targetObj,
      count: value,
      round: 1,
      duration: duration,
      easing: 'easeOutExpo',
      update: () => {
        if (spanRef.current) {
          spanRef.current.textContent = `${prefix}${targetObj.count.toLocaleString()}${suffix}`;
        }
      },
    });

    prevValueRef.current = value;

    return () => {
      if (anim?.pause) anim.pause();
      if (spanRef.current && typeof anime.remove === 'function') {
        anime.remove(spanRef.current);
      }
    };
  }, [value, duration, prefix, suffix]);

  return (
    <span ref={spanRef} className={className}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
