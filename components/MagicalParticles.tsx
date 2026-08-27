'use client';

import React, { useEffect, useRef } from 'react';

interface MagicalParticlesProps {
  colorScheme?: 'mana' | 'emerald' | 'gold' | 'cosmic' | 'rainbow';
  density?: number;
  className?: string;
}

export function MagicalParticles({
  colorScheme = 'mana',
  density = 55,
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
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const getPalette = () => {
      switch (colorScheme) {
        case 'emerald':
          return ['#7cc62f', '#a3e635', '#4ade80', '#38bdf8', '#fbbf24', '#ffffff'];
        case 'gold':
          return ['#fbbf24', '#f59e0b', '#fde047', '#fcd34d', '#ffffff'];
        case 'cosmic':
          return ['#c084fc', '#e879f9', '#a855f7', '#38bdf8', '#818cf8', '#ffffff'];
        case 'rainbow':
          return ['#f472b6', '#c084fc', '#38bdf8', '#4ade80', '#fbbf24', '#ffffff'];
        case 'mana':
        default:
          return ['#60a5fa', '#38bdf8', '#c084fc', '#a855f7', '#fbbf24', '#7cc62f', '#ffffff'];
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
      particleType: 'star' | 'glitter' | 'orb';
      rotation: number;
      rotSpeed: number;
    }

    const particles: Particle[] = [];
    const count = Math.min(Math.floor((width * height) / 12000) * (density / 35), 90);

    for (let i = 0; i < count; i++) {
      const typeRand = Math.random();
      const pType: 'star' | 'glitter' | 'orb' = typeRand > 0.45 ? 'star' : typeRand > 0.2 ? 'glitter' : 'orb';

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3.2 + 1.2,
        baseAlpha: Math.random() * 0.4 + 0.45,
        alpha: Math.random() * 0.4 + 0.45,
        color: palette[Math.floor(Math.random() * palette.length)] || '#ffffff',
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.45 - 0.15, // gently floats upward
        pulseSpeed: Math.random() * 0.04 + 0.015,
        pulseOffset: Math.random() * Math.PI * 2,
        particleType: pType,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.04,
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
        p.rotation += p.rotSpeed;

        // Wrap around boundaries
        if (p.y < -15) {
          p.y = height + 15;
          p.x = Math.random() * width;
        }
        if (p.x < -15) p.x = width + 15;
        if (p.x > width + 15) p.x = -15;

        // Pulsing glow twinkle
        p.alpha = p.baseAlpha + Math.sin(time * p.pulseSpeed * 60 + p.pulseOffset) * 0.4;
        p.alpha = Math.max(0.1, Math.min(1.0, p.alpha));

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.particleType === 'star' ? 14 : 8;

        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.particleType === 'star') {
          // 4-point Diamond Star with long beams
          const s = p.size * 2.2;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();

          // Bright center core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.particleType === 'glitter') {
          // Cross sparkle (plus sign twinkle)
          const arm = p.size * 1.6;
          const thick = p.size * 0.45;
          ctx.beginPath();
          ctx.rect(-thick / 2, -arm, thick, arm * 2);
          ctx.rect(-arm, -thick / 2, arm * 2, thick);
          ctx.fill();
        } else {
          // Soft Glowing orb
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
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
      style={{ opacity: 1 }}
      aria-hidden="true"
    />
  );
}
