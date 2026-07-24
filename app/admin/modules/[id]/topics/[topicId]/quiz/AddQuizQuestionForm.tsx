"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../../../../lib/supabaseClient";

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
      const { error } = await supabase.from("quiz_questions").insert({
        quiz_id: quizId,
        question_text: question,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_option: correct,
      });

      if (error) {
        setErrorMsg(error.message);
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
    <div
      style={{
        marginTop: "1.5rem",
        padding: "1rem",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        backgroundColor: "white",
      }}
    >
      <h2 style={{ marginBottom: "0.75rem" }}>Tambah Pertanyaan Baru</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
            Teks Pertanyaan
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1px solid #d1d5db",
            }}
            placeholder="Tuliskan pertanyaan di sini..."
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: "0.75rem",
          }}
        >
          <div>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
            >
              Pilihan A
            </label>
            <input
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #d1d5db",
              }}
              placeholder="Jawaban pilihan A"
            />
          </div>

          <div>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
            >
              Pilihan B
            </label>
            <input
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #d1d5db",
              }}
              placeholder="Jawaban pilihan B"
            />
          </div>

          <div>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
            >
              Pilihan C
            </label>
            <input
              value={optionC}
              onChange={(e) => setOptionC(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #d1d5db",
              }}
              placeholder="Jawaban pilihan C"
            />
          </div>

          <div>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
            >
              Pilihan D
            </label>
            <input
              value={optionD}
              onChange={(e) => setOptionD(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #d1d5db",
              }}
              placeholder="Jawaban pilihan D"
            />
          </div>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
            Jawaban Benar
          </label>
          <select
            value={correct}
            onChange={(e) => setCorrect(e.target.value as any)}
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              minWidth: 120,
            }}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        {errorMsg && (
          <p style={{ color: "red", marginBottom: "0.75rem" }}>{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#0f172a",
            color: "white",
            borderRadius: 6,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Menyimpan..." : "Simpan Pertanyaan"}
        </button>
      </form>
    </div>
  );
}
