// components/town-square/TownSquareTab.tsx
// Tab Utama Town Square: Avatar Siswa, Pet Sanctuary, Teman Sekelas, & Toko Aksesori

'use client';

import React, { useState } from 'react';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';
import { AvatarShopModal } from '@/components/avatar/AvatarShopModal';
import { PetSanctuaryCard } from '@/components/gamification/pet/PetSanctuaryCard';
import { getTitleById } from '@/lib/gamification/catalog';
import { getAccessoryById } from '@/lib/gamification/avatarShopCatalog';
import { soundFx } from '@/lib/audio/soundFx';
import { ShoppingBag, Users, Sparkles } from 'lucide-react';

interface TownSquareTabProps {
  studentName: string;
  avatarId: string;
  titleId: string;
  coins: number;
  inventory: string[];
  equippedHatId: string | null;
  onSuccessTransaction: (newCoins: number, newInventory: string[], newEquippedHatId: string | null) => void;
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
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <AvatarDisplay avatarId={avatarId} size="xl" showAura hatId={equippedHatId} />
              {equippedItem && (
                <div
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-slate-900 shadow-lg"
                  style={{ background: equippedItem.accentColor }}
                  title={equippedItem.name}
                >
                  ✦
                </div>
              )}
            </div>
          </div>

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
