"use client";

import React, { useState, useEffect, useCallback } from "react";

// --- Types ---
interface Meeting {
  id: number;
  title: string;
  meeting_date: string;
  link_url: string;
  notes: string;
  session_count: number;
  session_number: number;
  is_completed: boolean;
  progress_report: string | null;
}

interface Topic {
  id: number;
  title: string;
  order_index: number;
  description: string | null;
  project_link: string | null;
  isUnlocked: boolean;
  quiz: { id: number; title: string } | null;
}

interface Module {
  id: number;
  title: string;
  description: string | null;
  level: string;
  topics: Topic[];
}

interface QuizAttempt {
  id: number;
  quiz_id: number;
  score: number;
  total_questions: number;
  created_at: string;
  quizzes: { title: string; topics: { title: string } };
}

// --- Countdown Hook ---
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate));
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
}
function calcTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// --- Meeting Card (Student View) ---
function StudentMeetingCard({ meet }: { meet: Meeting }) {
  const timeLeft = useCountdown(meet.meeting_date);
  const now = Date.now();
  const meetTime = new Date(meet.meeting_date).getTime();
  const meetEndTime = meetTime + 60 * 60 * 1000;
  const isLive = !meet.is_completed && now >= meetTime && now < meetEndTime;
  const isCompleted = meet.is_completed;

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-3 ${isLive ? "border-red-300 ring-1 ring-red-200" : isCompleted ? "border-green-200 bg-green-50/30" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900 text-sm">{meet.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(meet.meeting_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
            {" · "}
            {new Date(meet.meeting_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex gap-1 flex-wrap justify-end">
          {meet.session_count > 1 && (
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
              Sesi {meet.session_number}/{meet.session_count}
            </span>
          )}
          {isLive && <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 animate-pulse">● LIVE</span>}
          {isCompleted && <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">✓ Selesai</span>}
        </div>
      </div>

      {/* Action */}
      {isCompleted ? (
        <div className="flex items-center justify-center w-full bg-green-100 text-green-700 rounded-lg py-2 text-sm font-medium border border-green-200">
          Kelas Selesai
        </div>
      ) : isLive && meet.link_url ? (
        <div className="relative animate-pulse rounded-lg overflow-hidden">
          <a href={meet.link_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center w-full bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors gap-2"
            style={{ animation: "none" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Bergabung Sekarang!
          </a>
        </div>
      ) : (
        <div className="text-center">
          {timeLeft && (
            <div className="flex justify-center gap-2 mb-2">
              {timeLeft.days > 0 && (
                <div className="text-center">
                  <div className="bg-slate-900 text-white rounded px-2 py-1 text-sm font-mono font-bold min-w-[28px]">{timeLeft.days}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Hari</div>
                </div>
              )}
              {[{ v: timeLeft.hours, l: "Jam" }, { v: timeLeft.minutes, l: "Mnt" }, { v: timeLeft.seconds, l: "Dtk" }].map(({ v, l }) => (
                <div key={l} className="text-center">
                  <div className="bg-slate-800 text-white rounded px-2 py-1 text-sm font-mono font-bold min-w-[28px]">{String(v).padStart(2, "0")}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-center w-full bg-slate-100 text-slate-400 rounded-lg py-2 text-sm border border-slate-200 gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Belum Waktunya
          </div>
        </div>
      )}
    </div>
  );
}

// --- Quiz Modal ---
function QuizModal({ quiz, onClose }: { quiz: Topic["quiz"]; onClose: () => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; correct: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/student/quiz?quizId=${quiz!.id}`)
      .then(r => r.json())
      .then(data => { setQuestions(data); setLoading(false); });
  }, [quiz]);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Jawab semua pertanyaan terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/student/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId: quiz!.id, answers }),
    });
    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-blue-600 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">{quiz?.title || "Quiz"}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <p className="text-slate-500 text-center">Memuat soal...</p>
          ) : result ? (
            <div className="text-center space-y-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mx-auto ${result.score >= 70 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {result.score}
              </div>
              <p className="text-xl font-semibold text-slate-900">{result.score >= 70 ? "Bagus! 🎉" : "Coba lagi ya!"}</p>
              <p className="text-slate-500">{result.correct} dari {result.total} jawaban benar</p>
              {result.attemptsCount >= 2 && (
                <p className="text-xs text-orange-600 bg-orange-50 inline-block px-3 py-1 rounded-full border border-orange-100">Batas percobaan habis. Nilai terbaikmu: {result.bestScore}</p>
              )}
              
              {/* Pembahasan Singkat / Kunci Jawaban */}
              {result.correctAnswers && (
                <div className="mt-6 text-left border border-slate-200 rounded-xl overflow-hidden text-sm">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-slate-700">Kunci Jawaban</div>
                  <div className="p-4 space-y-3 max-h-[30vh] overflow-y-auto">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                        <p className="text-slate-800 mb-1">{idx + 1}. {q.question_text}</p>
                        <p className={`font-medium ${answers[q.id] === result.correctAnswers[q.id] ? "text-green-600" : "text-red-600"}`}>
                          Jawabanmu: {answers[q.id]}
                        </p>
                        {answers[q.id] !== result.correctAnswers[q.id] && (
                          <p className="text-green-600 font-medium">Benar: {result.correctAnswers[q.id]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={onClose} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Tutup</button>
            </div>
          ) : questions.length === 0 ? (
            <p className="text-slate-500 text-center">Belum ada soal untuk quiz ini.</p>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <p className="font-medium text-slate-900">{idx + 1}. {q.question_text}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {(["A", "B", "C", "D"] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${answers[q.id] === opt ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                      >
                        <span className="font-bold mr-2">{opt}.</span>
                        {q[`option_${opt.toLowerCase()}`]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length < questions.length}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors mt-4"
              >
                {submitting ? "Mengirim..." : "Kumpulkan Jawaban"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Learning Path ---
function LearningPath({ modules, quizAttempts }: { modules: Module[], quizAttempts: any[] }) {
  // Default-open the first active (partially unlocked) module, or first module if all locked
  const defaultOpen = modules.find((m: any) => m.isModuleActive)?.id
    ?? modules.find((m: any) => !m.isModuleLocked)?.id
    ?? null;
  const [expandedModule, setExpandedModule] = useState<number | null>(defaultOpen);
  const [activeQuiz, setActiveQuiz] = useState<Topic["quiz"] | null>(null);

  if (modules.length === 0) {
    return <p className="text-slate-500 italic text-sm">Belum ada modul yang di-assign untukmu.</p>;
  }

  return (
    <div className="space-y-3">
      {modules.map((mod: any) => {
        const unlockedCount = mod.topics.filter((t: any) => t.isUnlocked).length;
        const progress = mod.topics.length > 0 ? Math.round((unlockedCount / mod.topics.length) * 100) : 0;
        const isOpen = expandedModule === mod.id;
        const isLocked = mod.isModuleLocked;
        const isComplete = mod.isModuleComplete;

        return (
          <div key={mod.id} className={`rounded-xl border overflow-hidden shadow-sm transition-all ${isLocked ? "bg-slate-50 border-slate-200 opacity-70" : isComplete ? "bg-white border-green-200" : "bg-white border-blue-200 ring-1 ring-blue-100"}`}>
            <button
              onClick={() => !isLocked && setExpandedModule(isOpen ? null : mod.id)}
              disabled={isLocked}
              className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${isLocked ? "cursor-not-allowed" : "hover:bg-slate-50/80"}`}
            >
              {/* Module icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isLocked ? "bg-slate-200 text-slate-400" : isComplete ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                {isLocked ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                ) : isComplete ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                )}
              </div>

              {/* Module info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${isLocked ? "text-slate-400" : "text-slate-900"}`}>{mod.title}</p>
                  {isLocked && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">Terkunci</span>
                  )}
                  {isComplete && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Selesai</span>
                  )}
                  {!isLocked && !isComplete && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Aktif</span>
                  )}
                </div>
                {!isLocked && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-blue-600"}`} style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">{unlockedCount}/{mod.topics.length} topik</span>
                  </div>
                )}
                {isLocked && (
                  <p className="text-xs text-slate-400 mt-0.5">Selesaikan modul sebelumnya untuk membuka modul ini</p>
                )}
              </div>

              {!isLocked && (
                <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {isLocked && (
                <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              )}
            </button>

            {isOpen && !isLocked && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {mod.topics.map((topic: any) => (
                  <div key={topic.id} className={`flex items-center gap-3 px-4 py-3 ${!topic.isUnlocked ? "opacity-50" : ""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${topic.isUnlocked ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {topic.isUnlocked ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${topic.isUnlocked ? "text-slate-800" : "text-slate-400"}`}>
                        {topic.order_index}. {topic.title}
                      </p>
                    </div>
                    {topic.isUnlocked && topic.quiz && (
                      (() => {
                        const attempt = (quizAttempts || []).find((qa: any) => qa.quiz_id === topic.quiz.id);
                        if (attempt && attempt.attempts_count >= 2) {
                          return (
                            <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                              Nilai: {attempt.score}
                            </span>
                          );
                        }
                        return (
                          <button
                            onClick={() => setActiveQuiz(topic.quiz)}
                            className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                          >
                            Quiz
                          </button>
                        );
                      })()
                    )}
                    {!topic.isUnlocked && (
                      <span className="text-xs text-slate-400">Ikuti kelas</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {activeQuiz && <QuizModal quiz={activeQuiz} onClose={() => setActiveQuiz(null)} />}
    </div>
  );
}

// --- Parent Hub ---
function ParentHub({ pastMeetings, quizAttempts }: { pastMeetings: Meeting[]; quizAttempts: QuizAttempt[] }) {
  return (
    <div className="space-y-6">
      {/* Progress Reports */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Laporan Progress Guru</h3>
        {pastMeetings.filter(m => m.is_completed && m.progress_report).length === 0 ? (
          <p className="text-sm text-slate-400 italic">Belum ada laporan progress.</p>
        ) : (
          <div className="space-y-3">
            {pastMeetings
              .filter(m => m.is_completed && m.progress_report)
              .map(meet => (
                <div key={meet.id} className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-slate-900 text-sm">{meet.title}</p>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(meet.meeting_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{meet.progress_report}</p>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Quiz Scores */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Nilai Quiz</h3>
        {quizAttempts.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Belum ada quiz yang dikerjakan.</p>
        ) : (
          <div className="space-y-2">
            {quizAttempts.map(attempt => (
              <div key={attempt.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${attempt.score >= 70 ? "bg-green-100 text-green-700" : attempt.score >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                  {attempt.score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {attempt.quizzes?.title || "Quiz"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {attempt.quizzes?.topics?.title} · {attempt.total_questions} soal
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(attempt.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Student Dashboard Page ---
export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jadwal" | "learning" | "parent">("jadwal");
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const dashRes = await fetch("/api/student/dashboard");
      if (dashRes.ok) {
        const json = await dashRes.json();
        setData(json);
        if (json.announcement) setAnnouncement(json.announcement);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs = [
    { id: "jadwal" as const, label: "Jadwal Belajar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "learning" as const, label: "Learning Path", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { id: "parent" as const, label: "Parent Hub", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  ];

  return (
    <div className="space-y-5">
      {/* Announcement Banner */}
      {announcement && (
        <div className="bg-blue-600 text-white rounded-xl px-5 py-3.5 flex items-start gap-3 shadow-md">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
          <p className="text-sm font-medium">{announcement}</p>
          <button onClick={() => setAnnouncement(null)} className="ml-auto text-white/80 hover:text-white flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-200 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          Memuat data...
        </div>
      ) : !data ? (
        <p className="text-slate-500 text-center py-10">Gagal memuat data.</p>
      ) : (
        <>
          {activeTab === "jadwal" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900">3 Jadwal Mendatang</h2>
                <span className="text-xs text-slate-500">{data.upcomingMeetings.length} jadwal</span>
              </div>
              {data.upcomingMeetings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-slate-400 text-sm">Tidak ada jadwal mendatang</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {data.upcomingMeetings.map((meet: Meeting) => (
                    <StudentMeetingCard key={meet.id} meet={meet} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "learning" && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-900">Learning Path Saya</h2>
              <LearningPath modules={data.modules} quizAttempts={data.quizAttempts || []} />
            </div>
          )}

          {activeTab === "parent" && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-900">Parent Hub</h2>
              <ParentHub pastMeetings={data.pastMeetings} quizAttempts={data.quizAttempts} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
