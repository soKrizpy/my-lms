"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertTriangle, FileQuestion, Sparkles, Trophy, Zap, HelpCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { getQuizQuestions } from "@/lib/quizResponse";

interface QuestionItem {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export default function StudentQuizPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('student');

  const quizIdStr = params?.quizId as string;
  const quizId = parseInt(quizIdStr, 10);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quizInfo, setQuizInfo] = useState<{
    id: number;
    title: string;
    topicTitle: string;
    moduleTitle: string;
    engineTopicId?: string | null;
  } | null>(null);
  const [attemptInfo, setAttemptInfo] = useState<{ attemptsCount: number; score: number }>({ attemptsCount: 0, score: 0 });
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    correct: number;
    attemptsCount?: number;
    bestScore?: number;
    correctAnswers?: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    if (isNaN(quizId)) {
      setErrorMsg("ID Quiz tidak valid.");
      setLoading(false);
      return;
    }

    fetch(`/api/student/quiz?quizId=${quizId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          setErrorMsg(data.error);
        } else {
          setQuizInfo(data.quiz || null);
          setAttemptInfo(data.attempt || { attemptsCount: 0, score: 0 });
          setQuestions(getQuizQuestions<QuestionItem>(data));
        }
      })
      .catch((err) => {
        console.error("Failed to load quiz data:", err);
        setErrorMsg("Gagal memuat data quiz. Pastikan koneksi terhubung.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [quizId]);

  const handleOptionSelect = (questionId: number, optionKey: string) => {
    if (submitting || result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Harap jawab semua pertanyaan sebelum mengirim jawaban.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mengirim jawaban.");
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error("Failed submitting quiz:", err);
      alert("Terjadi kesalahan jaringan saat mengirim quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      window.close();
    }
    router.push("/student");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="animate-spin w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full mb-4" />
        <p className="text-sm font-semibold text-slate-300">Memuat Soal Quiz...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Top Navbar */}
        <div className="flex items-center justify-between bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/15 p-4 rounded-2xl shadow-xl">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </button>
          {quizInfo && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                #Q{quizInfo.id}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Percobaan {(attemptInfo.attemptsCount || 0) + 1}/2
              </span>
            </div>
          )}
        </div>

        {/* Header Card */}
        {quizInfo && (
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-amber-600/30 via-orange-600/20 to-red-600/30 border border-amber-500/40 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  {quizInfo.moduleTitle}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-2 leading-tight">
                  {quizInfo.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                  Topik: {quizInfo.topicTitle}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0">
                <FileQuestion className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Error / Max Attempts / Empty State Card */}
        {errorMsg || attemptInfo.attemptsCount >= 2 || questions.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center space-y-4 border border-amber-500/40 bg-slate-900/80 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {attemptInfo.attemptsCount >= 2 ? (
              <>
                <h2 className="text-xl font-black text-amber-300">Batas Percobaan Tercapai!</h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Kamu telah menggunakan batas maksimal 2 kali percobaan untuk quiz ini. Skor terbaik kamu adalah <span className="font-bold text-amber-400">{attemptInfo.score}</span>.
                </p>
              </>
            ) : questions.length === 0 ? (
              <>
                <h2 className="text-xl font-black text-amber-300">Soal Belum Tersedia</h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Soal untuk quiz ini belum ditambahkan oleh pengajar. Silakan kembali ke dashboard atau coba lagi nanti.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black text-rose-400">Terjadi Kendala</h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">{errorMsg}</p>
              </>
            )}

            <div className="pt-4">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 transition-all"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        ) : result ? (
          /* Result Card */
          <div className="glass-panel p-8 rounded-2xl text-center space-y-6 border border-emerald-500/40 bg-slate-900/90 shadow-2xl">
            <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center mx-auto border-4 ${
              result.score >= 70
                ? "bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
                : "bg-rose-950/80 border-rose-400 text-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.3)]"
            }`}>
              <span className="text-3xl font-black tabular-nums">{result.score}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Skor</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">
                {result.score >= 70 ? "🎉 Luar Biasa! Kamu Lulus!" : "💪 Tetap Semangat!"}
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Kamu menjawab benar <span className="font-bold text-white">{result.correct}</span> dari <span className="font-bold text-white">{result.total}</span> soal.
              </p>
              {result.score >= 70 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/40 text-xs font-bold">
                  <Zap className="w-4 h-4 fill-amber-400" />
                  <span>+25 XP Berhasil Ditambahkan!</span>
                </div>
              )}
            </div>

            {/* Kunci Jawaban Review */}
            {result.correctAnswers && (
              <div className="text-left border border-slate-800 rounded-xl overflow-hidden bg-black/40 text-sm">
                <div className="px-4 py-3 bg-slate-800/60 font-bold text-slate-200 border-b border-slate-700 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Evaluasi & Kunci Jawaban</span>
                </div>
                <div className="p-4 space-y-4 max-h-[40vh] overflow-y-auto">
                  {questions.map((q, idx) => {
                    const studentAnsKey = answers[q.id];
                    const correctAnsKey = result.correctAnswers![q.id];
                    const isCorrect = studentAnsKey === correctAnsKey;
                    return (
                      <div key={q.id} className="pb-4 border-b border-slate-800 last:border-0 last:pb-0 space-y-1.5">
                        <p className="font-semibold text-slate-200">{idx + 1}. {q.question_text}</p>
                        <p className={`text-xs font-bold flex items-center gap-1.5 ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                          {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>Jawaban Kamu: ({studentAnsKey})</span>
                        </p>
                        {!isCorrect && (
                          <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Jawaban Benar: ({correctAnsKey})</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleClose}
              className="px-8 py-3 rounded-xl bg-brand-primary hover:brightness-110 text-white font-black text-sm shadow-xl shadow-brand-primary/30 transition-all cursor-pointer"
            >
              Selesai & Kembali ke Dashboard
            </button>
          </div>
        ) : (
          /* Questions List Form */
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-xl space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-black shrink-0">
                    Soal {idx + 1}
                  </span>
                  <p className="font-bold text-base text-slate-100 leading-snug pt-0.5">
                    {q.question_text}
                  </p>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { key: "A", text: q.option_a },
                    { key: "B", text: q.option_b },
                    { key: "C", text: q.option_c },
                    { key: "D", text: q.option_d },
                  ].map((opt) => {
                    const isSelected = answers[q.id] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleOptionSelect(q.id, opt.key)}
                        className={`text-left p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 border ${
                          isSelected ? "bg-amber-400 text-slate-950 border-amber-300" : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}>
                          {opt.key}
                        </span>
                        <span className="flex-1 leading-snug">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Bottom Submit Action Bar */}
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-slate-900/90 backdrop-blur-xl flex items-center justify-between sticky bottom-4 shadow-2xl">
              <span className="text-xs font-semibold text-slate-400">
                Terjawab: <span className="text-amber-300 font-bold">{Object.keys(answers).length}</span> / {questions.length}
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <span>Kirim Jawaban Quiz →</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
