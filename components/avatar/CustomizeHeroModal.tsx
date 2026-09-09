'use client';

// components/avatar/CustomizeHeroModal.tsx
// Interactive Hero Customization modal for students to view, unlock, and equip avatars and rank titles.
// Supports learning path filtering (Scratch, Web Dev, Python, 3D Design, Mastery, Achievements).

import React, { useState } from 'react';
import {
  AVATARS,
  TITLES,
  CATEGORY_LABELS,
  getAvatarById,
  getTitleById,
  isItemUnlocked,
  getUnlockDescription,
  type AvatarItem,
  type TitleItem,
  type PathCategory,
  type StudentGamificationStats,
} from '@/lib/gamification/catalog';
import { AvatarDisplay } from './AvatarDisplay';

interface CustomizeHeroModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  currentAvatarId: string;
  currentTitleId: string;
  stats: StudentGamificationStats;
  onSaveProfile: (newAvatarId: string, newTitleId: string) => Promise<boolean | void> | boolean | void;
}

export function CustomizeHeroModal({
  isOpen,
  onClose,
  studentName,
  currentAvatarId,
  currentTitleId,
  stats,
  onSaveProfile,
}: CustomizeHeroModalProps) {
  const [activeTab, setActiveTab] = useState<'avatars' | 'titles'>('avatars');
  const [selectedCategory, setSelectedCategory] = useState<PathCategory | 'all'>('all');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(currentAvatarId || 'pixel-bot');
  const [selectedTitleId, setSelectedTitleId] = useState<string>(currentTitleId || 'novice-coder');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const equippedAvatar = getAvatarById(selectedAvatarId);
  const equippedTitle = getTitleById(selectedTitleId);

  // Filter avatars
  const filteredAvatars = AVATARS.filter((avatar) =>
    selectedCategory === 'all' ? true : avatar.category === selectedCategory
  );

  // Filter titles
  const filteredTitles = TITLES.filter((title) =>
    selectedCategory === 'all' ? true : title.category === selectedCategory
  );

  const handleEquipAvatar = (avatar: AvatarItem) => {
    if (!isItemUnlocked(avatar, stats)) return;
    setSelectedAvatarId(avatar.id);
  };

  const handleEquipTitle = (title: TitleItem) => {
    if (!isItemUnlocked(title, stats)) return;
    setSelectedTitleId(title.id);
  };

  const handleSaveAndApply = async () => {
    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      await onSaveProfile(selectedAvatarId, selectedTitleId);
      setFeedbackMsg('Karakter berhasil disimpan!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch {
      setFeedbackMsg('Gagal menyimpan karakter. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const categories: Array<{ id: PathCategory | 'all'; label: string; icon: string }> = [
    { id: 'all', label: 'Semua', icon: '✨' },
    { id: 'scratch', label: 'Scratch', icon: '🐱' },
    { id: 'web', label: 'Web Dev', icon: '🌐' },
    { id: 'python', label: 'Python', icon: '🐍' },
    { id: '3d', label: '3D Design', icon: '🧊' },
    { id: 'achievement', label: 'Pencapaian', icon: '🏆' },
    { id: 'mastery', label: 'Mastery', icon: '👑' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border overflow-hidden shadow-2xl"
        style={{
          background: 'var(--glass-bg, #0f172a)',
          borderColor: 'var(--glass-border, rgba(148, 163, 184, 0.2))',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(168, 85, 247, 0.15)',
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-[var(--glass-border)] bg-slate-50/75 dark:bg-slate-900/40"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🎨</span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Kustomisasi Karakter & Gelar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih avatar favorit dan gelar kebanggaanmu untuk ditampilkan di Quest Map!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Hero Preview Card ─────────────────────────────────────────────── */}
        <div
          className="px-6 py-4 border-b border-slate-200/80 dark:border-[var(--glass-border)] flex flex-col sm:flex-row items-center gap-4 justify-between bg-slate-50/50 dark:bg-transparent"
        >
          <div className="flex items-center gap-4">
            <AvatarDisplay avatarId={equippedAvatar.id} size="xl" showAura />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white">{studentName}</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider"
                  style={{
                    background: `${equippedAvatar.accentColor}20`,
                    borderColor: equippedAvatar.accentColor,
                    color: equippedAvatar.accentColor,
                  }}
                >
                  {equippedAvatar.name}
                </span>
              </div>
              {/* Equipped Title Badge */}
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:border-purple-500/50 dark:text-purple-300"
                >
                  <span>🎖️</span>
                  <span>{equippedTitle.name}</span>
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">• Level {stats.level}</span>
                {stats.streak > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">• 🔥 {stats.streak}x streak</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {feedbackMsg && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse mr-2">
                {feedbackMsg}
              </span>
            )}
            <button
              onClick={handleSaveAndApply}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)',
              }}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Karakter'}
            </button>
          </div>
        </div>

        {/* ── Main Tab Navigation ───────────────────────────────────────────── */}
        <div className="px-6 pt-3 border-b border-slate-200/80 dark:border-[var(--glass-border)] flex items-center gap-4">
          <button
            onClick={() => setActiveTab('avatars')}
            className={[
              'pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer',
              activeTab === 'avatars'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
            ].join(' ')}
          >
            Pilihan Avatar ({AVATARS.length})
          </button>
          <button
            onClick={() => setActiveTab('titles')}
            className={[
              'pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer',
              activeTab === 'titles'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
            ].join(' ')}
          >
            Gelar Kebanggaan ({TITLES.length})
          </button>
        </div>

        {/* ── Category Filter Pills ─────────────────────────────────────────── */}
        <div className="px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200/60 dark:border-white/5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={[
                'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer',
                selectedCategory === cat.id
                  ? 'bg-purple-100 border-purple-300 text-purple-900 dark:bg-purple-600/30 dark:border-purple-500 dark:text-purple-200 shadow-xs dark:shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/10',
              ].join(' ')}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* ── Scrollable Items Grid ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'avatars' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAvatars.map((avatar) => {
                const unlocked = isItemUnlocked(avatar, stats);
                const isSelected = selectedAvatarId === avatar.id;
                const unlockDesc = getUnlockDescription(avatar);
                const catMeta = CATEGORY_LABELS[avatar.category];

                return (
                  <div
                    key={avatar.id}
                    onClick={() => unlocked && handleEquipAvatar(avatar)}
                    className={[
                      'relative p-3.5 rounded-xl border flex flex-col justify-between transition-all select-none',
                      unlocked
                        ? 'cursor-pointer hover:border-purple-400/60 bg-white dark:bg-white/5 shadow-xs dark:shadow-none'
                        : 'opacity-60 bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/5',
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/40 bg-purple-50/60 dark:bg-purple-950/20'
                        : 'border-slate-200 dark:border-white/10',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <AvatarDisplay avatarId={avatar.id} size="lg" isLocked={!unlocked} showAura={unlocked} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{avatar.name}</h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-medium">
                            {catMeta.icon} {catMeta.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {avatar.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {unlocked ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span>✓</span> Terbuka
                          </span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1 font-medium">
                            <span>🔒</span> {unlockDesc}
                          </span>
                        )}
                      </span>

                      {unlocked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquipAvatar(avatar);
                          }}
                          className={[
                            'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer',
                            isSelected
                              ? 'bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent',
                          ].join(' ')}
                        >
                          {isSelected ? 'Terpasang' : 'Pilih'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTitles.map((title) => {
                const unlocked = isItemUnlocked(title, stats);
                const isSelected = selectedTitleId === title.id;
                const unlockDesc = getUnlockDescription(title);
                const catMeta = CATEGORY_LABELS[title.category];

                return (
                  <div
                    key={title.id}
                    onClick={() => unlocked && handleEquipTitle(title)}
                    className={[
                      'p-3.5 rounded-xl border flex flex-col justify-between transition-all select-none',
                      unlocked
                        ? 'cursor-pointer hover:border-purple-400/60 bg-white dark:bg-white/5 shadow-xs dark:shadow-none'
                        : 'opacity-60 bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/5',
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/40 bg-purple-50/60 dark:bg-purple-950/20'
                        : 'border-slate-200 dark:border-white/10',
                    ].join(' ')}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🎖️</span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{title.name}</h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-medium">
                          {catMeta.icon} {catMeta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5">{title.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {unlocked ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span>✓</span> Terbuka
                          </span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1 font-medium">
                            <span>🔒</span> {unlockDesc}
                          </span>
                        )}
                      </span>

                      {unlocked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquipTitle(title);
                          }}
                          className={[
                            'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer',
                            isSelected
                              ? 'bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent',
                          ].join(' ')}
                        >
                          {isSelected ? 'Terpasang' : 'Pilih'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
