// components/gamification/pet/PetSanctuaryCard.tsx
// Kartu Inkubator Cyber Pet Companion (CyPeCo) — Bits2Bytes LMS

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { soundFx } from '@/lib/audio/soundFx';
import { HATCH_QUESTION, type BabyPetSpecies } from '@/lib/pet/cypecoCatalog';

interface PetData {
  id: string;
  stage: 'EGG' | 'READY_TO_HATCH' | 'BABY_PET';
  pet_name: string;
  hatch_progress: number;
  logic_data: number;
  creative_data: number;
  spatial_data: number;
  species_id?: string | null;
  species?: BabyPetSpecies | null;
}

interface PetSanctuaryCardProps {
  coins: number;
  onCoinsChange?: (newCoins: number) => void;
  className?: string;
}

type FeedFragment = 'logic' | 'creative' | 'spatial';

export function PetSanctuaryCard({ coins, onCoinsChange, className = '' }: PetSanctuaryCardProps) {
  const [pet, setPet] = useState<PetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [eggWobble, setEggWobble] = useState(false);
  const [feedingFragment, setFeedingFragment] = useState<FeedFragment | null>(null);
  const [showHatchQuiz, setShowHatchQuiz] = useState(false);
  const [hatchingChoice, setHatchingChoice] = useState<string | null>(null);
  const [isHatching, setIsHatching] = useState(false);
  const [hatchedPet, setHatchedPet] = useState<BabyPetSpecies | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPet = useCallback(async () => {
    try {
      const res = await fetch('/api/student/pet');
      if (res.ok) {
        const data = await res.json();
        setPet(data.pet);
      }
    } catch (err) {
      console.warn('Failed to fetch CyPeCo pet:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPet(); }, [fetchPet]);

  // Egg wobble animation on tap
  const handleEggTap = () => {
    soundFx.playEggWobble();
    setEggWobble(true);
    setTimeout(() => setEggWobble(false), 500);
    if (pet?.stage === 'READY_TO_HATCH') {
      setShowHatchQuiz(true);
    }
  };

  // Feed pet with a data fragment (costs 0 coins, just uses lesson progress)
  const handleFeed = async (fragmentType: FeedFragment) => {
    if (!pet || pet.stage === 'BABY_PET') return;
    setFeedingFragment(fragmentType);
    try {
      const res = await fetch('/api/student/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'feed', fragmentType }),
      });
      const data = await res.json();
      if (res.ok) {
        soundFx.playFeed();
        setPet(data.pet);
        showToast(`+15 ${fragmentType.charAt(0).toUpperCase() + fragmentType.slice(1)} Data diserap! 🍀`);
        if (data.pet.stage === 'READY_TO_HATCH') {
          soundFx.playFanfare();
          showToast('✨ Telur siap menetas! Ketuk telurnya!');
        }
      } else {
        showToast(data.error || 'Gagal memberi makan', 'error');
      }
    } catch {
      showToast('Gagal memberi makan', 'error');
    } finally {
      setFeedingFragment(null);
    }
  };

  // Hatch the egg with personality quiz answer
  const handleHatch = async () => {
    if (!hatchingChoice || !pet) return;
    setIsHatching(true);
    try {
      const res = await fetch('/api/student/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hatch', choiceId: hatchingChoice }),
      });
      const data = await res.json();
      if (res.ok) {
        soundFx.playFanfare();
        setHatchedPet(data.hatchedSpecies);
        setPet(data.pet);
        setShowHatchQuiz(false);
      } else {
        showToast(data.error || 'Gagal menetaskan telur', 'error');
      }
    } catch {
      showToast('Gagal menetaskan telur', 'error');
    } finally {
      setIsHatching(false);
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────
  const progressPct = pet ? Math.min(100, pet.hatch_progress) : 0;
  const dataTotal = pet ? (pet.logic_data + pet.creative_data + pet.spatial_data) : 0;

  if (loading) {
    return (
      <div className={`rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5 text-center ${className}`}>
        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-xs text-slate-400">Memanggil CyPeCo...</p>
      </div>
    );
  }

  if (!pet) return null;

  return (
    <div className={`relative rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 shadow-[0_0_30px_rgba(6,182,212,0.2)] overflow-hidden ${className}`}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full text-xs font-bold shadow-lg ${
          toast.type === 'success' ? 'bg-cyan-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Cyber Pet Companion</p>
            <h3 className="text-base font-black text-white mt-0.5">
              {pet.stage === 'BABY_PET' ? (pet.species?.name || pet.pet_name) : 'CyPeCo Incubator'}
            </h3>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
            {pet.stage === 'EGG' ? '🥚 Telur' : pet.stage === 'READY_TO_HATCH' ? '🔥 Siap Menetas!' : `${pet.species?.emoji || '🐾'} Bayi`}
          </div>
        </div>

        {/* ── EGG Stage ─────────────────────────────────────────────────────── */}
        {(pet.stage === 'EGG' || pet.stage === 'READY_TO_HATCH') && (
          <>
            {/* Egg */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <button
                onClick={handleEggTap}
                className={`text-7xl select-none transition-transform focus:outline-none ${
                  eggWobble ? 'animate-bounce scale-110' : 'hover:scale-105'
                } ${pet.stage === 'READY_TO_HATCH' ? 'drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]' : ''}`}
                title={pet.stage === 'READY_TO_HATCH' ? 'Ketuk untuk menetaskan!' : 'Ketuk telurmu!'}
              >
                {pet.stage === 'READY_TO_HATCH' ? '🔥🥚🔥' : '🥚'}
              </button>
              {pet.stage === 'READY_TO_HATCH' && (
                <p className="text-amber-400 text-xs font-bold animate-pulse">
                  ✨ Ketuk telur untuk menetaskan CyPeCo kamu!
                </p>
              )}
            </div>

            {/* Hatch Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Progress Penetasan</span>
                <span className="font-black text-cyan-300">{progressPct}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Data Fragments Display */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Logic', value: pet.logic_data, color: 'text-blue-400', bg: 'bg-blue-900/40 border-blue-500/40', icon: '⚡' },
                { label: 'Creative', value: pet.creative_data, color: 'text-pink-400', bg: 'bg-pink-900/40 border-pink-500/40', icon: '🎨' },
                { label: 'Spatial', value: pet.spatial_data, color: 'text-indigo-400', bg: 'bg-indigo-900/40 border-indigo-500/40', icon: '🔷' },
              ].map((f) => (
                <div key={f.label} className={`rounded-xl p-2 border ${f.bg} text-center`}>
                  <p className="text-base">{f.icon}</p>
                  <p className={`text-sm font-black ${f.color}`}>{f.value}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{f.label}</p>
                </div>
              ))}
            </div>

            {/* Feed Buttons */}
            {pet.stage === 'EGG' && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold mb-2">Beri Data Fragment Koding:</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { type: 'logic' as FeedFragment, label: 'Logic', color: 'bg-blue-600 hover:bg-blue-500', icon: '⚡' },
                    { type: 'creative' as FeedFragment, label: 'Creative', color: 'bg-pink-600 hover:bg-pink-500', icon: '🎨' },
                    { type: 'spatial' as FeedFragment, label: 'Spatial', color: 'bg-indigo-600 hover:bg-indigo-500', icon: '🔷' },
                  ]).map((btn) => (
                    <button
                      key={btn.type}
                      onClick={() => handleFeed(btn.type)}
                      disabled={!!feedingFragment}
                      className={`${btn.color} disabled:opacity-50 text-white text-xs font-bold py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 shadow-lg`}
                    >
                      {feedingFragment === btn.type ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <><span>{btn.icon}</span> {btn.label}</>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                  💡 Selesaikan lesson koding untuk mendapat fragment otomatis!
                </p>
              </div>
            )}
          </>
        )}

        {/* ── BABY_PET Stage ────────────────────────────────────────────────── */}
        {pet.stage === 'BABY_PET' && pet.species && (
          <div className="text-center space-y-3">
            <div
              className="text-6xl mx-auto w-24 h-24 rounded-full flex items-center justify-center border-2 shadow-[0_0_30px_rgba(6,182,212,0.5)]"
              style={{ borderColor: pet.species.accentColor, background: `radial-gradient(circle, ${pet.species.accentColor}20, transparent)` }}
            >
              {pet.species.emoji}
            </div>
            <div>
              <p className="font-black text-white text-lg">{pet.species.name}</p>
              <p className="text-xs font-medium" style={{ color: pet.species.accentColor }}>{pet.species.title}</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed px-2">{pet.species.description}</p>
            <p className="text-xs text-slate-400 italic">"{pet.species.personality}"</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              {([
                { label: 'Energi', val: pet.species.stats.energy, color: '#10b981' },
                { label: 'Sahabat', val: pet.species.stats.friendship, color: '#ec4899' },
                { label: 'Intelejensi', val: pet.species.stats.intelligence, color: '#6366f1' },
              ]).map((s) => (
                <div key={s.label} className="bg-slate-800/60 rounded-xl p-2 border border-slate-700">
                  <p className="text-xs font-black" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[10px] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Data Fragment Accumulated */}
            <div className="flex justify-center gap-3 text-xs text-slate-400 mt-1">
              <span>⚡{pet.logic_data}</span>
              <span>🎨{pet.creative_data}</span>
              <span>🔷{pet.spatial_data}</span>
              <span className="text-cyan-400 font-bold">Total: {dataTotal} Data</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Hatch Quiz Modal ──────────────────────────────────────────────── */}
      {showHatchQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl border border-amber-400/50 bg-gradient-to-br from-slate-900 to-slate-800 shadow-[0_0_60px_rgba(251,191,36,0.4)] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 p-5 text-center">
              <p className="text-2xl mb-1">🥚✨🔥</p>
              <h2 className="text-lg font-black text-white">{HATCH_QUESTION.question}</h2>
              <p className="text-sm text-amber-100 mt-1">{HATCH_QUESTION.subtitle}</p>
            </div>

            {/* Choices */}
            <div className="p-5 space-y-3">
              {HATCH_QUESTION.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => setHatchingChoice(choice.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    hatchingChoice === choice.id
                      ? 'border-amber-400 bg-amber-900/40 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                      : 'border-slate-600 bg-slate-800/60 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{choice.icon}</span>
                    <div>
                      <p className="font-bold text-white text-sm">{choice.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{choice.subtext}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => { setShowHatchQuiz(false); setHatchingChoice(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors"
              >
                Nanti dulu
              </button>
              <button
                onClick={handleHatch}
                disabled={!hatchingChoice || isHatching}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black disabled:opacity-50 hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg"
              >
                {isHatching ? '🥚 Menetas...' : '🔥 Tetaskan CyPeCo!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hatch Celebration Modal ─────────────────────────────────────── */}
      {hatchedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-2xl border-2 bg-gradient-to-br from-slate-900 to-slate-800 text-center shadow-2xl overflow-hidden"
            style={{ borderColor: hatchedPet.accentColor }}
          >
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `radial-gradient(circle at center, ${hatchedPet.accentColor}25, transparent 70%)`
            }} />

            <div className="relative z-10 p-7 space-y-3">
              <p className="text-4xl animate-bounce">{hatchedPet.emoji}</p>
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1">CyPeCo Lahir!</p>
                <h2 className="text-2xl font-black text-white">{hatchedPet.name}</h2>
                <p className="text-sm font-bold mt-0.5" style={{ color: hatchedPet.accentColor }}>{hatchedPet.title}</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{hatchedPet.description}</p>
              <p className="text-xs italic text-slate-400">"{hatchedPet.personality}"</p>

              <button
                onClick={() => setHatchedPet(null)}
                className="w-full mt-4 py-3 rounded-xl font-black text-white text-base transition-all"
                style={{ background: `linear-gradient(135deg, ${hatchedPet.accentColor}, ${hatchedPet.accentColor}bb)` }}
              >
                Hore! Kenalkan ke Teman! 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
