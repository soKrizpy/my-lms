// components/town-square/TownSquareTab.tsx
// Tab Utama Town Square: Avatar Siswa (dengan Animasi Anime.js & Lore), Pet Sanctuary, & Toko Aksesori

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';
import { AvatarShopModal } from '@/components/avatar/AvatarShopModal';
import { PetSanctuaryCard } from '@/components/gamification/pet/PetSanctuaryCard';
import { getTitleById, getAvatarById } from '@/lib/gamification/catalog';
import { getAccessoryById } from '@/lib/gamification/avatarShopCatalog';
import { soundFx } from '@/lib/audio/soundFx';
import { ShoppingBag, Sparkles, BookOpen, X } from 'lucide-react';

interface TownSquareTabProps {
  studentName: string;
  avatarId: string;
  titleId: string;
  coins: number;
  inventory: string[];
  equippedHatId: string | null;
  onSuccessTransaction: (newCoins: number, newInventory: string[], newEquippedHatId: string | null) => void;
}

// ── Interactive Animated Coder Hero Avatar Component (Anime.js) ─────────────
function AnimatedCoderHeroAvatar({
  avatarId,
  equippedHatId,
  equippedItem,
}: {
  avatarId: string;
  equippedHatId: string | null;
  equippedItem: any;
}) {
  const [showLore, setShowLore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const loreRef = useRef<HTMLDivElement>(null);

  const avatarInfo = getAvatarById(avatarId);

  // 1. Continuous Floating (Levitation) & Aura Glow Animations via Anime.js
  useEffect(() => {
    let isMounted = true;
    let floatAnim: any = null;
    let auraAnim: any = null;

    import('animejs').then((mod) => {
      if (!isMounted) return;
      const anime = (mod as any).default ?? mod;

      // a. Floating / Levitation (loop: true, direction: 'alternate', easing: 'easeInOutSine')
      if (floatRef.current) {
        floatAnim = (anime as any)({
          targets: floatRef.current,
          translateY: [-7, 7],
          duration: 2200,
          direction: 'alternate',
          loop: true,
          easing: 'easeInOutSine',
        });
      }

      // b. Aura Glow pulse (scale & box-shadow breathing)
      if (auraRef.current) {
        auraAnim = (anime as any)({
          targets: auraRef.current,
          scale: [0.96, 1.08],
          opacity: [0.55, 0.95],
          duration: 1800,
          direction: 'alternate',
          loop: true,
          easing: 'easeInOutSine',
        });
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
      if (floatAnim && typeof floatAnim.pause === 'function') floatAnim.pause();
      if (auraAnim && typeof auraAnim.pause === 'function') auraAnim.pause();
    };
  }, [avatarId]);

  // c. Interactive Hover animation (scale up with spring/elastic & border brightness)
  const handleMouseEnter = () => {
    import('animejs').then((mod) => {
      const anime = (mod as any).default ?? mod;
      if (floatRef.current) {
        (anime as any)({
          targets: floatRef.current,
          scale: 1.14,
          duration: 500,
          easing: 'easeOutElastic(1, 0.5)',
        });
      }
      if (auraRef.current) {
        (anime as any)({
          targets: auraRef.current,
          scale: 1.15,
          opacity: 1,
          duration: 300,
          easing: 'easeOutQuad',
        });
      }
    }).catch(() => {});
  };

  const handleMouseLeave = () => {
    import('animejs').then((mod) => {
      const anime = (mod as any).default ?? mod;
      if (floatRef.current) {
        (anime as any)({
          targets: floatRef.current,
          scale: 1,
          duration: 350,
          easing: 'easeOutQuad',
        });
      }
    }).catch(() => {});
  };

  // d. Click (Press) handler to show Floating Lore Message with spring entrance animation
  const handleAvatarClick = () => {
    soundFx.playClick();
    setShowLore((prev) => !prev);
  };

  useEffect(() => {
    if (showLore && loreRef.current) {
      import('animejs').then((mod) => {
        const anime = (mod as any).default ?? mod;
        (anime as any)({
          targets: loreRef.current,
          opacity: [0, 1],
          scale: [0.8, 1],
          translateY: [12, 0],
          duration: 450,
          easing: 'easeOutBack',
        });
      }).catch(() => {});
    }
  }, [showLore]);

  return (
    <div className="relative flex-shrink-0" ref={containerRef}>
      {/* Interactive Container */}
      <div
        onClick={handleAvatarClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative cursor-pointer group select-none p-1"
        title="Klik untuk membaca Lore Avatar!"
      >
        {/* b. Aura Glow Ring (Denyut Cincin Cahaya) */}
        <div
          ref={auraRef}
          className="absolute inset-0 rounded-full pointer-events-none blur-md transition-all duration-300"
          style={{
            background: avatarInfo.glowColor || 'rgba(168, 85, 247, 0.5)',
            boxShadow: `0 0 25px ${avatarInfo.glowColor || 'rgba(168, 85, 247, 0.6)'}`,
          }}
        />

        {/* a & c. Floating & Hover Scale Avatar Container */}
        <div ref={floatRef} className="relative z-10">
          <AvatarDisplay avatarId={avatarId} size="xl" showAura hatId={equippedHatId} />
          {equippedItem && (
            <div
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-slate-900 shadow-lg z-20"
              style={{ background: equippedItem.accentColor }}
              title={equippedItem.name}
            >
              ✦
            </div>
          )}
        </div>

        {/* Click Prompt Hint Badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-full bg-purple-950/90 border border-purple-400/60 text-[9px] font-bold text-purple-200 shadow-md whitespace-nowrap opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all">
          ✨ Klik Lore
        </div>
      </div>

      {/* d. Floating Lore Message Modal / Speech Bubble */}
      {showLore && (
        <div
          ref={loreRef}
          className="absolute left-1/2 -translate-x-1/2 sm:left-full sm:translate-x-3 top-full sm:top-0 mt-3 sm:mt-0 z-50 w-72 p-4 rounded-2xl bg-slate-900/95 border-2 border-purple-400/80 shadow-[0_0_30px_rgba(168,85,247,0.4)] backdrop-blur-xl text-left"
        >
          {/* Decorative speech bubble pointer arrow for desktop */}
          <div className="hidden sm:block absolute -left-2.5 top-6 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-purple-400/80" />

          {/* Header & Close Button */}
          <div className="flex items-center justify-between pb-2 border-b border-purple-500/30 mb-2.5">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                Lore Avatar
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLore(false);
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Avatar Name & Rarity */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="font-black text-white text-sm" style={{ color: avatarInfo.accentColor }}>
              {avatarInfo.name}
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-purple-500/20 text-purple-300 border border-purple-400/40">
              {avatarInfo.rarity}
            </span>
          </div>

          {/* Lore Content */}
          <p className="text-xs text-slate-200 leading-relaxed font-medium italic">
            "{avatarInfo.lore || avatarInfo.description}"
          </p>

          {/* Footer note */}
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-purple-300/80">
            <span>Kategori: <strong className="text-white capitalize">{avatarInfo.category}</strong></span>
            <span className="text-amber-400 font-bold">✨ Bits2Bytes Lore</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function TownSquareTab({
  studentName,
  avatarId,
  titleId,
  coins,
  inventory,
  equippedHatId,
  onSuccessTransaction,
}: TownSquareTabProps) {
  const [shopOpen, setShopOpen] = useState(false);

  const titleInfo = getTitleById(titleId);
  const equippedItem = getAccessoryById(equippedHatId);

  const handleOpenShop = () => {
    soundFx.playClick();
    setShopOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* ── Hero Avatar Card ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-br from-slate-900/95 via-purple-950/50 to-slate-900/95 shadow-[0_0_40px_rgba(168,85,247,0.2)] p-5">
        {/* Ambient glow blobs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar with Anime.js Animations & Interactive Lore */}
          <AnimatedCoderHeroAvatar
            avatarId={avatarId}
            equippedHatId={equippedHatId}
            equippedItem={equippedItem}
          />

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-0.5">Coder Hero</p>
            <h2 className="text-xl font-black text-white">{studentName}</h2>
            <p className="text-xs font-bold text-purple-300 mt-0.5">🏅 {titleInfo.name}</p>
            {equippedItem && (
              <p className="text-xs text-slate-400 mt-1">
                Aksesori: <span className="text-white font-semibold" style={{ color: equippedItem.accentColor }}>{equippedItem.name}</span>
              </p>
            )}
          </div>

          {/* Coins + Shop Button */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            {/* Coin display */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900/40 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <span className="text-lg">🪙</span>
              <span className="font-black text-amber-300 text-base tabular-nums">{coins}</span>
              <span className="text-xs text-amber-400 font-semibold">koin</span>
            </div>

            {/* Open Shop */}
            <button
              onClick={handleOpenShop}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-purple-500/40 hover:-translate-y-0.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Toko Aksesori
            </button>
          </div>
        </div>
      </div>

      {/* ── Pet Sanctuary ────────────────────────────────────────────── */}
      <PetSanctuaryCard coins={coins} />

      {/* ── How to Earn Coins Banner ─────────────────────────────────── */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-300 uppercase tracking-wide">Cara Dapat Koin</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              {[
                { icon: '🎓', text: 'Selesaikan lesson koding', reward: '+25 🪙' },
                { icon: '✅', text: 'Gabung sesi kelas live', reward: '+10 🪙' },
                { icon: '🏆', text: 'Quiz nilai ≥ 70', reward: '+20 🪙' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 bg-emerald-900/30 rounded-lg p-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs text-emerald-100 flex-1">{item.text}</span>
                  <span className="text-xs font-bold text-amber-400 whitespace-nowrap">{item.reward}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Avatar Shop Modal ─────────────────────────────────────────── */}
      <AvatarShopModal
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        avatarId={avatarId}
        coins={coins}
        inventory={inventory}
        equippedHatId={equippedHatId}
        onSuccessTransaction={(newCoins, newInventory, newEquipped) => {
          onSuccessTransaction(newCoins, newInventory, newEquipped);
          setShopOpen(false);
        }}
      />
    </div>
  );
}

