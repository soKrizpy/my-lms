"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "HTML", label: "🌐 HTML (10 topik)", count: 10 },
  { value: "CSS", label: "🎨 CSS (7 topik)", count: 7 },
  { value: "JavaScript", label: "⚡ JavaScript (7 topik)", count: 7 },
  { value: "Scratch", label: "🐱 Scratch (21 topik)", count: 21 },
];

export function SeedEngineTopicsButton({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("Scratch");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    topics: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    if (
      !confirm(
        `Tambahkan semua topik ${selectedCategory} ke modul ini? Topik yang sudah ada akan dilewati.`
      )
    )
      return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/modules/${moduleId}/seed-engine-topics`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: selectedCategory }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menambahkan topik.");
        return;
      }
      setResult(data);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              selectedCategory === cat.value
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-slate-700 border-slate-300 hover:border-green-400"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSeed}
        disabled={loading}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading
          ? "Menambahkan..."
          : `🚀 Tambahkan Semua Topik ${selectedCategory}`}
      </button>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          ❌ {error}
        </p>
      )}

      {result && (
        <div className="text-xs bg-green-50 border border-green-200 rounded px-3 py-2 space-y-1">
          <p className="font-semibold text-green-800">
            ✅ {result.created} topik ditambahkan, {result.skipped} dilewati
            (sudah ada)
          </p>
          {result.topics.length > 0 && (
            <ul className="text-green-700 space-y-0.5 mt-1">
              {result.topics.slice(0, 5).map((t, i) => (
                <li key={i} className="truncate">
                  • {t}
                </li>
              ))}
              {result.topics.length > 5 && (
                <li className="text-green-600">
                  ...dan {result.topics.length - 5} lainnya
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
