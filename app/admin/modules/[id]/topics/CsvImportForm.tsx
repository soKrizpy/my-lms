"use client";

// app/admin/modules/[id]/topics/CsvImportForm.tsx
// Teacher-facing CSV upload form.
//
// FIXES:
//   1. Template/guide served from LMS /templates/ (not engine URL)
//   2. File input replaced with hidden input + styled label — dark mode safe

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ImportResult {
  lessonId: string;
  topicId: number | null;
  ok: boolean;
  action?: string;
  error?: string;
}

interface ImportResponse {
  results: ImportResult[];
  parseErrors: string[];
  summary: { total: number; ok: number };
}

export function CsvImportForm({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ImportResponse | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileName(f?.name ?? null);
    setFatalError(null);
    setResponse(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFatalError(null);
    setResponse(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setFatalError("Pilih file CSV terlebih dahulu.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFatalError("File harus berformat .csv");
      return;
    }

    const formData = new FormData();
    formData.append("csv", file);
    formData.append("moduleId", moduleId);

    try {
      setLoading(true);
      const res = await fetch("/api/admin/topics/import-csv", {
        method: "POST",
        body: formData,
      });
      const data: ImportResponse & { error?: string; hint?: string } =
        await res.json();

      if (!res.ok && !data.results) {
        setFatalError(
          (data.error ?? "Import gagal.") + (data.hint ? ` ${data.hint}` : "")
        );
        return;
      }

      setResponse(data as ImportResponse);
      if (data.results?.some((r) => r.ok)) {
        router.refresh();
      }
    } catch (err: unknown) {
      setFatalError(
        err instanceof Error ? err.message : "Terjadi kesalahan jaringan."
      );
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
      setFileName(null);
    }
  }

  return (
    <div className="rounded-lg border border-indigo-300 bg-indigo-950/40 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-indigo-200">
          Import Konten Lesson via CSV
        </h2>
        <div className="flex gap-2">
          <a
            href="/templates/lesson-template.csv"
            download="lesson-template.csv"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors"
          >
            ⬇ Download Template
          </a>
          <a
            href="/templates/CSV_GUIDE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-600 transition-colors"
          >
            📖 Panduan CSV
          </a>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-indigo-300 mb-3 leading-relaxed">
        Download template, isi konten lesson (baris LESSON + NODE + QUIZ), lalu upload.
        Topic harus sudah dibuat. Kolom{" "}
        <code className="bg-indigo-900 px-1 rounded text-indigo-100">lessonId</code>{" "}
        di CSV harus cocok dengan{" "}
        <code className="bg-indigo-900 px-1 rounded text-indigo-100">engine_topic_id</code>{" "}
        atau urutan topik.
      </p>

      {/* Upload form */}
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hidden native file input — styled label acts as the visible button */}
          <input
            ref={fileRef}
            id="csv-file-input"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="sr-only"
          />
          <label
            htmlFor="csv-file-input"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700 text-slate-100 text-xs font-semibold hover:bg-slate-600 cursor-pointer transition-colors select-none border border-slate-500"
          >
            📂 Pilih File CSV
          </label>

          {/* Selected filename display */}
          <span className="text-xs text-slate-400 truncate max-w-[180px]">
            {fileName ?? "Belum ada file dipilih"}
          </span>

          <button
            type="submit"
            disabled={loading || !fileName}
            className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Mengimpor…" : "Upload & Import"}
          </button>
        </div>
      </form>

      {/* Fatal error */}
      {fatalError && (
        <p className="mt-3 text-xs text-red-300 bg-red-950/50 border border-red-800 rounded px-3 py-2">
          ❌ {fatalError}
        </p>
      )}

      {/* Results */}
      {response && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-semibold text-slate-300">
            Hasil: {response.summary.ok}/{response.summary.total} lesson berhasil diimpor
          </p>

          {response.parseErrors.length > 0 && (
            <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-700 rounded px-3 py-2">
              <p className="font-semibold mb-1">⚠ Baris tidak dikenali:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {response.parseErrors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {response.parseErrors.length > 5 && (
                  <li>…dan {response.parseErrors.length - 5} lainnya</li>
                )}
              </ul>
            </div>
          )}

          <ul className="space-y-1">
            {response.results.map((r) => (
              <li
                key={r.lessonId}
                className={`text-xs px-3 py-2 rounded border font-mono ${
                  r.ok
                    ? "bg-green-950/40 border-green-700 text-green-300"
                    : "bg-red-950/40 border-red-800 text-red-300"
                }`}
              >
                {r.ok ? "✓" : "✗"} {r.lessonId}
                <span className="font-sans ml-1 opacity-80">
                  {r.ok ? `— ${r.action}` : `— ${r.error}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
