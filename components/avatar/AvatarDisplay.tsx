'use client';

// components/avatar/AvatarDisplay.tsx
// Renders vector SVG character avatars with dynamic aura rings, level frames, and responsive sizing.
// Supports all learning paths: Scratch, Web Dev, Python, 3D Design, Mastery, and Achievements.

import React from 'react';
import { getAvatarById, type AvatarItem } from '@/lib/gamification/catalog';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarDisplayProps {
  avatarId?: string | null;
  size?: AvatarSize;
  showAura?: boolean;
  isLocked?: boolean;
  className?: string;
  onClick?: () => void;
}

const SIZE_CONFIG: Record<
  AvatarSize,
  { container: string; svgSize: number; auraOffset: string; strokeWidth: number }
> = {
  xs: { container: 'w-6 h-6', svgSize: 24, auraOffset: 'p-0.5', strokeWidth: 1.5 },
  sm: { container: 'w-8 h-8', svgSize: 32, auraOffset: 'p-0.5', strokeWidth: 2 },
  md: { container: 'w-10 h-10', svgSize: 40, auraOffset: 'p-1', strokeWidth: 2 },
  lg: { container: 'w-14 h-14', svgSize: 56, auraOffset: 'p-1', strokeWidth: 2.5 },
  xl: { container: 'w-20 h-20', svgSize: 80, auraOffset: 'p-1.5', strokeWidth: 3 },
  '2xl': { container: 'w-28 h-28', svgSize: 112, auraOffset: 'p-2', strokeWidth: 3 },
};

export function AvatarDisplay({
  avatarId,
  size = 'md',
  showAura = true,
  isLocked = false,
  className = '',
  onClick,
}: AvatarDisplayProps) {
  const avatar: AvatarItem = getAvatarById(avatarId || 'pixel-bot');
  const sizeMeta = SIZE_CONFIG[size];

  return (
    <div
      onClick={onClick}
      className={[
        'relative inline-flex items-center justify-center rounded-full transition-transform select-none',
        sizeMeta.container,
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : '',
        isLocked ? 'grayscale opacity-50' : '',
        className,
      ].join(' ')}
      style={{
        background: `radial-gradient(circle, ${avatar.accentColor}18 0%, rgba(15,23,42,0.6) 100%)`,
        boxShadow:
          showAura && !isLocked
            ? `0 0 12px ${avatar.glowColor}, inset 0 0 8px ${avatar.glowColor}`
            : 'none',
        border: `1.5px solid ${isLocked ? 'rgba(148, 163, 184, 0.3)' : avatar.accentColor}`,
      }}
      role="img"
      aria-label={avatar.name}
      title={avatar.name}
    >
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full p-1"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <AvatarSvgContent id={avatar.id} accentColor={avatar.accentColor} />
      </svg>

      {/* Lock overlay badge if locked */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
          <svg
            className="w-1/2 h-1/2 text-slate-300 drop-shadow"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── SVG Vector Content for Each Avatar ───────────────────────────────────────

function AvatarSvgContent({ id, accentColor }: { id: string; accentColor: string }) {
  switch (id) {
    case 'pixel-bot':
      // Retro robot head with visor
      return (
        <g>
          {/* Antenna */}
          <line x1="32" y1="12" x2="32" y2="4" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="4" r="3.5" fill="#38bdf8" />
          {/* Ears */}
          <rect x="8" y="24" width="4" height="12" rx="2" fill="#64748b" />
          <rect x="52" y="24" width="4" height="12" rx="2" fill="#64748b" />
          {/* Head Body */}
          <rect x="12" y="12" width="40" height="38" rx="8" fill="#1e293b" stroke={accentColor} strokeWidth="2.5" />
          {/* Neon Visor Screen */}
          <rect x="18" y="20" width="28" height="15" rx="4" fill="#0f172a" />
          {/* Glowing Eyes / Visor Sweep */}
          <rect x="21" y="24" width="8" height="7" rx="2" fill="#38bdf8" />
          <rect x="35" y="24" width="8" height="7" rx="2" fill="#38bdf8" />
          {/* Cheerful Speaker Grill / Mouth */}
          <line x1="24" y1="41" x2="40" y2="41" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="44" x2="36" y2="44" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );

    case 'neon-fox':
      // Cybernetic sleek fox
      return (
        <g>
          {/* Left Ear */}
          <polygon points="14,24 22,6 30,22" fill="#ea580c" stroke="#fb923c" strokeWidth="2" />
          <polygon points="18,22 22,10 26,20" fill="#fef08a" />
          {/* Right Ear */}
          <polygon points="50,24 42,6 34,22" fill="#ea580c" stroke="#fb923c" strokeWidth="2" />
          <polygon points="46,22 42,10 38,20" fill="#fef08a" />
          {/* Face Base */}
          <polygon points="12,25 52,25 32,56" fill="#c2410c" stroke="#fb923c" strokeWidth="2.5" />
          {/* White Cheeks */}
          <polygon points="14,27 32,53 22,35" fill="#f8fafc" />
          <polygon points="50,27 32,53 42,35" fill="#f8fafc" />
          {/* Glowing Eyes */}
          <ellipse cx="24" cy="30" rx="3.5" ry="2" fill="#38bdf8" transform="rotate(-10 24 30)" />
          <ellipse cx="40" cy="30" rx="3.5" ry="2" fill="#38bdf8" transform="rotate(10 40 30)" />
          {/* Nose */}
          <polygon points="30,50 34,50 32,53" fill="#0f172a" />
          {/* Forehead Cyber Diamond */}
          <polygon points="32,20 35,24 32,28 29,24" fill="#38bdf8" />
        </g>
      );

    case 'scratch-cat':
      // The iconic energetic coding cat with DJ headphones
      return (
        <g>
          {/* Ears */}
          <polygon points="14,24 16,8 30,20" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
          <polygon points="18,21 19,12 26,18" fill="#fde68a" />
          <polygon points="50,24 48,8 34,20" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
          <polygon points="46,21 45,12 38,18" fill="#fde68a" />
          {/* Head */}
          <ellipse cx="32" cy="35" rx="22" ry="18" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
          {/* White Muzzle */}
          <ellipse cx="32" cy="40" rx="11" ry="8" fill="#fffbeb" />
          {/* Eyes */}
          <ellipse cx="24" cy="31" rx="4" ry="5.5" fill="#0f172a" />
          <circle cx="23" cy="29" r="1.5" fill="#ffffff" />
          <ellipse cx="40" cy="31" rx="4" ry="5.5" fill="#0f172a" />
          <circle cx="39" cy="29" r="1.5" fill="#ffffff" />
          {/* Triangle Nose */}
          <polygon points="30,37 34,37 32,40" fill="#ef4444" />
          {/* Cute Smile */}
          <path d="M28,42 Q32,46 36,42" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Whiskers */}
          <line x1="8" y1="36" x2="18" y2="38" stroke="#d97706" strokeWidth="1.5" />
          <line x1="8" y1="42" x2="18" y2="41" stroke="#d97706" strokeWidth="1.5" />
          <line x1="56" y1="36" x2="46" y2="38" stroke="#d97706" strokeWidth="1.5" />
          <line x1="56" y1="42" x2="46" y2="41" stroke="#d97706" strokeWidth="1.5" />
          {/* Cyan Cyber Headphone Band */}
          <path d="M12,32 A20,20 0 0,1 52,32" stroke="#06b6d4" strokeWidth="3" fill="none" />
          {/* Earcups */}
          <rect x="9" y="27" width="5" height="11" rx="2" fill="#0891b2" />
          <rect x="50" y="27" width="5" height="11" rx="2" fill="#0891b2" />
        </g>
      );

    case 'block-golem':
      // Golem made of interlocking visual code puzzle blocks
      return (
        <g>
          {/* Top Block (Orange) */}
          <rect x="20" y="10" width="24" height="14" rx="3" fill="#f97316" stroke="#c2410c" strokeWidth="1.5" />
          <rect x="27" y="6" width="10" height="5" rx="2" fill="#f97316" />
          {/* Middle Main Block (Purple) */}
          <rect x="12" y="22" width="40" height="20" rx="4" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="2" />
          {/* Puzzle notch connector */}
          <rect x="19" y="20" width="8" height="4" rx="1.5" fill="#8b5cf6" />
          <rect x="37" y="20" width="8" height="4" rx="1.5" fill="#8b5cf6" />
          {/* Glowing Green Block Eyes */}
          <rect x="20" y="28" width="7" height="7" rx="1.5" fill="#22c55e" />
          <rect x="37" y="28" width="7" height="7" rx="1.5" fill="#22c55e" />
          {/* Bottom Block (Blue) */}
          <rect x="16" y="40" width="32" height="14" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
          {/* Digital Heart/Code Symbol */}
          <polygon points="32,44 35,48 32,52 29,48" fill="#fde047" />
        </g>
      );

    case 'web-spider':
      // Cute 8-legged cyber-spider with DOM fiber-optic threads
      return (
        <g>
          {/* Spider Legs */}
          <path d="M18,24 Q6,14 4,28" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M16,32 Q4,30 2,42" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M18,40 Q8,48 6,56" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M46,24 Q58,14 60,28" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M48,32 Q60,30 62,42" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M46,40 Q56,48 58,56" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Abdomen / Body */}
          <circle cx="32" cy="34" r="16" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
          {/* Multi-optic Visor Eyes */}
          <circle cx="26" cy="28" r="3" fill="#22d3ee" />
          <circle cx="38" cy="28" r="3" fill="#22d3ee" />
          <circle cx="22" cy="36" r="2" fill="#67e8f9" />
          <circle cx="42" cy="36" r="2" fill="#67e8f9" />
          <circle cx="28" cy="38" r="2" fill="#67e8f9" />
          <circle cx="36" cy="38" r="2" fill="#67e8f9" />
          {/* HTML Bracket Brand */}
          <path d="M29,43 L26,45 L29,47" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M35,43 L38,45 L35,47" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      );

    case 'css-chameleon':
      // Color-shifting neon chameleon holding a stylus
      return (
        <g>
          {/* Curled Tail */}
          <path d="M14,48 Q8,36 14,28 Q20,24 18,34" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Chameleon Body */}
          <ellipse cx="32" cy="34" rx="18" ry="14" fill="#831843" stroke="#ec4899" strokeWidth="2" />
          {/* Head & Crest */}
          <path d="M36,24 Q48,22 52,32 Q52,42 42,44 Z" fill="#db2777" stroke="#ec4899" strokeWidth="2" />
          <polygon points="36,22 42,16 46,24" fill="#f472b6" />
          {/* Turret Eye (Concentric Circles) */}
          <circle cx="44" cy="30" r="5.5" fill="#fdf2f8" stroke="#ec4899" strokeWidth="1.5" />
          <circle cx="45" cy="30" r="2.5" fill="#0f172a" />
          <circle cx="46" cy="29" r="1" fill="#ec4899" />
          {/* Glowing Stylus Brush */}
          <line x1="26" y1="46" x2="48" y2="54" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="55" r="2" fill="#ec4899" />
          {/* Gradient Spine Scales */}
          <circle cx="24" cy="22" r="2" fill="#a855f7" />
          <circle cx="30" cy="21" r="2" fill="#ec4899" />
          <circle cx="36" cy="21" r="2" fill="#f43f5e" />
        </g>
      );

    case 'python-viper':
      // Digital serpent pulsing with binary circuits
      return (
        <g>
          {/* Coiled Serpent Body */}
          <path
            d="M12,46 Q16,56 32,56 Q48,56 50,44 Q52,32 38,30 Q22,28 24,18 Q26,8 38,8 Q48,8 48,16"
            stroke="#1e3a8a"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M12,46 Q16,56 32,56 Q48,56 50,44 Q52,32 38,30 Q22,28 24,18 Q26,8 38,8 Q48,8 48,16"
            stroke="#3b82f6"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Viper Head */}
          <polygon points="46,12 56,16 52,24 42,20" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
          {/* Glowing Python Yellow Eye */}
          <circle cx="48" cy="16" r="2" fill="#fde047" />
          {/* Forked Cyan Energy Tongue */}
          <path d="M56,16 L62,15 M56,16 L62,18" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          {/* Binary Circuit Dots on body */}
          <circle cx="28" cy="54" r="1.5" fill="#60a5fa" />
          <circle cx="36" cy="54" r="1.5" fill="#93c5fd" />
          <circle cx="32" cy="30" r="1.5" fill="#fde047" />
        </g>
      );

    case 'code-ninja':
      // Hooded shadow programmer with green matrix goggles
      return (
        <g>
          {/* Dark Cowl / Hood */}
          <path d="M12,56 C10,30 16,10 32,10 C48,10 54,30 52,56 Z" fill="#090d16" stroke="#22c55e" strokeWidth="2" />
          {/* Mask Inner Face Aperture */}
          <ellipse cx="32" cy="30" rx="15" ry="8" fill="#1e293b" />
          {/* Glowing Matrix HUD Visor */}
          <rect x="20" y="26" width="24" height="8" rx="3" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
          {/* Code Scanline Glints */}
          <line x1="23" y1="30" x2="31" y2="30" stroke="#86efac" strokeWidth="2" strokeLinecap="round" />
          <line x1="33" y1="30" x2="41" y2="30" stroke="#86efac" strokeWidth="2" strokeLinecap="round" />
          {/* Forehead Ninja Headband Plate */}
          <rect x="22" y="16" width="20" height="6" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
          {/* Terminal Prompt Symbol on Plate: >_ */}
          <path d="M26,18 L28,19 L26,20 M30,20 L33,20" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
        </g>
      );

    case 'voxel-paladin':
      // Low-poly faceted knight helm with floating wireframe
      return (
        <g>
          {/* Helm Facets */}
          <polygon points="32,6 18,18 32,24" fill="#6d28d9" stroke="#c084fc" strokeWidth="1" />
          <polygon points="32,6 46,18 32,24" fill="#7c3aed" stroke="#c084fc" strokeWidth="1" />
          <polygon points="18,18 12,38 32,44" fill="#5b21b6" stroke="#c084fc" strokeWidth="1" />
          <polygon points="46,18 52,38 32,44" fill="#4c1d95" stroke="#c084fc" strokeWidth="1" />
          <polygon points="12,38 32,58 32,44" fill="#3b0764" stroke="#c084fc" strokeWidth="1" />
          <polygon points="52,38 32,58 32,44" fill="#2e1065" stroke="#c084fc" strokeWidth="1" />
          {/* T-Visor Glow */}
          <polygon points="22,28 42,28 35,32 29,32" fill="#a855f7" />
          <polygon points="30,32 34,32 33,42 31,42" fill="#c084fc" />
          {/* Floating Voxel Vertices */}
          <circle cx="10" cy="18" r="1.5" fill="#e9d5ff" />
          <circle cx="54" cy="18" r="1.5" fill="#e9d5ff" />
          <circle cx="32" cy="3" r="1.5" fill="#e9d5ff" />
        </g>
      );

    case 'holo-dragon':
      // Majestic 3D holographic dragon
      return (
        <g>
          {/* Horns */}
          <polygon points="26,16 14,4 20,20" fill="#7e22ce" stroke="#c084fc" strokeWidth="1.5" />
          <polygon points="38,16 50,4 44,20" fill="#9333ea" stroke="#c084fc" strokeWidth="1.5" />
          {/* Snout & Jaw Facets */}
          <polygon points="32,18 20,26 32,40 44,26" fill="#a855f7" stroke="#f3e8ff" strokeWidth="1.5" />
          <polygon points="20,26 12,38 32,40" fill="#6b21a8" stroke="#c084fc" strokeWidth="1" />
          <polygon points="44,26 52,38 32,40" fill="#581c87" stroke="#c084fc" strokeWidth="1" />
          <polygon points="32,40 24,54 32,58 40,54" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" />
          {/* Dragon Eyes (Cyan Crystal) */}
          <polygon points="24,27 28,29 25,32 21,30" fill="#38bdf8" />
          <polygon points="40,27 36,29 39,32 43,30" fill="#38bdf8" />
          {/* Nostrils Smoke/Plasma */}
          <circle cx="28" cy="50" r="1" fill="#e879f9" />
          <circle cx="36" cy="50" r="1" fill="#e879f9" />
        </g>
      );

    case 'byte-knight':
      // Armored techno-champion with violet energy visor
      return (
        <g>
          {/* Knight Helm Plating */}
          <path d="M16,22 Q32,10 48,22 L50,44 Q32,56 14,44 Z" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2.5" />
          {/* Crest / Plume */}
          <polygon points="32,6 36,18 28,18" fill="#818cf8" />
          {/* Horizontal Visor Slit */}
          <polygon points="18,28 46,28 44,35 20,35" fill="#0f172a" stroke="#6366f1" strokeWidth="1" />
          <line x1="22" y1="31" x2="42" y2="31" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" />
          {/* Face Grille Vents */}
          <line x1="28" y1="41" x2="36" y2="41" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="26" y1="45" x2="38" y2="45" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="30" y1="49" x2="34" y2="49" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );

    case 'flame-striker':
      // Blazing solar phoenix with fire aura
      return (
        <g>
          {/* Fire Crest Plumes */}
          <path d="M32,6 Q36,18 42,16 Q36,26 32,28 Q28,26 22,16 Q28,18 32,6" fill="#f97316" stroke="#fbbf24" strokeWidth="1" />
          <path d="M32,12 Q38,20 40,24 Q32,28 24,24 Q26,20 32,12" fill="#facc15" />
          {/* Phoenix Head */}
          <ellipse cx="32" cy="34" rx="14" ry="16" fill="#ea580c" stroke="#f97316" strokeWidth="2" />
          {/* Sharp Beak */}
          <polygon points="30,38 46,42 30,46" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
          {/* Radiant Solar Eye */}
          <ellipse cx="26" cy="32" rx="3.5" ry="3.5" fill="#fef08a" />
          <circle cx="26" cy="32" r="1.5" fill="#7c2d12" />
          {/* Ambient Flame Wisps */}
          <circle cx="14" cy="24" r="2" fill="#fb923c" />
          <circle cx="50" cy="24" r="2" fill="#fb923c" />
          <circle cx="16" cy="44" r="1.5" fill="#fde047" />
          <circle cx="48" cy="44" r="1.5" fill="#fde047" />
        </g>
      );

    case 'code-prodigy':
      // Pulsing cosmic crystal core floating inside orbital ring
      return (
        <g>
          {/* Tilted Outer Orbital Ring */}
          <ellipse cx="32" cy="32" rx="26" ry="10" stroke="#fde047" strokeWidth="2" transform="rotate(-30 32 32)" fill="none" />
          {/* Core Octahedron / Tesseract */}
          <polygon points="32,10 46,26 32,42 18,26" fill="#ca8a04" stroke="#fef08a" strokeWidth="1.5" />
          <polygon points="32,22 46,26 32,54 18,26" fill="#a16207" stroke="#fef08a" strokeWidth="1.5" />
          <polygon points="32,22 42,26 32,38 22,26" fill="#facc15" />
          {/* Floating Energy Particles */}
          <circle cx="14" cy="20" r="2" fill="#fde047" />
          <circle cx="50" cy="44" r="2" fill="#fde047" />
          <circle cx="46" cy="14" r="1.5" fill="#ffffff" />
          <circle cx="18" cy="48" r="1.5" fill="#ffffff" />
        </g>
      );

    default:
      // Fallback: Default Robot
      return (
        <g>
          <rect x="16" y="16" width="32" height="32" rx="8" fill="#1e293b" stroke={accentColor} strokeWidth="2" />
          <circle cx="26" cy="30" r="4" fill={accentColor} />
          <circle cx="38" cy="30" r="4" fill={accentColor} />
          <line x1="26" y1="40" x2="38" y2="40" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
  }
}
