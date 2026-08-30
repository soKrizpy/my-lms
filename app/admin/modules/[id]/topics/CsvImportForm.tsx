"use client";

// app/admin/modules/[id]/topics/CsvImportForm.tsx
// Teacher-facing CSV upload form.
// Downloads the template from the Lesson Engine and uploads
// the filled CSV to /api/admin/topics/import-csv.

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
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ImportResponse | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const engineUrl =
    process.env.NEXT_PUBLIC_LESSON_ENGINE_URL ?? "http://localhost:3001";
  const templateUrl = `${engineUrl}/templates/lesson-template.csv`;
  const guideUrl = `${engineUrl}/templates/CSV_GUIDE.md`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFatalError(null);
    setResponse(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setFatalError("Pilih file CSV terlebih dahulu.");
      return;
    }
    if (!file.name.endsWith(".csv")) {
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
          data.error ?? "Import gagal." + (data.hint ? ` ${data.hint}` : "")
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
    }
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-blue-900">
          Import Konten Lesson via CSV
        </h2>
        <div className="flex gap-2 text-xs">
          <a
            href={templateUrl}
            download="lesson-template.csv"
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition-colors"
          >
            ⬇ Download Template
          </a>
          <a
            href={guideUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition-colors"
          >
            📖 Panduan CSV
          </a>
        </div>
      </div>

      <p className="text-xs text-blue-700 mb-3">
        Download template, isi konten lesson (LESSON + NODE + QUIZ rows),
        lalu upload di sini. Topic harus sudah dibuat terlebih dahulu.
        <code className="mx-1 bg-blue-100 px-1 rounded">lessonId</code>
        di CSV harus cocok dengan{" "}
        <code className="bg-blue-100 px-1 rounded">engine_topic_id</code>{" "}
        atau urutan topik.
      </p>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="text-xs text-slate-700 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-700 cursor-pointer"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Mengimpor…" : "Upload & Import"}
        </button>
      </form>

      {fatalError && (
        <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          ❌ {fatalError}
        </p>
      )}

      {response && (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-semibold text-slate-700">
            Hasil: {response.summary.ok}/{response.summary.total} lesson berhasil diimpor
          </p>
          {response.parseErrors.length > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              <p className="font-semibold mb-1">⚠ Baris CSV tidak dikenali:</p>
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
                className={`text-xs px-3 py-2 rounded border ${
                  r.ok
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {r.ok ? "✓" : "✗"}{" "}
                <code className="font-mono">{r.lessonId}</code>
                {r.ok ? ` — ${r.action}` : ` — ${r.error}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}