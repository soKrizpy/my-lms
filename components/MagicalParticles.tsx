'use client';

import React, { useEffect, useRef } from 'react';

interface MagicalParticlesProps {
  colorScheme?: 'mana' | 'emerald' | 'gold' | 'cosmic';
  density?: number;
  className?: string;
}

export function MagicalParticles({
  colorScheme = 'mana',
  density = 35,
  className = 'absolute inset-0 pointer-events-none overflow-hidden',
}: MagicalParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const getPalette = () => {
      switch (colorScheme) {
        case 'emerald':
          return ['#7cc62f', '#a3e635', '#4ade80', '#38bdf8', '#fbbf24'];
        case 'gold':
          return ['#fbbf24', '#f59e0b', '#fde047', '#f43f5e', '#ffffff'];
        case 'cosmic':
          return ['#818cf8', '#c084fc', '#e879f9', '#38bdf8', '#ffffff'];
        case 'mana':
        default:
          return ['#38bdf8', '#818cf8', '#60a5fa', '#7cc62f', '#f472b6'];
      }
    };

    const palette = getPalette();

    interface Particle {
      x: number;
      y: number;
      size: number;
      baseAlpha: number;
      alpha: number;
      color: string;
      vx: number;
      vy: number;
      pulseSpeed: number;
      pulseOffset: number;
      isSparkle: boolean;
    }

    const particles: Particle[] = [];
    const count = Math.min(Math.floor((width * height) / 25000) * (density / 35), 70);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.8,
        baseAlpha: Math.random() * 0.5 + 0.2,
        alpha: Math.random() * 0.5 + 0.2,
        color: palette[Math.floor(Math.random() * palette.length)] || '#38bdf8',
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.4 - 0.1, // gently floats upward
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
        isSparkle: Math.random() > 0.6,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Pulsing glow
        p.alpha = p.baseAlpha + Math.sin(time * p.pulseSpeed * 60 + p.pulseOffset) * 0.25;
        p.alpha = Math.max(0.05, Math.min(0.9, p.alpha));

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.isSparkle ? 10 : 5;

        if (p.isSparkle) {
          // Draw 4-point magical diamond sparkle
          ctx.beginPath();
          const s = p.size * 1.8;
          ctx.moveTo(p.x, p.y - s);
          ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y);
          ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
          ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y);
          ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s);
          ctx.fill();
        } else {
          // Draw soft glowing orb
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [colorScheme, density]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ opacity: 0.85 }}
      aria-hidden="true"
    />
  );
}
