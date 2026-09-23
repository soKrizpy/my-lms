// app/admin/modules/CreateModuleModal.tsx
"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  FileCode2,
  Upload,
  BookOpen,
  X,
  CheckCircle2,
  ArrowRight,
  Download,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface CreateModuleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "select" | "scratch" | "premade" | "csv";

const PREMADE_TEMPLATES = [
  {
    id: "html",
    category: "HTML",
    title: "HTML5 Fundamentals & Web Structure",
    description: "10 bite-sized lessons covering HTML tags, forms, tables, semantics, and personal profile mini-projects.",
    level: "beginner",
    gamification_type: "mimo",
    icon: "🌐",
    topicsCount: 10,
    color: "from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800/40",
  },
  {
    id: "css",
    category: "CSS",
    title: "Modern CSS Styling & Flexbox Layouts",
    description: "7 interactive modules teaching typography, box model, Flexbox, landing page hero sections, and professional styling.",
    level: "beginner",
    gamification_type: "mimo",
    icon: "🎨",
    topicsCount: 7,
    color: "from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800/40",
  },
  {
    id: "js",
    category: "JavaScript",
    title: "JavaScript Interactive Web & DOM Manipulation",
    description: "7 engaging lessons covering variables, events, DOM, conditionals, functions, and mini website projects.",
    level: "intermediate",
    gamification_type: "duolingo",
    icon: "⚡",
    topicsCount: 7,
    color: "from-yellow-500/10 to-amber-500/10 border-yellow-200 dark:border-yellow-800/40",
  },
  {
    id: "scratch",
    category: "Scratch",
    title: "Scratch Visual Block Coding & Games",
    description: "17 fun game projects from moving sprites to maze games, meteor dodge, and multi-stage platformers.",
    level: "beginner",
    gamification_type: "boardgame",
    icon: "🐱",
    topicsCount: 17,
    color: "from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800/40",
  },
  {
    id: "tinkercad",
    category: "3D & AR",
    title: "3D Design Tinkercad & Assembler AR",
    description: "12 multi-tier topics (Easy, Medium, Hard) covering 3D modeling, hole cuts, and Augmented Reality presentations.",
    level: "intermediate",
    gamification_type: "quest",
    icon: "🧊",
    topicsCount: 12,
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800/40",
  },
];

export function CreateModuleModal({ onClose, onSuccess }: CreateModuleModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("select");

  // Option A (Scratch) Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("beginner");
  const [gamificationType, setGamificationType] = useState("mimo");

  // Option C (CSV) State
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvModuleName, setCsvModuleName] = useState("");
  const [csvLevel, setCsvLevel] = useState("beginner");
  const [csvEngineStyle, setCsvEngineStyle] = useState("mimo");

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submit Option A: Scratch
  async function handleCreateScratch(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama modul wajib diisi.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          level,
          gamification_type: gamificationType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat modul.");

      onSuccess();
      router.push(`/admin/modules/${data.id}/topics?tab=topics`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  // Submit Option B: Premade Template
  async function handleImportPremade(template: typeof PREMADE_TEMPLATES[number]) {
    setLoading(true);
    setError(null);

    try {
      // 1. Create module
      const resMod = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.title,
          description: template.description,
          level: template.level,
          gamification_type: template.gamification_type,
        }),
      });
      const dataMod = await resMod.json();
      if (!resMod.ok) throw new Error(dataMod.error || "Gagal membuat modul.");

      const moduleId = dataMod.id;

      // 2. Seed topics
      const resSeed = await fetch(`/api/admin/modules/${moduleId}/seed-engine-topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: template.category }),
      });
      const dataSeed = await resSeed.json();
      if (!resSeed.ok) throw new Error(dataSeed.error || "Gagal mengimpor topik bawaan.");

      onSuccess();
      router.push(`/admin/modules/${moduleId}/topics?tab=topics`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan impor.");
    } finally {
      setLoading(false);
    }
  }

  // Submit Option C: CSV Import
  async function handleImportCsv(e: React.FormEvent) {
    e.preventDefault();
    if (!csvFile) {
      setError("Pilih file CSV terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Create container module
      const titleToUse = csvModuleName.trim() || csvFile.name.replace(/\.csv$/i, "");
      const resMod = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: titleToUse,
          description: `Modul hasil impor CSV: ${csvFile.name}`,
          level: csvLevel,
          gamification_type: csvEngineStyle,
        }),
      });
      const dataMod = await resMod.json();
      if (!resMod.ok) throw new Error(dataMod.error || "Gagal membuat modul container.");

      const moduleId = dataMod.id;

      // 2. Upload CSV
      const formData = new FormData();
      formData.append("csv", csvFile);
      formData.append("moduleId", String(moduleId));
      formData.append("engineStyle", csvEngineStyle);

      const resCsv = await fetch("/api/admin/topics/import-csv", {
        method: "POST",
        body: formData,
      });
      const dataCsv = await resCsv.json();
      if (!resCsv.ok && !dataCsv.results) {
        throw new Error(dataCsv.error || "Gagal mengimpor isi CSV.");
      }

      onSuccess();
      router.push(`/admin/modules/${moduleId}/topics?tab=topics`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan upload CSV.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[var(--glass-bg,white)] border border-[var(--glass-border,#e2e8f0)] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 transition-all">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--glass-border,#e2e8f0)] flex items-center justify-between bg-slate-500/5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Sparkles className="w-5 h-5 text-[var(--accent,#3b82f6)]" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary,#0f172a)]">
                {mode === "select" && "Buat Modul Pembelajaran Baru"}
                {mode === "scratch" && "Buat Modul dari Awal (Scratch)"}
                {mode === "premade" && "Pilih Template Modul Bawaan"}
                {mode === "csv" && "Bulk Upload Modul via CSV"}
              </h2>
              <p className="text-xs text-[var(--text-muted,#64748b)]">
                {mode === "select" && "Pilih metode pembuatan modul yang paling sesuai untukmu."}
                {mode === "scratch" && "Isi informasi modul baru dari awal."}
                {mode === "premade" && "Pilih dari kurikulum siap pakai yang sudah tersedia."}
                {mode === "csv" && "Upload file CSV berisi lesson, node, dan quiz secara kolektif."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MODE SELECT: 3 Option Cards */}
          {mode === "select" && (
            <div className="space-y-4">
              <div
                onClick={() => setMode("scratch")}
                className="group p-4 rounded-xl border border-[var(--glass-border,#e2e8f0)] bg-white/50 dark:bg-slate-800/50 hover:border-[var(--accent,#3b82f6)] hover:shadow-md cursor-pointer transition-all flex items-start gap-4"
              >
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 group-hover:scale-105 transition-transform">
                  <FileCode2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text-primary,#0f172a)] group-hover:text-[var(--accent,#3b82f6)]">
                      Option A: Start from Scratch
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-[var(--text-muted,#64748b)] mt-1">
                    Buat modul kosong baru, tentukan judul, tingkat kesulitan, serta pilih gamification style (Mimo, Duolingo, Quest, dll).
                  </p>
                </div>
              </div>

              <div
                onClick={() => setMode("premade")}
                className="group p-4 rounded-xl border border-[var(--glass-border,#e2e8f0)] bg-white/50 dark:bg-slate-800/50 hover:border-[var(--accent,#3b82f6)] hover:shadow-md cursor-pointer transition-all flex items-start gap-4"
              >
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text-primary,#0f172a)] group-hover:text-[var(--accent,#3b82f6)]">
                      Option B: Pick Premade Template (1-Click Import)
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-[var(--text-muted,#64748b)] mt-1">
                    Pilih modul siap pakai dari katalog Engine (HTML, CSS, JavaScript, Scratch, Tinkercad 3D) lengkap dengan topik & kuisnya.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setMode("csv")}
                className="group p-4 rounded-xl border border-[var(--glass-border,#e2e8f0)] bg-white/50 dark:bg-slate-800/50 hover:border-[var(--accent,#3b82f6)] hover:shadow-md cursor-pointer transition-all flex items-start gap-4"
              >
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text-primary,#0f172a)] group-hover:text-[var(--accent,#3b82f6)]">
                      Option C: Bulk Upload via CSV
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-[var(--text-muted,#64748b)] mt-1">
                    Upload file CSV berstruktur untuk mengimpor banyak topik, materi interaktif, dan kuis sekaligus secara otomatis.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MODE SCRATCH (Form) */}
          {mode === "scratch" && (
            <form onSubmit={handleCreateScratch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Modul *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Pemrograman Web Lanjutan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Modul
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ringkasan singkat cakupan materi pada modul ini."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Level Kesulitan
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="beginner">Beginner (Pemula / SD)</option>
                    <option value="intermediate">Intermediate (Menengah / SMP)</option>
                    <option value="advance">Advance (Mahir / SMA)</option>
                    <option value="master">Master (Expert)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gamification Engine Style
                  </label>
                  <select
                    value={gamificationType}
                    onChange={(e) => setGamificationType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="mimo">🎯 Mimo (Bite-sized Lesson Path)</option>
                    <option value="duolingo">💚 Duolingo (Hearts & Streak Skill Path)</option>
                    <option value="boardgame">🎲 Boardgame (Tile Map Progression)</option>
                    <option value="quest">⚔️ Quest (Mission & Boss Challenges)</option>
                    <option value="flashcard">📇 Flashcard (Flip & Active Recall)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode("select")}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  ← Kembali ke Pilihan Mode
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {loading ? "Memproses..." : "Buat Modul & Lanjut ke Editor →"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* MODE PREMADE (Catalog Cards) */}
          {mode === "premade" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {PREMADE_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className={`p-4 rounded-xl border bg-gradient-to-r ${tmpl.color} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tmpl.icon}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {tmpl.title}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 uppercase">
                          {tmpl.topicsCount} Topik
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleImportPremade(tmpl)}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex-shrink-0 flex items-center justify-center gap-1"
                    >
                      {loading ? "Mengimpor..." : "Import Modul Ini →"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode("select")}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  ← Kembali ke Pilihan Mode
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* MODE CSV UPLOAD */}
          {mode === "csv" && (
            <form onSubmit={handleImportCsv} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Modul Baru (Opsional, bawaan nama file)
                </label>
                <input
                  type="text"
                  value={csvModuleName}
                  onChange={(e) => setCsvModuleName(e.target.value)}
                  placeholder="Misal: Kurikulum Pemrograman CSV"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Level Kesulitan Modul
                  </label>
                  <select
                    value={csvLevel}
                    onChange={(e) => setCsvLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="beginner">Beginner (Pemula / SD)</option>
                    <option value="intermediate">Intermediate (Menengah / SMP)</option>
                    <option value="advance">Advance (Mahir / SMA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gamification Style
                  </label>
                  <select
                    value={csvEngineStyle}
                    onChange={(e) => setCsvEngineStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="mimo">🎯 Mimo-Style</option>
                    <option value="quest">⚔️ Quest-Style</option>
                    <option value="boardgame">🎲 Boardgame-Style</option>
                    <option value="flashcard">📇 Flashcard-Style</option>
                  </select>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    File CSV berstruktur *
                  </label>
                  <a
                    href="/templates/lesson-template.csv"
                    download="lesson-template.csv"
                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <Download className="w-3 h-3" /> Download CSV Template
                  </a>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setCsvFile(f);
                    setError(null);
                  }}
                  className="hidden"
                  id="modal-csv-input"
                />

                <label
                  htmlFor="modal-csv-input"
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    csvFile
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                      : "border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-900/50"
                  }`}
                >
                  <Upload className="w-8 h-8 mb-2 opacity-70" />
                  {csvFile ? (
                    <div className="text-center">
                      <p className="text-xs font-bold">{csvFile.name}</p>
                      <p className="text-[11px] opacity-70">
                        ({(csvFile.size / 1024).toFixed(1)} KB) — Klik untuk mengganti
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Klik atau Drag & Drop file CSV di sini
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Harus berformat .csv dengan baris LESSON, NODE, dan QUIZ
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode("select")}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  ← Kembali ke Pilihan Mode
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !csvFile}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {loading ? "Mengunggah..." : "Upload & Impor CSV →"}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
