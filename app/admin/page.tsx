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

function TodayMeetingCard({ meet }: { meet: any }) {
  const timeLeft = useCountdown(meet.meeting_date);
  const nowMs = Date.now();
  const meetMs = new Date(meet.meeting_date).getTime();
  const endMs = meetMs + 60 * 60 * 1000;
  const isLive = nowMs >= meetMs && nowMs < endMs && !meet.is_completed;
  const isUpcoming = meetMs > nowMs;
  const isCompleted = meet.is_completed;

  return (
    <div className={`rounded-lg border p-4 flex flex-col gap-3 ${isCompleted ? 'bg-green-50 border-green-200' : isLive ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
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

      {!isCompleted && meet.link_url && (
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
      {!isCompleted && !meet.link_url && (
        <div className="w-full px-3 py-2 rounded-md text-sm text-slate-400 text-center bg-slate-100 border border-slate-200">
          Tidak ada link
        </div>
      )}
    </div>
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
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const todayEnd = todayStart + 24 * 60 * 60 * 1000;
        
        const today = data.filter((m: any) => {
          const mTime = new Date(m.meeting_date).getTime();
          return mTime >= todayStart && mTime < todayEnd;
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
              <TodayMeetingCard key={meet.id} meet={meet} />
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
