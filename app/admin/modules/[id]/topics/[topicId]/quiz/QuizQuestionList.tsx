"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuizQuestionList({ questions }: { questions: any[] }) {
  const router = useRouter();
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correct, setCorrect] = useState<"A" | "B" | "C" | "D">("A");

  const handleEdit = (q: any) => {
    setEditingQuestion(q);
    setQuestion(q.question_text);
    setOptionA(q.option_a);
    setOptionB(q.option_b);
    setOptionC(q.option_c);
    setOptionD(q.option_d);
    setCorrect(q.correct_option as "A" | "B" | "C" | "D");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingQuestion.id,
          question,
          optionA,
          optionB,
          optionC,
          optionD,
          correct
        }),
      });
      if (res.ok) {
        setEditingQuestion(null);
        router.refresh();
      } else {
        alert("Gagal mengubah pertanyaan.");
      }
    } catch {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus pertanyaan ini?")) return;
    try {
      const res = await fetch(`/api/quiz?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Gagal menghapus pertanyaan.");
      }
    } catch {
      alert("Terjadi kesalahan.");
    }
  };

  if (!questions || questions.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada pertanyaan untuk quiz ini.</p>;
  }

  return (
    <>
      <ol className="space-y-3">
        {questions.map((q: any, idx: number) => (
          <li key={q.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 group relative shadow-sm">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(q)} className="text-slate-400 hover:text-blue-600 p-1 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button onClick={() => handleDelete(q.id)} className="text-slate-400 hover:text-red-600 p-1 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <strong className="text-sm font-bold text-slate-900 dark:text-white pr-16 block">
              {idx + 1}. {q.question_text}
            </strong>
            <ul className="mt-2 ml-4 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <li>A. {q.option_a}</li>
              <li>B. {q.option_b}</li>
              <li>C. {q.option_c}</li>
              <li>D. {q.option_d}</li>
              <li className="pt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                Jawaban benar: {q.correct_option}
              </li>
            </ul>
          </li>
        ))}
      </ol>

      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Pertanyaan</h2>
              <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Teks Pertanyaan</label>
                  <textarea required rows={3} value={question} onChange={e => setQuestion(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5" />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Pilihan A</label>
                    <input required value={optionA} onChange={e => setOptionA(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Pilihan B</label>
                    <input required value={optionB} onChange={e => setOptionB(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Pilihan C</label>
                    <input required value={optionC} onChange={e => setOptionC(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Pilihan D</label>
                    <input required value={optionD} onChange={e => setOptionD(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Jawaban Benar</label>
                  <select value={correct} onChange={e => setCorrect(e.target.value as any)} className="mt-1 block w-32 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5">
                    <option value="A" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">A</option>
                    <option value="B" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">B</option>
                    <option value="C" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">C</option>
                    <option value="D" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">D</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
                  <button type="button" onClick={() => setEditingQuestion(null)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Batal</button>
                  <button type="submit" disabled={loading || !question} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-colors">
                    {loading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
