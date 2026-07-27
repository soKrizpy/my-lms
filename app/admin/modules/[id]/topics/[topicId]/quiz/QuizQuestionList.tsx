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
    return <p className="text-sm text-slate-500">Belum ada pertanyaan untuk quiz ini.</p>;
  }

  return (
    <>
      <ol className="space-y-3">
        {questions.map((q: any, idx: number) => (
          <li key={q.id} className="rounded-md border border-slate-200 bg-white p-3 group relative">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(q)} className="text-slate-400 hover:text-blue-600 p-1 bg-white rounded-md shadow-sm border border-slate-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button onClick={() => handleDelete(q.id)} className="text-slate-400 hover:text-red-600 p-1 bg-white rounded-md shadow-sm border border-slate-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <strong className="text-sm text-slate-900 pr-16 block">
              {idx + 1}. {q.question_text}
            </strong>
            <ul className="mt-2 ml-4 space-y-1 text-sm text-slate-700">
              <li>A. {q.option_a}</li>
              <li>B. {q.option_b}</li>
              <li>C. {q.option_c}</li>
              <li>D. {q.option_d}</li>
              <li className="pt-1 font-medium text-slate-900">
                Jawaban benar: {q.correct_option}
              </li>
            </ul>
          </li>
        ))}
      </ol>

      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Edit Pertanyaan</h2>
              <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Teks Pertanyaan</label>
                  <textarea required rows={3} value={question} onChange={e => setQuestion(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Pilihan A</label>
                    <input required value={optionA} onChange={e => setOptionA(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Pilihan B</label>
                    <input required value={optionB} onChange={e => setOptionB(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Pilihan C</label>
                    <input required value={optionC} onChange={e => setOptionC(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Pilihan D</label>
                    <input required value={optionD} onChange={e => setOptionD(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Jawaban Benar</label>
                  <select value={correct} onChange={e => setCorrect(e.target.value as any)} className="mt-1 block w-32 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                  <button type="button" onClick={() => setEditingQuestion(null)} className="px-3 py-2 text-sm text-slate-700 border rounded-md hover:bg-slate-50 mt-4">Batal</button>
                  <button type="submit" disabled={loading || !question} className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 mt-4">
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
