"use client";

import React, { useState, useEffect } from "react";

// --- Countdown Hook ---
function calcTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return { h, m, s };
}

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate));
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return timeLeft;
}

// --- Progress Report Modal (same as riwayat tab) ---
function ProgressReportModal({ meet, onClose, onSuccess }: { meet: any; onClose: () => void; onSuccess: () => void }) {
  const [report, setReport] = useState(meet.progress_report || "");
  const [completionStatus, setCompletionStatus] = useState<"selesai" | "terlewat">("selesai");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: meet.id, progressReport: report, completionStatus }),
      });
      if (res.ok) { onSuccess(); onClose(); }
      else alert("Gagal menyimpan laporan.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
          <h2 className="text-lg font-semibold text-slate-900">Report Progress</h2>
          <p className="text-sm text-slate-500">{meet.title} — {new Date(meet.meeting_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status Pertemuan</label>
            <div className="flex items-center gap-4 mt-2 mb-4">
              <label className="inline-flex items-center">
                <input type="radio" className="form-radio text-blue-600" name="status" value="selesai" checked={completionStatus === "selesai"} onChange={() => setCompletionStatus("selesai")} />
                <span className="ml-2 text-sm text-slate-700">Selesai (Hadir)</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" className="form-radio text-blue-600" name="status" value="terlewat" checked={completionStatus === "terlewat"} onChange={() => setCompletionStatus("terlewat")} />
                <span className="ml-2 text-sm text-slate-700">Terlewat</span>
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Progress / Catatan</label>
            <textarea
              rows={4} required value={report} onChange={(e) => setReport(e.target.value)}
              placeholder={completionStatus === "selesai" ? "Contoh: Siswa menyelesaikan bab 3..." : "Contoh: Siswa tidak hadir karena sakit..."}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={loading || !report.trim()} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
              {loading ? "Menyimpan..." : "Simpan & Tandai Selesai"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Synopsis Floating Panel for Teacher ---
function TeacherSynopsisPanel({ topic, onClose }: { topic: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-blue-600">
          <div>
            <p className="text-xs font-medium text-blue-100 uppercase tracking-wide font-sans">Sinopsis Materi</p>
            <h3 className="font-bold text-white text-base mt-0.5 leading-snug font-sans">{topic.title}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 font-sans">
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
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors font-sans"
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

function TodayMeetingCard({ meet, onRefresh }: { meet: any; onRefresh: () => void }) {
  const timeLeft = useCountdown(meet.meeting_date);
  const nowMs = Date.now();
  const meetMs = new Date(meet.meeting_date).getTime();
  const endMs = meetMs + 60 * 60 * 1000;
  const thirtyMinMs = meetMs + 30 * 60 * 1000;
  const isLive = nowMs >= meetMs && nowMs < endMs && !meet.is_completed;
  const isUpcoming = meetMs > nowMs;
  const isCompleted = meet.is_completed;
  const isPastJoin = nowMs >= thirtyMinMs && !isCompleted;

  const [showModal, setShowModal] = React.useState(false);
  const [synopsisOpen, setSynopsisOpen] = React.useState(false);
  const [topic, setTopic] = React.useState<any>(null);

  React.useEffect(() => {
    async function fetchTopic() {
      try {
        const res = await fetch(`/api/admin/meetings/${meet.id}/topic`);
        if (res.ok) {
          const data = await res.json();
          setTopic(data.topic);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchTopic();
  }, [meet.id]);

  return (
    <>
      {synopsisOpen && topic && (
        <TeacherSynopsisPanel topic={topic} onClose={() => setSynopsisOpen(false)} />
      )}

      <div className={`rounded-lg border p-4 flex flex-col gap-3 ${isCompleted ? 'bg-green-50 border-green-200' : isPastJoin ? 'bg-amber-50 border-amber-200' : isLive ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{meet.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(meet.meeting_date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB
              {meet.session_count > 1 && ` · Sesi ${meet.session_number}/${meet.session_count}`}
            </p>
          </div>
          <div className="flex-shrink-0">
            {isLive && <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-bold animate-pulse">LIVE</span>}
            {isPastJoin && !isCompleted && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-white font-bold">Lapor Progress</span>}
            {isCompleted && <span className="text-[10px] px-2 py-0.5 rounded bg-green-600 text-white font-bold">✓ Selesai</span>}
          </div>
        </div>

        {meet.students?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meet.students.map((s: any) => (
              <span key={s.id} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{s.name}</span>
            ))}
          </div>
        )}

        {topic && (topic.description || topic.project_link) && (
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            {topic.description && (
              <button
                onClick={() => setSynopsisOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Sinopsis
              </button>
            )}
            {topic.project_link && (
              <a
                href={topic.project_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" />
                </svg>
                Link Project
              </a>
            )}
          </div>
        )}

        {isUpcoming && timeLeft && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Mulai dalam:</span>
            <div className="flex gap-1 font-mono">
              {timeLeft.h > 0 && (
                <span className="bg-slate-900 text-white text-xs px-2 py-0.5 rounded font-bold">{String(timeLeft.h).padStart(2,'0')}j</span>
              )}
              <span className="bg-slate-900 text-white text-xs px-2 py-0.5 rounded font-bold">{String(timeLeft.m).padStart(2,'0')}m</span>
              <span className="bg-slate-800 text-white text-xs px-2 py-0.5 rounded font-bold">{String(timeLeft.s).padStart(2,'0')}d</span>
            </div>
          </div>
        )}

        {/* Join button — only shown before 30 min mark */}
        {!isCompleted && !isPastJoin && meet.link_url && (
          <a
            href={meet.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md text-sm font-semibold text-white transition-colors ${
              isLive ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            {isLive ? 'Join Kelas (LIVE)' : 'Buka Link'}
          </a>
        )}
        {!isCompleted && !isPastJoin && !meet.link_url && (
          <div className="w-full px-3 py-2 rounded-md text-sm text-slate-400 text-center bg-slate-100 border border-slate-200">
            Tidak ada link
          </div>
        )}

        {/* Report button — shown after 30 min (replaces join button) */}
        {isPastJoin && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 w-full justify-center px-3 py-2 rounded-md text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Report Kelas
          </button>
        )}

        {/* Already completed — show saved report */}
        {isCompleted && meet.progress_report && (
          <div className="bg-white border border-green-200 rounded-md p-3">
            <p className="text-xs font-semibold text-green-700 mb-1">Laporan Progress:</p>
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{meet.progress_report}</p>
          </div>
        )}

        {showModal && (
          <ProgressReportModal
            meet={meet}
            onClose={() => setShowModal(false)}
            onSuccess={onRefresh}
          />
        )}
      </div>
    </>
  );
}



interface Announcement {
  id: number;
  content: string;
  duration_days: number;
  expires_at: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [content, setContent] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [todayMeetings, setTodayMeetings] = useState<any[]>([]);

  const fetchData = async () => {
    setFetchLoading(true);
    try {
      const [resAnn, resMeet] = await Promise.all([
        fetch("/api/admin/announcements"),
        fetch("/api/admin/meetings")
      ]);
      
      if (resAnn.ok) {
        const data = await resAnn.json();
        setAnnouncements(data);
      }
      
      if (resMeet.ok) {
        const data = await resMeet.json();
        const todayStr = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" });
        const today = data.filter((m: any) => {
          const mDate = new Date(m.meeting_date);
          const mStr = mDate.toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" });
          return mStr === todayStr;
        });
        setTodayMeetings(today);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, durationDays }),
      });
      if (res.ok) {
        setContent("");
        setDurationDays("7");
        fetchData();
      } else {
        alert("Gagal menambahkan pengumuman.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard Admin</h1>
        <p className="text-sm text-slate-600">
          Selamat datang di panel admin LMS. Kelola pengumuman untuk siswa di sini.
        </p>
      </div>

      {/* Jadwal Hari Ini */}
      <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Jadwal Hari Ini
        </h2>
        {fetchLoading ? (
          <p className="text-sm text-slate-500">Memuat jadwal...</p>
        ) : todayMeetings.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Tidak ada jadwal pertemuan untuk hari ini.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayMeetings.map((meet) => (
              <TodayMeetingCard key={meet.id} meet={meet} onRefresh={fetchData} />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Pengumuman */}
        <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Buat Pengumuman Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700">
                Isi Pengumuman
              </label>
              <textarea
                id="content"
                rows={3}
                required
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Tuliskan pengumuman untuk ditampilkan di dashboard siswa..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-slate-700">
                Durasi Tayang (Hari)
              </label>
              <input
                type="number"
                id="duration"
                min="1"
                required
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Kirim Pengumuman"}
            </button>
          </form>
        </section>

        {/* Daftar Pengumuman */}
        <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Pengumuman Aktif & Riwayat</h2>
          <div className="space-y-4">
            {fetchLoading ? (
              <p className="text-sm text-slate-500">Memuat...</p>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Belum ada pengumuman.</p>
            ) : (
              announcements.map((ann) => {
                const isExpired = new Date(ann.expires_at) < new Date();
                return (
                  <div key={ann.id} className={`p-4 rounded-md border ${isExpired ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex justify-between items-start gap-4">
                      <p className={`text-sm ${isExpired ? 'text-slate-600' : 'text-blue-900'}`}>
                        {ann.content}
                      </p>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 flex justify-between">
                      <span>Dibuat: {new Date(ann.created_at).toLocaleDateString("id-ID")}</span>
                      <span className={isExpired ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                        {isExpired ? 'Kadaluarsa' : `Berlaku s/d ${new Date(ann.expires_at).toLocaleDateString("id-ID")}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
