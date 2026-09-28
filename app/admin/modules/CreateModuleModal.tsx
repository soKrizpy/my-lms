// app/admin/modules/CreateModuleModal.tsx
// Simplified: JSON-only module creation.
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileJson2,
  X,
  Download,
  AlertCircle,
  Sparkles,
  Upload,
} from 'lucide-react';

interface CreateModuleModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onModuleCreated?: () => void;
}

export function CreateModuleModal({
  onClose,
  onSuccess,
}: CreateModuleModalProps) {
  const router = useRouter();

  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [jsonErrors, setJsonErrors] = useState<Array<{ path: string; message: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImportJson(e: React.FormEvent) {
    e.preventDefault();
    if (!jsonFile) {
      setError('Pilih file JSON terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);
    setJsonErrors([]);

    try {
      const text = await jsonFile.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setError('File bukan JSON yang valid. Periksa sintaks file Anda.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/modules/bulk-upload-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json() as {
        errors?: Array<{ path: string; message: string }>;
        error?: string;
        moduleId?: number;
      };

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setJsonErrors(data.errors);
          setError(data.error ?? 'Validasi JSON gagal. Lihat detail error di bawah.');
        } else {
          setError(data.error ?? 'Gagal mengupload modul.');
        }
        return;
      }

      onSuccess();
      router.push(`/admin/modules/${data.moduleId}/topics?tab=topics`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan upload JSON.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-violet-500/5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-violet-500/10">
              <Sparkles className="w-5 h-5 text-violet-500" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Buat Modul via JSON Upload
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload file .json berstruktur — modul, topik, node, dan quiz akan dibuat sekaligus.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleImportJson} className="p-6 space-y-4">

          {/* Global error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Template download */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/60">
            <div className="flex items-center gap-2">
              <FileJson2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                Download template JSON sebagai panduan format
              </span>
            </div>
            <a
              href="/templates/contoh-modul.json"
              download="contoh-modul.json"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors"
            >
              <Download className="w-3 h-3" />
              Download
            </a>
          </div>

          {/* Schema rules */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
            <p className="font-bold text-slate-800 dark:text-slate-200">Aturan validasi JSON:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">module_title</code> — wajib (string)</li>
              <li><code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">level</code> — beginner / intermediate / advanced</li>
              <li>Setiap topik wajib punya <strong>10–20 node</strong></li>
              <li>Setiap soal quiz wajib punya tepat <strong>5 pilihan jawaban</strong></li>
              <li>Reward: <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">exp_reward</code>, <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">coins_reward</code>, <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">cypeco_exp_reward</code></li>
            </ul>
          </div>

          {/* File picker */}
          <div>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setJsonFile(f);
                setError(null);
                setJsonErrors([]);
              }}
              className="hidden"
              id="modal-json-input"
            />
            <label
              htmlFor="modal-json-input"
              className={[
                'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors',
                jsonFile
                  ? 'border-violet-500 bg-violet-500/5'
                  : 'border-slate-300 dark:border-slate-700 hover:border-violet-400 bg-slate-50 dark:bg-slate-900/50',
              ].join(' ')}
            >
              {jsonFile ? (
                <>
                  <FileJson2 className="w-8 h-8 text-violet-500 mb-2" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{jsonFile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {(jsonFile.size / 1024).toFixed(1)} KB — Klik untuk mengganti
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Klik atau Drag &amp; Drop file .json di sini
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Format: module_title, level, topics[ ] dengan nodes dan post_class_quiz
                  </p>
                </>
              )}
            </label>
          </div>

          {/* Validation error list */}
          {jsonErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 max-h-52 overflow-y-auto">
              <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">
                {jsonErrors.length} error ditemukan:
              </p>
              <ul className="space-y-1.5">
                {jsonErrors.map((err, i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{err.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !jsonFile}
              className="px-5 py-2 text-xs font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Memvalidasi &amp; Upload...
                </>
              ) : (
                '🚀 Upload &amp; Buat Modul'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
