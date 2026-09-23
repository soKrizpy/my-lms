"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AddQuizQuestionForm({ quizId }: { quizId: number }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correct, setCorrect] = useState<"A" | "B" | "C" | "D">("A");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!question.trim()) {
      setErrorMsg("Teks pertanyaan wajib diisi.");
      return;
    }
    if (
      !optionA.trim() ||
      !optionB.trim() ||
      !optionC.trim() ||
      !optionD.trim()
    ) {
      setErrorMsg("Semua pilihan jawaban wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          question: question.trim(),
          optionA: optionA.trim(),
          optionB: optionB.trim(),
          optionC: optionC.trim(),
          optionD: optionD.trim(),
          correct,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.error ?? 'Terjadi kesalahan.');
        return;
      }

      setQuestion("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrect("A");

      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">
        Tambah Pertanyaan Baru
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Teks Pertanyaan
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="Tuliskan pertanyaan di sini..."
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Pilihan A
            </label>
            <input
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Jawaban pilihan A"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Pilihan B
            </label>
            <input
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Jawaban pilihan B"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Pilihan C
            </label>
            <input
              value={optionC}
              onChange={(e) => setOptionC(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Jawaban pilihan C"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Pilihan D
            </label>
            <input
              value={optionD}
              onChange={(e) => setOptionD(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Jawaban pilihan D"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Jawaban Benar
          </label>
          <select
            value={correct}
            onChange={(e) =>
              setCorrect(e.target.value as "A" | "B" | "C" | "D")
            }
            className="min-w-[120px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="A" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">A</option>
            <option value="B" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">B</option>
            <option value="C" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">C</option>
            <option value="D" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">D</option>
          </select>
        </div>

        {errorMsg && <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan Pertanyaan"}
        </button>
      </form>
    </div>
  );
}
