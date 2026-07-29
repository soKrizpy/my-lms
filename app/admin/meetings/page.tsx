"use client";

import React, { useState, useEffect, useCallback } from "react";
import AddMeetingModal from "./AddMeetingModal";
import EditMeetingModal from "./EditMeetingModal";

interface StudentMinimal {
  id: string;
  name: string;
  contact: string;
}

interface Meeting {
  id: number;
  title: string;
  meeting_date: string;
  link_url: string;
  notes: string;
  session_count: number;
  series_id: string | null;
  session_number: number;
  is_completed: boolean;
  completion_status: string;
  progress_report: string | null;
  created_at: string;
  students: StudentMinimal[];
}

// --- Countdown Hook ---
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function calcTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

// --- Meeting Card Component ---
function MeetingCard({
  meet,
  onEdit,
  onDelete,
  onReportProgress,
}: {
  meet: Meeting;
  onEdit: () => void;
  onDelete: () => void;
  onReportProgress: () => void;
}) {
  const timeLeft = useCountdown(meet.meeting_date);
  const now = Date.now();
  const meetTime = new Date(meet.meeting_date).getTime();

  // Meeting is assumed ~1 hour long
  const meetEndTime = meetTime + 60 * 60 * 1000;
  const isUpcoming = meetTime > now;
  const isLive = !isUpcoming && now < meetEndTime && !meet.is_completed;
  const isCompleted = meet.is_completed;
  
  // Progress report button appears if 20 minutes have passed since start time
  const canReportProgress = !isCompleted && now >= meetTime + 20 * 60 * 1000;

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow relative group ${isCompleted ? "border-green-200 bg-green-50/30" : canReportProgress ? "border-orange-200" : "border-slate-200"}`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-slate-900 line-clamp-1" title={meet.title}>
          {meet.title}
        </h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 text-slate-400 hover:text-blue-600" title="Edit Jadwal">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-600" title="Hapus Jadwal">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* Time & Session badge */}
      <div className="flex items-center text-sm text-slate-600 mb-3 gap-2 flex-wrap">
        <span className="flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {new Date(meet.meeting_date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
        </span>
        {meet.session_count > 1 && (
          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
            Sesi {meet.session_number}/{meet.session_count}
          </span>
        )}
        {isCompleted && (
          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
            ✓ Selesai
          </span>
        )}
        {isLive && (
          <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 animate-pulse">
            ● LIVE
          </span>
        )}
      </div>

      {/* Students */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 mb-1">Siswa Terlibat:</p>
        <div className="flex flex-wrap gap-1">
          {meet.students.length > 0 ? (
            meet.students.map(stu => (
              <span key={stu.id} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded" title={stu.contact}>
                {stu.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">Kosong</span>
          )}
        </div>
      </div>

      {/* Completed: show progress report */}
      {isCompleted && meet.progress_report && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-xs font-semibold text-green-800 mb-1">Laporan Progress:</p>
          <p className="text-xs text-green-700 whitespace-pre-wrap">{meet.progress_report}</p>
        </div>
      )}

      {/* Action Button Area */}
      <div className="mt-auto space-y-2">
        {isCompleted ? (
          // Completed state
          <div className="flex items-center justify-center w-full bg-green-100 text-green-700 rounded-md py-2 text-sm font-medium border border-green-200">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Kelas Selesai
          </div>
        ) : (
          <>
            {isLive ? (
              // Live — link active
              meet.link_url ? (
                <a
                  href={meet.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 transition-colors animate-pulse"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Mulai / Join Kelas (LIVE)
                </a>
              ) : (
                <div className="flex items-center justify-center w-full bg-slate-100 text-slate-400 rounded-md py-2 text-sm font-medium border border-slate-200">
                  Tidak ada link
                </div>
              )
            ) : isUpcoming ? (
              // Upcoming — show countdown, button disabled
              <div>
                {timeLeft && (
                  <div className="flex justify-center gap-2 mb-2">
                    {timeLeft.days > 0 && (
                      <div className="text-center">
                        <div className="bg-slate-900 text-white rounded px-2 py-1 text-sm font-mono font-bold min-w-[32px]">{timeLeft.days}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Hari</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="bg-slate-900 text-white rounded px-2 py-1 text-sm font-mono font-bold min-w-[32px]">{String(timeLeft.hours).padStart(2,'0')}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Jam</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-slate-900 text-white rounded px-2 py-1 text-sm font-mono font-bold min-w-[32px]">{String(timeLeft.minutes).padStart(2,'0')}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Mnt</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-slate-900 text-white rounded px-2 py-1 text-sm font-mono font-bold min-w-[32px]">{String(timeLeft.seconds).padStart(2,'0')}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Dtk</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-center w-full bg-slate-200 text-slate-400 rounded-md py-2 text-sm font-medium cursor-not-allowed border border-slate-300">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Belum Waktunya
                </div>
              </div>
            ) : null}

            {canReportProgress && (
              <button
                onClick={onReportProgress}
                className="flex items-center justify-center w-full bg-orange-500 text-white rounded-md py-2 text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Report Progress
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- Progress Report Modal ---
function ProgressReportModal({
  meeting,
  onClose,
  onSuccess,
}: {
  meeting: Meeting;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [report, setReport] = useState("");
  const [completionStatus, setCompletionStatus] = useState<"selesai" | "terlewat">("selesai");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: meeting.id, progressReport: report, completionStatus }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan laporan.");
      }
    } catch {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
          <h2 className="text-lg font-semibold text-slate-900">Report Progress</h2>
          <p className="text-sm text-slate-500">{meeting.title} — {new Date(meeting.meeting_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status Pertemuan</label>
            <div className="flex items-center gap-4 mt-2 mb-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600 focus:ring-blue-500"
                  name="status"
                  value="selesai"
                  checked={completionStatus === "selesai"}
                  onChange={() => setCompletionStatus("selesai")}
                />
                <span className="ml-2 text-sm text-slate-700">Selesai (Hadir)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600 focus:ring-blue-500"
                  name="status"
                  value="terlewat"
                  checked={completionStatus === "terlewat"}
                  onChange={() => setCompletionStatus("terlewat")}
                />
                <span className="ml-2 text-sm text-slate-700">Terlewat (Tidak Hadir/Batal)</span>
              </label>
            </div>
            
            <label className="block text-sm font-medium text-slate-700 mb-1">Apa yang dikerjakan / progress hari ini?</label>
            <textarea
              rows={5}
              required
              value={report}
              onChange={e => setReport(e.target.value)}
              placeholder={completionStatus === "selesai" ? "Contoh: Siswa telah menyelesaikan bab 3 Aljabar. PR diberikan halaman 45-47..." : "Contoh: Siswa berhalangan hadir karena sakit..."}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={loading || !report.trim()} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
              {loading ? "Menyimpan..." : "Simpan & Tandai Selesai"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [reportingMeeting, setReportingMeeting] = useState<Meeting | null>(null);
  
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/meetings");
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error("Failed to fetch meetings", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleDelete = async (meeting: Meeting) => {
    const isSeries = meeting.session_count > 1 && meeting.series_id;
    let mode = "single";
    
    if (isSeries) {
      const res = confirm("Jadwal ini berulang. Hapus sesi ini saja (OK), atau hapus SESI INI DAN SETERUSNYA dalam seri (Cancel)?");
      if (!res) {
        const res2 = confirm("Anda yakin ingin menghapus SESI INI DAN SETERUSNYA?");
        if (!res2) return;
        mode = "series";
      }
    } else {
      if (!confirm("Hapus jadwal ini?")) return;
    }

    try {
      const url = new URL("/api/admin/meetings", window.location.origin);
      url.searchParams.set("id", meeting.id.toString());
      if (mode === "series") {
        url.searchParams.set("editMode", "series");
        url.searchParams.set("seriesId", meeting.series_id!);
        url.searchParams.set("sessionNumber", meeting.session_number.toString());
      }
      const res = await fetch(url.toString(), { method: "DELETE" });
      if (res.ok) fetchMeetings();
      else alert("Gagal menghapus jadwal.");
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportCSV = () => {
    if (meetings.length === 0) return;
    const headers = ["Judul", "Sesi", "Tanggal & Waktu", "Link", "Catatan", "Siswa", "Status", "Progress Report"];
    const now = new Date();
    const rows = meetings.map(meet => {
      const meetDate = new Date(meet.meeting_date);
      const status = meet.is_completed ? "Selesai" : meetDate > now ? "Mendatang" : "Belum Dilaporkan";
      const sesiStr = meet.session_count > 1 ? `${meet.session_number}/${meet.session_count}` : "1/1";
      return [
        `"${meet.title}"`,
        `"${sesiStr}"`,
        `"${meetDate.toLocaleString("id-ID")}"`,
        `"${meet.link_url || ""}"`,
        `"${(meet.notes || "").replace(/"/g, '""')}"`,
        `"${meet.students.map(s => s.name).join("; ")}"`,
        `"${status}"`,
        `"${(meet.progress_report || "").replace(/"/g, '""')}"`
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Data_Jadwal_LMS_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const now = new Date();
  // "upcoming" includes live & not-yet meetings. "past" includes completed & unreported past.
  const upcomingMeetings = meetings.filter(m => !m.is_completed && new Date(m.meeting_date).getTime() + 60*60*1000 > now.getTime());
  const pastMeetings = meetings.filter(m => m.is_completed || new Date(m.meeting_date).getTime() + 60*60*1000 <= now.getTime());
  
  const displayedMeetings = activeTab === "upcoming" ? upcomingMeetings : pastMeetings;

  // Grouping logic
  let groupedUpcoming: Record<string, Meeting[]> = {};
  let groupedPast: Record<string, Meeting[]> = {};

  if (activeTab === "upcoming") {
    groupedUpcoming = upcomingMeetings.reduce((acc, meet) => {
      const dateKey = new Date(meet.meeting_date).toLocaleDateString("id-ID", {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(meet);
      return acc;
    }, {} as Record<string, Meeting[]>);
  } else {
    pastMeetings.forEach(meet => {
      if (meet.students && meet.students.length > 0) {
        meet.students.forEach(stu => {
          if (!groupedPast[stu.name]) groupedPast[stu.name] = [];
          groupedPast[stu.name].push(meet);
        });
      } else {
        if (!groupedPast["Tanpa Siswa"]) groupedPast["Tanpa Siswa"] = [];
        groupedPast["Tanpa Siswa"].push(meet);
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Jadwal Pertemuan</h1>
          <p className="text-sm text-slate-600">Kelola jadwal kelas, edit, hapus, atau atur ulang sesi.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} disabled={meetings.length === 0} className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
            Export CSV
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Buat Jadwal Baru
          </button>
        </div>
      </header>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === "upcoming" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
          >
            Mendatang ({upcomingMeetings.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === "past" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
          >
            Riwayat ({pastMeetings.length})
          </button>
        </nav>
      </div>

      <div className="space-y-8">
        {loading ? (
          <p className="text-slate-500">Memuat data jadwal...</p>
        ) : activeTab === "upcoming" ? (
          Object.keys(groupedUpcoming).length === 0 ? (
            <p className="text-slate-500 italic">Belum ada jadwal mendatang.</p>
          ) : (
            Object.entries(groupedUpcoming).map(([dateLabel, meets]) => (
              <div key={dateLabel} className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">{dateLabel}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {meets.map(meet => (
                    <MeetingCard
                      key={meet.id}
                      meet={meet}
                      onEdit={() => setEditingMeeting(meet)}
                      onDelete={() => handleDelete(meet)}
                      onReportProgress={() => setReportingMeeting(meet)}
                    />
                  ))}
                </div>
              </div>
            ))
          )
        ) : (
          Object.keys(groupedPast).length === 0 ? (
            <p className="text-slate-500 italic">Belum ada jadwal dalam riwayat.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(groupedPast).map(([studentName, meets]) => (
                <div key={studentName} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {studentName}
                  </h2>
                  <div className="space-y-3">
                    {meets.sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()).map(meet => (
                      <div key={meet.id} className="text-sm p-3 bg-slate-50 rounded-md border border-slate-100 flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <strong className="text-slate-800">{meet.title}</strong>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${meet.completion_status === 'terlewat' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                            {meet.completion_status === 'terlewat' ? 'Terlewat' : 'Selesai'}
                          </span>
                        </div>
                        <span className="text-slate-500 text-xs">{new Date(meet.meeting_date).toLocaleString("id-ID")}</span>
                        {meet.progress_report && (
                          <p className="mt-1 text-slate-700 italic border-l-2 border-slate-300 pl-2">
                            "{meet.progress_report}"
                          </p>
                        )}
                        {!meet.is_completed && (
                           <button
                             onClick={() => setReportingMeeting(meet)}
                             className="mt-2 self-start px-2 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 text-xs rounded border border-orange-200"
                           >
                             Tulis Report
                           </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {isAddModalOpen && (
        <AddMeetingModal onClose={() => setIsAddModalOpen(false)} onSuccess={() => { setIsAddModalOpen(false); fetchMeetings(); }} />
      )}
      {editingMeeting && (
        <EditMeetingModal meeting={editingMeeting} onClose={() => setEditingMeeting(null)} onSuccess={() => { setEditingMeeting(null); fetchMeetings(); }} />
      )}
      {reportingMeeting && (
        <ProgressReportModal meeting={reportingMeeting} onClose={() => setReportingMeeting(null)} onSuccess={() => { setReportingMeeting(null); fetchMeetings(); }} />
      )}
    </div>
  );
}
