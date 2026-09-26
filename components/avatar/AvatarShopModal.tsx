// components/avatar/AvatarShopModal.tsx
// Toko Aksesori Avatar (Roblox-Style) untuk bits2bytes LMS

'use client';

import React, { useState } from 'react';
import { X, Sparkles, Coins, Check, Shirt, CheckCircle2, ShoppingBag } from 'lucide-react';
import { AVATAR_ACCESSORIES, AccessoryItem, getAccessoryById } from '@/lib/gamification/avatarShopCatalog';
import { AvatarDisplay } from './AvatarDisplay';
import { soundFx } from '@/lib/audio/soundFx';

interface AvatarShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarId?: string | null;
  coins: number;
  inventory: string[];
  equippedHatId: string | null;
  onSuccessTransaction: (newCoins: number, newInventory: string[], newEquippedHatId: string | null) => void;
}

export function AvatarShopModal({
  isOpen,
  onClose,
  avatarId = 'pixel-bot',
  coins,
  inventory,
  equippedHatId,
  onSuccessTransaction,
}: AvatarShopModalProps) {
  const [selectedItem, setSelectedItem] = useState<AccessoryItem>(
    getAccessoryById(equippedHatId) || AVATAR_ACCESSORIES[0]
  );
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isOwned = inventory.includes(selectedItem.id);
  const isEquipped = equippedHatId === selectedItem.id;
  const canAfford = coins >= selectedItem.price;

  // Filter kategori
  const filteredItems = AVATAR_ACCESSORIES.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  const handleBuy = async () => {
    if (isProcessing) return;
    if (!canAfford) {
      soundFx.playClick();
      showToast('⚠️ Koin kamu belum cukup! Selesaikan bab koding atau kuis PR untuk dapat koin.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/student/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedItem.id }),
      });
      const data = await res.json();
      if (res.ok) {
        soundFx.playCoin();
        onSuccessTransaction(data.coins, data.inventory, equippedHatId);
        showToast(`🎉 Berhasil membeli ${selectedItem.name}! Klik 'Gunakan' untuk memakainya.`);
      } else {
        showToast(data.error || 'Gagal memproses transaksi.');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEquip = async (itemId: string | null) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/student/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (res.ok) {
        soundFx.playEquip();
        onSuccessTransaction(coins, inventory, data.equippedHatId);
        showToast(itemId ? '✨ Aksesori berhasil dipasang!' : '✨ Aksesori dilepas.');
      } else {
        showToast(data.error || 'Gagal mengubah aksesori.');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.25)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <ShoppingBag className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Toko Aksesori Avatar
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                  Roblox-Style Wardrobe
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pilih dan pasang topi, kacamata neon, atau headset favoritmu!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Saldo Koin */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-black text-sm">
              <Coins className="w-4 h-4 fill-amber-400 text-amber-300 animate-bounce" style={{ animationDuration: '3s' }} />
              <span>{coins}</span>
              <span className="text-[10px] uppercase tracking-wider text-amber-200/80 font-bold">Koin</span>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body (Grid 2 Kolom: Kiri Preview, Kanan List Item) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Kolom Kiri: Fitting Room / Cermin Avatar */}
          <div className="md:col-span-5 flex flex-col items-center justify-between p-5 rounded-2xl bg-slate-950/60 border border-slate-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

            <div className="text-center space-y-1 relative z-10">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Cermin Fitting Room</span>
              <h3 className="text-base font-bold text-white">Preview Karakter Kamu</h3>
            </div>

            {/* Avatar Preview dengan Topi Terpilih */}
            <div className="my-6 relative flex flex-col items-center">
              <AvatarDisplay
                avatarId={avatarId}
                hatId={selectedItem.id}
                size="2xl"
                showAura
                className="shadow-[0_0_30px_rgba(56,189,248,0.3)]"
              />
              <div className="mt-4 text-center">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-slate-800/80 border border-slate-700">
                  {selectedItem.name}
                </span>
                <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>
            </div>

            {/* Tombol Aksi Beli / Gunakan / Lepas */}
            <div className="w-full space-y-2 relative z-10">
              {isOwned ? (
                isEquipped ? (
                  <button
                    onClick={() => handleEquip(null)}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Lepas Aksesori</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleEquip(selectedItem.id)}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Gunakan Aksesori Ini</span>
                  </button>
                )
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={isProcessing || !canAfford}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    canAfford
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4 fill-current" />
                  <span>Beli Sekarang — {selectedItem.price} Koin</span>
                </button>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Katalog Aksesori */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            {/* Filter Tab Kategori */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'hat', label: 'Topi' },
                { id: 'headset', label: 'Headset' },
                { id: 'visor', label: 'Visor / Goggles' },
                { id: 'hood', label: 'Tudung' },
                { id: 'crown', label: 'Mahkota' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grid List Item */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const owned = inventory.includes(item.id);
                const equipped = equippedHatId === item.id;
                const isSelected = selectedItem.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedItem(item);
                    }}
                    className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-between text-center select-none ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-[1.02]'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Badge Pojok */}
                    {item.badge && (
                      <span className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {item.badge}
                      </span>
                    )}

                    {/* Mini Icon Visual */}
                    <div className="my-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <AvatarDisplay
                        avatarId={avatarId}
                        hatId={item.id}
                        size="sm"
                        showAura={false}
                      />
                    </div>

                    <div className="w-full">
                      <p className="text-xs font-bold text-white truncate" title={item.name}>
                        {item.name}
                      </p>

                      <div className="mt-1 flex items-center justify-center gap-1">
                        {equipped ? (
                          <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Terpasang
                          </span>
                        ) : owned ? (
                          <span className="text-[10px] font-semibold text-emerald-400">
                            Dimiliki
                          </span>
                        ) : (
                          <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                            <Coins className="w-3 h-3 fill-amber-400" /> {item.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-purple-900/90 text-white text-xs font-bold border border-purple-400/50 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
