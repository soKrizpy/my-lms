"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, BookOpen, Users, Sparkles, Trophy, CheckCircle2 } from "lucide-react";
import { MagicalParticles } from "@/components/MagicalParticles";
import { MagicalCounter } from "@/components/MagicalCounter";
import { useLmsEngineListener } from "@/lib/useLmsEngineListener";

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
  globalIndex: number;
  meeting_students?: { student_id: string; has_joined: boolean }[];
}

interface Topic {
  id: number;
  title: string;
  order_index: number;
  description: string | null;
  project_link: string | null;
  engine_topic_id: string | null;
  status?: string | null;
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

interface TopicProgress {
  engine_topic_id: string;
  topic_id: number;
  xp_earned: number;
  best_quiz_score: number;
  completed_at: string;
  topics?: { title: string } | null;
}

// --- Countdown Hook ---
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
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof calcTimeLeft>>(null);
  useEffect(() => {
    setTimeLeft(calcTimeLeft(targetDate));
    if (!calcTimeLeft(targetDate)) return;
    const timer = setInterval(() => {
      const left = calcTimeLeft(targetDate);
      setTimeLeft(left);
      if (!left) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
}

// --- Synopsis Floating Panel ---
function SynopsisPanel({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-md glass-panel shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-blue-600">
          <div>
            <p className="text-xs font-medium text-blue-100 uppercase tracking-wide">Sinopsis Materi</p>
            <h3 className="font-bold text-white text-base mt-0.5 leading-snug">{topic.title}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {topic.description ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {topic.description.replace(/<[^>]*>?/gm, "")}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">Tidak ada sinopsis untuk topik ini.</p>
          )}
        </div>

        {/* Footer - project link */}
        {topic.project_link && (
          <div className="p-4 border-t border-slate-100">
            <a
              href={topic.project_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" />
              </svg>
              Buka Link Project
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Meeting Card (Student View) ---
function StudentMeetingCard({ meet, modules, quizAttempts, onRefresh }: { meet: Meeting, modules: Module[], quizAttempts: any[], onRefresh: () => void }) {
  const [synopsisOpen, setSynopsisOpen] = useState(false);
  const timeLeft = useCountdown(meet.meeting_date);
  const now = Date.now();
  const meetTime = new Date(meet.meeting_date).getTime();
  const meetEndTime = meetTime + 60 * 60 * 1000;

  // Can join live for the first 60 minutes
  const canJoinLive = !meet.is_completed && now >= meetTime && now < meetEndTime;
  // Is live for the whole hour just for the badge
  const isLive = !meet.is_completed && now >= meetTime && now < meetEndTime;
  const isCompleted = meet.is_completed;
  const canReportProgress = !isCompleted && now > meetEndTime && !meet.progress_report;
  const hasJoined = !!meet.meeting_students?.[0]?.has_joined;

  // Find the topic corresponding to this meeting's global index (cycles through topics)
  const allTopics = modules.flatMap(m => m.topics);
  const topicForThisMeeting = allTopics.length > 0
    ? allTopics[meet.globalIndex % allTopics.length]
    : undefined;
  const quizId = topicForThisMeeting?.quiz?.id;
  const hasAttempted = quizId ? quizAttempts.some(qa => qa.quiz_id === quizId) : false;

  return (
    <>
      {synopsisOpen && topicForThisMeeting && (
        <SynopsisPanel topic={topicForThisMeeting} onClose={() => setSynopsisOpen(false)} />
      )}

      <div className={`glass-panel rounded-lg shadow-sm p-4 hover:-translate-y-1 transition-all duration-300 relative group ${isCompleted ? "border-brand-secondary/30 bg-brand-secondary/10" : canReportProgress ? "border-orange-500/30 bg-orange-500/10" : ""}`}>
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

        {/* Material quick-access buttons — locked until student has joined */}
        {!isCompleted && topicForThisMeeting && (topicForThisMeeting.description || topicForThisMeeting.project_link) && (
          <div className="flex gap-2 mt-3">
            {topicForThisMeeting.description && (
              hasJoined ? (
                <button
                  onClick={() => setSynopsisOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Sinopsis
                </button>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed select-none"
                  title="Bergabung ke kelas untuk membuka"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Sinopsis
                </div>
              )
            )}
            {topicForThisMeeting.project_link && (
              hasJoined ? (
                <a
                  href={topicForThisMeeting.project_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" />
                  </svg>
                  Link Project
                </a>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed select-none"
                  title="Bergabung ke kelas untuk membuka"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Link Project
                </div>
              )
            )}
          </div>
        )}

        {/* Action */}
        {isCompleted || now >= meetEndTime ? (
          meet.meeting_students?.[0]?.has_joined ? (
            hasAttempted ? (
              <div className="flex items-center justify-center w-full bg-green-100 text-green-700 rounded-lg py-2 text-sm font-medium border border-green-200 mt-3">
                Kelas Selesai
              </div>
            ) : (
              <div className="flex items-center justify-center w-full bg-orange-100 text-orange-700 rounded-lg py-2 text-sm font-medium border border-orange-200 mt-3">
                Selesaikan Quiz
              </div>
            )
          ) : (
            <div className="flex items-center justify-center w-full bg-red-100 text-red-700 rounded-lg py-2 text-sm font-medium border border-red-200 mt-3">
              Tidak Hadir (Missing Class)
            </div>
          )
        ) : canJoinLive && meet.link_url ? (
          <div className="relative animate-pulse rounded-lg overflow-hidden mt-3">
            <a href={meet.link_url} target="_blank" rel="noopener noreferrer"
              onClick={() => {
                fetch("/api/student/meetings/join", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ meetingId: meet.id }),
                }).then(() => onRefresh());
              }}
              className="flex items-center justify-center w-full bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors gap-2"
              style={{ animation: "none" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Bergabung Sekarang!
            </a>
          </div>
        ) : (
          <div className="text-center mt-3">
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
    </>
  );
}

// --- Quiz Modal ---
function QuizModal({ quiz, onClose, onComplete }: { quiz: Topic["quiz"]; onClose: () => void; onComplete: () => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; correct: number; attemptsCount?: number; bestScore?: number; correctAnswers?: Record<string, string> } | null>(null);
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
    if (!res.ok) {
      alert(data.error || "Gagal mengirim kuis.");
    } else {
      setResult(data);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-panel rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
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
              {(result.attemptsCount ?? 0) >= 2 && (
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
                        <p className={`font-medium ${answers[q.id] === result.correctAnswers![q.id] ? "text-green-600" : "text-red-600"}`}>
                          Jawabanmu: {answers[q.id]}
                        </p>
                        {answers[q.id] !== result.correctAnswers![q.id] && (
                          <p className="text-green-600 font-medium">Benar: {result.correctAnswers![q.id]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => { onComplete(); onClose(); }} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Tutup</button>
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
function LearningPath({ modules, quizAttempts, onRefresh }: { modules: Module[], quizAttempts: any[], onRefresh: () => void }) {
  // Default-open the first active (partially unlocked) module, or first module if all locked
  const defaultOpen = modules.find((m: any) => m.isModuleActive)?.id
    ?? modules.find((m: any) => !m.isModuleLocked)?.id
    ?? null;
  const [expandedModule, setExpandedModule] = useState<number | null>(defaultOpen);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Topic["quiz"] | null>(null);
  const [openSynopsis, setOpenSynopsis] = useState<Record<number, boolean>>({});

  const toggleSynopsis = (topicId: number) =>
    setOpenSynopsis((prev) => ({ ...prev, [topicId]: !prev[topicId] }));

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
          <div key={mod.id} className={`rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${isLocked ? "glass-panel opacity-50 cursor-not-allowed" : isComplete ? "glass-panel border border-brand-secondary/50 hover:shadow-brand-secondary/20" : "glass-panel border border-brand-primary glow-primary hover:-translate-y-1"}`}>
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
                {mod.topics.map((topic: any) => {
                  const attempt = topic.isUnlocked && topic.quiz ? (quizAttempts || []).find((qa: any) => qa.quiz_id === topic.quiz.id) : null;
                  const isTopicExpanded = expandedTopic === topic.id;

                  return (
                    <div key={topic.id} className="flex flex-col">
                      <div className={`flex items-center gap-3 px-4 py-3 ${!topic.isUnlocked ? "opacity-50" : ""}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold self-start mt-0.5 ${topic.isUnlocked ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
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
                          {topic.isUnlocked && topic.description && (
                            <>
                              <button
                                onClick={() => toggleSynopsis(topic.id)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
                              >
                                <span>{openSynopsis[topic.id] ? "Tutup sinopsis" : "Lihat sinopsis"}</span>
                                <svg
                                  className={`w-3.5 h-3.5 transition-transform ${openSynopsis[topic.id] ? "rotate-180" : ""}`}
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {openSynopsis[topic.id] && (
                                <div className="text-xs text-slate-600 mt-2 max-h-48 overflow-y-auto pr-2 whitespace-pre-wrap leading-relaxed border-l-2 border-blue-100 pl-2">
                                  {topic.description.replace(/<[^>]*>?/gm, "")}
                                </div>
                              )}
                            </>
                          )}
                          {topic.isUnlocked && topic.project_link && (
                            <a
                              href={topic.project_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1 font-medium"
                            >
                              <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                              Link Project
                            </a>
                          )}
                          {topic.isUnlocked && topic.engine_topic_id && (
                            topic.status === 'published' ? (
                              <a
                                href={`${process.env.NEXT_PUBLIC_LESSON_ENGINE_URL || 'http://localhost:3001'}/lesson/${topic.engine_topic_id}?lmsOrigin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&lang=${typeof document !== 'undefined' ? (document.cookie.split('; ').find(r => r.startsWith('locale='))?.split('=')[1] ?? 'id') : 'id'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg mt-2 font-semibold shadow-sm transition-colors w-max"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Mulai Belajar
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg mt-2 font-medium w-max">
                                ⏳ Lesson segera tersedia
                              </span>
                            )
                          )}
                        </div>
                        {topic.isUnlocked && topic.quiz && (
                          <div className="flex items-center gap-2 self-start mt-0.5">
                            {attempt && attempt.attempts_count >= 2 ? (
                              <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                                Nilai: {attempt.score}
                              </span>
                            ) : (
                              <button
                                onClick={() => setActiveQuiz(topic.quiz)}
                                className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                              >
                                Quiz
                              </button>
                            )}
                            {attempt && (
                              <button 
                                onClick={() => setExpandedTopic(isTopicExpanded ? null : topic.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded"
                              >
                                <svg className={`w-4 h-4 transition-transform ${isTopicExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                        {!topic.isUnlocked && (
                          <span className="text-xs text-slate-400 self-start mt-0.5">Ikuti kelas</span>
                        )}
                      </div>
                      
                      {isTopicExpanded && attempt && (
                        <div className="px-14 pb-4 pt-1 bg-slate-50/50">
                          <div className="text-xs border border-slate-200 rounded-md p-3 bg-white shadow-sm space-y-2">
                            <h4 className="font-semibold text-slate-700 mb-1">Riwayat Kuis</h4>
                            <div className="flex justify-between items-center text-slate-600 border-b border-slate-100 pb-1">
                              <span>Percobaan Terpakai</span>
                              <span className="font-medium text-slate-800">{attempt.attempts_count} / 2</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Nilai Terbaik</span>
                              <span className={`font-bold ${attempt.score >= 70 ? 'text-green-600' : 'text-orange-600'}`}>{attempt.score} / 100</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {activeQuiz && <QuizModal quiz={activeQuiz} onClose={() => setActiveQuiz(null)} onComplete={onRefresh} />}
    </div>
  );
}

// --- Engine Lesson Progress ---
function EngineProgressSection({ topicProgress }: { topicProgress: TopicProgress[] }) {
  if (!topicProgress || topicProgress.length === 0) {
    return (
      <div className="text-center py-8 glass-panel rounded-xl">
        <p className="text-slate-400 text-sm">Belum ada lesson engine yang diselesaikan.</p>
        <p className="text-slate-500 text-xs mt-1">Selesaikan lesson interaktif untuk melihat progress di sini.</p>
      </div>
    );
  }

  const totalXp = topicProgress.reduce((s, t) => s + (t.xp_earned || 0), 0);
  const avgScore = topicProgress.length > 0
    ? Math.round(topicProgress.reduce((s, t) => s + (t.best_quiz_score || 0), 0) / topicProgress.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-yellow-400">⭐ {totalXp}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total XP</p>
        </div>
        <div className="glass-panel rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-green-400">{topicProgress.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Lesson Selesai</p>
        </div>
        <div className="glass-panel rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-blue-400">{avgScore}%</p>
          <p className="text-xs text-slate-400 mt-0.5">Rata-rata Quiz</p>
        </div>
      </div>

      {/* Per-lesson cards */}
      <div className="space-y-2">
        {topicProgress.map((tp) => {
          const scorePercent = tp.best_quiz_score;
          const scoreColor = scorePercent >= 80
            ? 'text-green-400' : scorePercent >= 60
            ? 'text-yellow-400' : 'text-red-400';
          const lessonTitle = tp.topics?.title ?? tp.engine_topic_id;
          const completedDate = new Date(tp.completed_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
          });

          return (
            <div
              key={tp.engine_topic_id}
              className="glass-panel rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)] bg-black/5">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{lessonTitle}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{tp.engine_topic_id}</p>
                </div>
                <span className="text-xs text-slate-400 ml-3 whitespace-nowrap">{completedDate}</span>
              </div>
              <div className="flex divide-x divide-[var(--glass-border)]">
                {/* XP */}
                <div className="flex-1 px-4 py-3 flex flex-col items-center">
                  <span className="text-lg font-black text-yellow-400">⭐ {tp.xp_earned}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">XP</span>
                </div>
                {/* Quiz score */}
                <div className="flex-1 px-4 py-3 flex flex-col items-center">
                  <span className={`text-lg font-black ${scoreColor}`}>{scorePercent}%</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Nilai Quiz</span>
                </div>
                {/* Achievement badge */}
                <div className="flex-1 px-4 py-3 flex flex-col items-center justify-center">
                  <span className="text-xl" title="Lesson selesai">🏆</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Achievement</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Parent Hub ---
function ParentHub({ pastMeetings, quizAttempts, modules, topicProgress }: { pastMeetings: Meeting[]; quizAttempts: QuizAttempt[]; modules: Module[]; topicProgress: TopicProgress[] }) {
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({});
  
  const toggleModule = (id: number) => {
    setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Only show completed meetings
  const completedMeetings = pastMeetings.filter(m => m.is_completed);

  if (completedMeetings.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic text-center py-10">Belum ada kelas yang selesai.</p>
    );
  }

  let globalIndexCounter = 0;

  return (
    <div className="space-y-4">
      {modules.map((mod) => {
        const startIndex = globalIndexCounter;
        const endIndex = startIndex + mod.topics.length;
        globalIndexCounter = endIndex;
        
        const moduleMeetings = completedMeetings.filter(m => m.globalIndex >= startIndex && m.globalIndex < endIndex);
        
        if (moduleMeetings.length === 0) return null;

        const isOpen = openModules[mod.id] ?? true; // Default open

        return (
          <div key={mod.id} className="glass-panel rounded-xl shadow-sm overflow-hidden">
            {/* Module Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-100"
              onClick={() => toggleModule(mod.id)}
            >
              <h3 className="font-bold text-slate-900">{mod.title}</h3>
              <svg className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {/* Module Content */}
            {isOpen && (
              <div className="p-4 space-y-4 bg-slate-50/50">
                {moduleMeetings.map(meet => {
                  const topic = mod.topics[meet.globalIndex - startIndex];
                  const cardTitle = topic?.title || meet.title;
                  const quizId = topic?.quiz?.id;
                  const quizAttempt = quizId ? quizAttempts.find(qa => qa.quiz_id === quizId) : null;

                  return (
                    <div key={meet.id} className="glass-panel rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Card Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)] bg-black/5">
                        <p className="font-semibold text-slate-800 text-sm">{cardTitle}</p>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(meet.meeting_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="flex divide-x divide-slate-100">
                        {/* Teacher Report */}
                        <div className="flex-1 p-4 min-w-0">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Laporan Guru</p>
                          {meet.progress_report ? (
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{meet.progress_report}</p>
                          ) : (
                            <p className="text-sm text-slate-400 italic">Laporan belum tersedia.</p>
                          )}
                        </div>

                        {/* Quiz Score */}
                        <div className="w-36 shrink-0 p-4 flex flex-col items-center justify-center gap-1 text-center bg-slate-50/30">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Nilai Quiz</p>
                          {quizAttempt ? (
                            <>
                              <span className={`text-2xl font-bold ${quizAttempt.score >= 70 ? "text-green-600" : quizAttempt.score >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                                {quizAttempt.score}
                              </span>
                              <span className="text-xs text-slate-400">{quizAttempt.total_questions} soal</span>
                            </>
                          ) : (
                            <p className="text-xs text-slate-400 italic leading-snug">Quiz belum dikerjakan.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Engine Lesson Progress */}
      {topicProgress.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>⭐</span> Progress Lesson Engine
          </h3>
          <EngineProgressSection topicProgress={topicProgress} />
        </div>
      )}
    </div>
  );
}

// --- Invoice Banner Component ---
function InvoiceBanner({ invoice }: { invoice: any }) {
  const [visible, setVisible] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [paidState, setPaidState] = useState(invoice.status === 'paid');

  useEffect(() => {
    // If it's paid, we show the success banner for 5 seconds, then hide permanently
    if (invoice.status === 'paid') {
      const isDismissed = localStorage.getItem(`invoice_dismissed_${invoice.id}`);
      if (isDismissed) {
        setVisible(false);
      } else {
        const timer = setTimeout(() => {
          setVisible(false);
          localStorage.setItem(`invoice_dismissed_${invoice.id}`, 'true');
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [invoice]);

  if (!visible) return null;

  if (paidState) {
    return (
      <div className="bg-green-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
        <div className="bg-white/20 p-2 rounded-full">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <div className="flex-1">
          <p className="font-bold">Terima Kasih!</p>
          <p className="text-sm text-green-100">Tagihan bulan {invoice.month_year} sudah dibayar lunas.</p>
        </div>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-white/20 p-1.5 rounded-full flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-bold text-sm truncate">
            Tagihan {invoice.month_year}: Rp {invoice.total_amount.toLocaleString('id-ID')}
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
          title="Buka Detail"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl shadow-2xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-white/20 p-2 rounded-full flex-shrink-0">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="font-bold">Tagihan Bulan {invoice.month_year}</p>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 -mr-1 -mt-1 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0 text-blue-100 hover:text-white"
            title="Ciutkan"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-blue-100 mt-1">
          {invoice.attended_meetings} Kehadiran x Rp {invoice.price_per_meeting.toLocaleString('id-ID')}
        </p>
        <p className="text-lg font-bold mt-2">Rp {invoice.total_amount.toLocaleString('id-ID')}</p>
        <div className="mt-3 pt-3 border-t border-blue-400/50">
          <p className="text-xs text-blue-100 mb-1">Transfer ke rekening:</p>
          <p className="text-sm font-semibold tracking-wide bg-black/20 p-2 rounded-lg text-center break-all">
            {invoice.bank_account}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main Student Dashboard Page ---
export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jadwal" | "learning" | "parent">("jadwal");
  const [announcement, setAnnouncement] = useState<string | null>(null);


  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/student/invoices");
      if (res.ok) {
        const invs = await res.json();
        setInvoices(invs);
      }
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    }
  };

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

  // Sync lesson engine events (quiz score + XP) to Supabase via postMessage
  useLmsEngineListener({ onSynced: () => { void fetchData(); } });

  useEffect(() => { 
    fetchData(); 
    fetchInvoices();
  }, [fetchData]);

  const tabs = [
    { id: "jadwal" as const, label: "Jadwal Belajar", icon: Calendar },
    { id: "learning" as const, label: "Learning Path", icon: BookOpen },
    { id: "parent" as const, label: "Parent Hub", icon: Users },
  ];

  return (
    <div className="space-y-5 relative">
      {/* Invoice Banners */}
      <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 w-full max-w-lg z-40 flex flex-col gap-3 px-4 pointer-events-none">
        {invoices.map((inv) => (
          <div key={inv.id} className="pointer-events-auto">
            <InvoiceBanner invoice={inv} />
          </div>
        ))}
      </div>

      {/* Fantasy Magical Greeting Card */}
      {!loading && data?.studentName && (
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 shadow-2xl transition-all text-white bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#1d4ed8] border border-blue-300/40 shadow-blue-600/20 dark:from-[#080516] dark:via-[#13092b] dark:to-[#080516] dark:border-purple-500/50 dark:shadow-[0_0_30px_rgba(168,85,247,0.35)]">
          {/* Ambient Magical Stardust Canvas */}
          <MagicalParticles colorScheme="rainbow" density={65} className="absolute inset-0 pointer-events-none z-0" />

          {/* Deep Nebula & Mana Glow Overlays */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-cyan-400/30 dark:bg-purple-600/30 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-blue-300/25 dark:bg-pink-500/20 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 rounded-full bg-indigo-400/20 dark:bg-purple-500/20 blur-3xl pointer-events-none" />

          {/* Floating Decorative Constellation Sparkles */}
          <div className="absolute top-3 right-1/3 text-amber-200/80 dark:text-amber-300/70 text-xs pointer-events-none animate-ping" style={{ animationDuration: '4s' }}>✦</div>
          <div className="absolute bottom-3 right-1/4 text-cyan-200/80 dark:text-purple-300/70 text-sm pointer-events-none animate-pulse">✧</div>
          <div className="absolute top-4 left-1/2 text-white/90 dark:text-cyan-300/80 text-xs pointer-events-none animate-bounce" style={{ animationDuration: '5s' }}>⋆</div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 dark:bg-purple-600/30 border border-white/35 dark:border-purple-400/50 text-white dark:text-purple-200 text-xs font-semibold backdrop-blur-md shadow-sm mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="tracking-wide">Student Quest Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                Halo, {data.studentName}! <span className="inline-block hover:scale-125 transition-transform cursor-default animate-bounce" style={{ animationDuration: '3s' }}>✨</span>
              </h1>
              <p className="text-sm text-blue-100/95 dark:text-purple-200/90 max-w-lg leading-relaxed font-medium">
                Siap melanjutkan petualangan koding hari ini? Selesaikan modul dan taklukkan tantangannya!
              </p>
            </div>

            {/* Live Stats Magical Badges */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Completed Classes */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/15 dark:bg-black/60 border border-white/25 dark:border-purple-500/40 backdrop-blur-xl shadow-lg shadow-blue-950/20 dark:shadow-black/30 hover:border-emerald-300/60 dark:hover:border-emerald-400/50 transition-all">
                <div className="p-2 rounded-lg bg-emerald-400/25 border border-emerald-300/40 text-emerald-200 dark:text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-blue-100 dark:text-purple-300/80 font-bold">Selesai</div>
                  <div className="text-base font-black text-white tabular-nums flex items-center gap-1">
                    <MagicalCounter value={data.pastMeetings?.filter((m: any) => m.is_completed)?.length || 0} />
                    <span className="text-xs font-medium text-blue-100/90 dark:text-slate-300">Sesi</span>
                  </div>
                </div>
              </div>

              {/* Quizzes / Challenges */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/15 dark:bg-black/60 border border-white/25 dark:border-purple-500/40 backdrop-blur-xl shadow-lg shadow-blue-950/20 dark:shadow-black/30 hover:border-amber-300/60 dark:hover:border-amber-400/50 transition-all">
                <div className="p-2 rounded-lg bg-amber-400/25 border border-amber-300/40 text-amber-200 dark:text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-blue-100 dark:text-purple-300/80 font-bold">Quiz</div>
                  <div className="text-base font-black text-white tabular-nums flex items-center gap-1">
                    <MagicalCounter value={data.quizAttempts?.length || 0} />
                    <span className="text-xs font-medium text-blue-100/90 dark:text-slate-300">Selesai</span>
                  </div>
                </div>
              </div>

              {/* Engine XP Total — only shown when student has completed engine lessons */}
              {(data.engineXpTotal ?? 0) > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/15 dark:bg-black/60 border border-white/25 dark:border-purple-500/40 backdrop-blur-xl shadow-lg shadow-blue-950/20 dark:shadow-black/30 hover:border-yellow-300/60 dark:hover:border-yellow-400/50 transition-all">
                  <div className="p-2 rounded-lg bg-yellow-400/25 border border-yellow-300/40 text-yellow-200 dark:text-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                    <span className="text-sm" aria-hidden="true">⭐</span>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-blue-100 dark:text-purple-300/80 font-bold">XP</div>
                    <div className="text-base font-black text-white tabular-nums flex items-center gap-1">
                      <MagicalCounter value={data.engineXpTotal || 0} />
                      <span className="text-xs font-medium text-blue-100/90 dark:text-slate-300">pts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Desktop / Tablet Top Tabs */}
      <div className="flex gap-2 p-1.5 glass-panel rounded-2xl border border-[var(--glass-border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                active
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30 glow-primary"
                  : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Floating Bottom Dock (Jadwal Belajar, Learning Path, Parent Hub) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 glass-panel rounded-2xl p-1.5 flex items-center justify-around shadow-2xl border border-[var(--glass-border)] bg-slate-900/85 backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all cursor-pointer ${
                active
                  ? "text-brand-secondary font-bold scale-105"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-brand-secondary animate-pulse" : "opacity-80"}`} />
              <span className="text-[10px] mt-1 tracking-tight font-semibold">{tab.label}</span>

              {/* Active Indicator Glow Pill */}
              {active && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-brand-secondary shadow-[0_0_8px_var(--color-brand-secondary)]" />
              )}
            </button>
          );
        })}
      </nav>

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
                <div className="text-center py-12 glass-panel rounded-xl">
                  <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-slate-400 text-sm">Tidak ada jadwal mendatang</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {data.upcomingMeetings.map((meet: Meeting) => (
                    <StudentMeetingCard key={meet.id} meet={meet} modules={data.modules || []} quizAttempts={data.quizAttempts || []} onRefresh={fetchData} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "learning" && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-900">Learning Path Saya</h2>
              <LearningPath modules={data.modules} quizAttempts={data.quizAttempts || []} onRefresh={fetchData} />
            </div>
          )}

          {activeTab === "parent" && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-900">Parent Hub</h2>
              <ParentHub pastMeetings={data.pastMeetings} quizAttempts={data.quizAttempts} modules={data.modules || []} topicProgress={data.topicProgress || []} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
