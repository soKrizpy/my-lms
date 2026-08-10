"use client";

import React, { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TopicDetail {
  id: number;
  title: string;
  order_index: number;
  isUnlocked: boolean;
  quiz: {
    id: number;
    title: string;
    bestScore: number | null;
    totalQuestions: number | null;
    attemptsCount: number;
  } | null;
}

interface ModuleDetail {
  id: number;
  title: string;
  description: string | null;
  topics: TopicDetail[];
  completedCount: number;
  totalCount: number;
}

interface MeetingDetail {
  id: number;
  title: string;
  meeting_date: string;
  is_completed: boolean;
  completion_status: string | null;
  progress_report: string | null;
  has_joined: boolean;
}

interface QuizAttemptDetail {
  id: number;
  quiz_id: number;
  score: number;
  total_questions: number;
  attempts_count: number;
  created_at: string;
  quizTitle: string;
  topicTitle: string;
}

interface StudentDetail {
  id: string;
  full_name: string;
  email_or_phone: string;
  grade: string;
  bio: string | null;
  mpin: string;
  created_at: string;
}

interface StudentDetailData {
  student: StudentDetail;
  modules: ModuleDetail[];
  meetings: MeetingDetail[];
  quizAttempts: QuizAttemptDetail[];
  certificates: any[];
}

type Tab = "learning" | "riwayat" | "pencapaian" | "sertifikat";

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  studentId: string;
  onClose: () => void;
  onEdit: (student: any) => void;
  onDelete: (id: string, name: string) => void;
}

// ─── Helper Components ────────────────────────────────────────────────────────
function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ScoreBadge({ score, total }: { score: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((score / total) * 100);
  const pass = pct >= 70;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        pass
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-600"
      }`}
    >
      {pass ? "✓ Lulus" : "✗ Belum"}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentDetailPanel({ studentId, onClose, onEdit, onDelete }: Props) {
  const [data, setData] = useState<StudentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("learning");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/students/${studentId}/details`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal memuat data.");
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [studentId]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "learning",
      label: "Learning Path",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
    },
    {
      key: "riwayat",
      label: "Riwayat",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: "pencapaian",
      label: "Pencapaian",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      key: "sertifikat",
      label: "Sertifikat",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative flex flex-col h-full w-full max-w-xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideInRight 0.25s ease-out" }}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Detail Siswa
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="h-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-600 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-32 bg-slate-600 rounded animate-pulse" />
                <div className="h-2.5 w-24 bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ) : data ? (
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {data.student.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-white truncate">
                  {data.student.full_name}
                </h2>
                <p className="text-xs text-slate-400 truncate">
                  {data.student.email_or_phone} · {data.student.grade || "Kelas —"}
                </p>
              </div>
              {/* Action buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onEdit(data.student)}
                  title="Edit Siswa"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => onDelete(data.student.id, data.student.full_name)}
                  title="Hapus Siswa"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus
                </button>
              </div>
            </div>
          ) : null}

          {/* Quick stats */}
          {data && !loading && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{data.modules.length}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Modul</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {data.meetings.filter(m => m.is_completed && m.has_joined).length}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Pertemuan Hadir</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-white">{data.quizAttempts.length}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Quiz</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-white">0</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Sertifikat</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-3 text-[11px] font-semibold transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-sm text-slate-500">Memuat data siswa...</p>
            </div>
          )}

          {error && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* ──────── TAB: Learning Path ──────── */}
              {activeTab === "learning" && (
                <div className="p-4 space-y-4">
                  {data.modules.length === 0 ? (
                    <EmptyState
                      icon="📚"
                      title="Belum Ada Modul"
                      desc="Siswa ini belum di-assign ke modul manapun."
                    />
                  ) : (
                    data.modules.map((mod) => (
                      <div
                        key={mod.id}
                        className="border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                      >
                        {/* Module header */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                          <div className="flex items-center justify-between mb-1.5">
                            <h3 className="text-sm font-semibold text-slate-900 truncate mr-2">
                              {mod.title}
                            </h3>
                            <span className="text-xs font-medium text-slate-500 flex-shrink-0">
                              {mod.completedCount}/{mod.totalCount} topik
                            </span>
                          </div>
                          <ProgressBar value={mod.completedCount} max={mod.totalCount} />
                        </div>

                        {/* Topics list */}
                        <div className="divide-y divide-slate-100">
                          {mod.topics.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-slate-400 italic">
                              Belum ada topik di modul ini.
                            </p>
                          ) : (
                            mod.topics.map((topic) => (
                              <div key={topic.id} className="flex items-start gap-3 px-4 py-3">
                                {/* Status icon */}
                                <div className="flex-shrink-0 mt-0.5">
                                  {topic.isUnlocked ? (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[11px] font-bold">✓</span>
                                  ) : (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400 text-[10px]">🔒</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${topic.isUnlocked ? "text-slate-900" : "text-slate-400"}`}>
                                    {topic.order_index}. {topic.title}
                                  </p>
                                  {topic.quiz && (
                                    <div className="flex items-center gap-2 mt-1">
                                      {topic.quiz.bestScore !== null && topic.quiz.totalQuestions ? (
                                        <>
                                          <span className="text-xs text-slate-500">
                                            Quiz: <strong>{topic.quiz.bestScore}/{topic.quiz.totalQuestions}</strong>
                                          </span>
                                          <ScoreBadge
                                            score={topic.quiz.bestScore}
                                            total={topic.quiz.totalQuestions}
                                          />
                                          {topic.quiz.attemptsCount > 1 && (
                                            <span className="text-[10px] text-slate-400">
                                              ({topic.quiz.attemptsCount}× percobaan)
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-xs text-slate-400 italic">
                                          Quiz belum dikerjakan
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ──────── TAB: Riwayat ──────── */}
              {activeTab === "riwayat" && (
                <div className="p-4 space-y-3">
                  {data.meetings.length === 0 ? (
                    <EmptyState
                      icon="📅"
                      title="Belum Ada Pertemuan"
                      desc="Siswa ini belum memiliki riwayat pertemuan."
                    />
                  ) : (
                    data.meetings.map((meet) => {
                      const dateObj = new Date(meet.meeting_date);
                      const dateStr = dateObj.toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      const timeStr = dateObj.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const status = meet.completion_status;
                      const attended = meet.is_completed && meet.has_joined;
                      const missed = meet.is_completed && !meet.has_joined;
                      const upcoming = !meet.is_completed;

                      return (
                        <div
                          key={meet.id}
                          className={`rounded-xl border p-4 ${
                            upcoming
                              ? "border-blue-200 bg-blue-50"
                              : attended
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {meet.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {dateStr} · {timeStr} WIB
                              </p>
                            </div>
                            <StatusPill upcoming={upcoming} attended={attended} missed={missed} status={status} />
                          </div>
                          {meet.progress_report && (
                            <div className="mt-2 p-2 bg-white/60 rounded-lg border border-white/80">
                              <p className="text-xs font-semibold text-slate-600 mb-0.5">Laporan:</p>
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {meet.progress_report}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ──────── TAB: Pencapaian ──────── */}
              {activeTab === "pencapaian" && (
                <div className="p-4 space-y-3">
                  {data.quizAttempts.length === 0 ? (
                    <EmptyState
                      icon="🏆"
                      title="Belum Ada Pencapaian"
                      desc="Siswa belum menyelesaikan quiz apapun."
                    />
                  ) : (
                    data.quizAttempts.map((attempt) => {
                      const pct = attempt.total_questions > 0
                        ? Math.round((attempt.score / attempt.total_questions) * 100)
                        : 0;
                      const pass = pct >= 70;
                      return (
                        <div
                          key={attempt.id}
                          className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {attempt.quizTitle}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">
                                Topik: {attempt.topicTitle}
                              </p>
                            </div>
                            <ScoreBadge score={attempt.score} total={attempt.total_questions} />
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="font-medium text-slate-600">
                                  {attempt.score} / {attempt.total_questions} benar
                                </span>
                                <span className={`font-bold ${pass ? "text-emerald-600" : "text-red-500"}`}>
                                  {pct}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    pass
                                      ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                                      : "bg-gradient-to-r from-red-400 to-orange-400"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              {new Date(attempt.created_at).toLocaleDateString("id-ID", {
                                day: "numeric", month: "short", year: "numeric",
                              })}
                            </span>
                            {attempt.attempts_count > 1 && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {attempt.attempts_count}× percobaan
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ──────── TAB: Sertifikat ──────── */}
              {activeTab === "sertifikat" && (
                <div className="p-6 flex flex-col items-center justify-center min-h-[320px]">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center text-4xl mb-4 shadow-inner">
                    🎓
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 mb-1">
                    Fitur Sertifikat
                  </h3>
                  <p className="text-sm text-slate-500 text-center max-w-xs">
                    Penerbitan dan pengelolaan sertifikat untuk siswa akan segera hadir di versi berikutnya.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm font-semibold text-slate-700 mt-1">{title}</p>
      <p className="text-xs text-slate-400 text-center max-w-xs">{desc}</p>
    </div>
  );
}

function StatusPill({
  upcoming,
  attended,
  missed,
  status,
}: {
  upcoming: boolean;
  attended: boolean;
  missed: boolean;
  status: string | null;
}) {
  if (upcoming) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
        Mendatang
      </span>
    );
  }
  if (attended) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
        ✓ Hadir
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">
      ✗ {status === "terlewat" ? "Terlewat" : "Tidak Hadir"}
    </span>
  );
}
