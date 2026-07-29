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
                <input type="radio" className="form-radio text-blue-600 focus:ring-blue-500" name="status" value="selesai" checked={completionStatus === "selesai"} onChange={() => setCompletionStatus("selesai")} />
                <span className="ml-2 text-sm text-slate-700">Selesai (Hadir)</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" className="form-radio text-blue-600 focus:ring-blue-500" name="status" value="terlewat" checked={completionStatus === "terlewat"} onChange={() => setCompletionStatus("terlewat")} />
                <span className="ml-2 text-sm text-slate-700">Terlewat</span>
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Progress / Catatan</label>
            <textarea
              rows={4}
              required
              value={report}
              onChange={e => setReport(e.target.value)}
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

// --- Calendar View ---
const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function CalendarView({
  meetings,
  onEdit,
  onDelete,
  onReport,
}: {
  meetings: Meeting[];
  onEdit: (m: Meeting) => void;
  onDelete: (m: Meeting) => void;
  onReport: (m: Meeting) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(new Date());
  };

  const meetingMap: Record<string, Meeting[]> = {};
  meetings.forEach(m => {
    const d = new Date(m.meeting_date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (!meetingMap[key]) meetingMap[key] = [];
    meetingMap[key].push(m);
  });

  const getKey = (day: number) =>
    `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const isSelected = (day: number) =>
    !!(selectedDay &&
    day === selectedDay.getDate() &&
    viewMonth === selectedDay.getMonth() &&
    viewYear === selectedDay.getFullYear());

  const selectedKey = selectedDay
    ? `${selectedDay.getFullYear()}-${String(selectedDay.getMonth()+1).padStart(2,"0")}-${String(selectedDay.getDate()).padStart(2,"0")}`
    : null;
  const selectedMeetings = selectedKey ? (meetingMap[selectedKey] || []) : [];

  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="flex gap-6 flex-col lg:flex-row">
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <button onClick={goToday} className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">Hari Ini</button>
          </div>
          <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAY_NAMES.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) return <div key={`blank-${i}`} className="border-b border-r border-slate-100 min-h-[72px] bg-slate-50/50" />;
            const key = getKey(day);
            const dayMeetings = meetingMap[key] || [];
            const todayCls = isToday(day);
            const selectedCls = isSelected(day);
            return (
              <div
                key={day}
                onClick={() => setSelectedDay(new Date(viewYear, viewMonth, day))}
                className={`border-b border-r border-slate-100 min-h-[72px] p-1.5 cursor-pointer transition-colors ${selectedCls && !todayCls ? "bg-blue-50" : "hover:bg-slate-50"}`}
              >
                <div className="flex justify-end mb-1">
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${todayCls ? "bg-blue-600 text-white" : "text-slate-700"}`}>
                    {day}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayMeetings.slice(0, 3).map(m => (
                    <div
                      key={m.id}
                      className={`text-[10px] px-1 py-0.5 rounded truncate font-medium leading-tight ${m.is_completed ? "bg-green-100 text-green-800" : new Date(m.meeting_date) < new Date() ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}`}
                      title={m.title}
                    >
                      {new Date(m.meeting_date).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})} {m.title}
                    </div>
                  ))}
                  {dayMeetings.length > 3 && (
                    <div className="text-[10px] text-slate-400 pl-1">+{dayMeetings.length - 3} lainnya</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-900 text-sm">
              {selectedDay
                ? selectedDay.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                : "Pilih tanggal"}
            </h3>
            {selectedDay && <p className="text-xs text-slate-500 mt-0.5">{selectedMeetings.length} jadwal</p>}
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[520px]">
            {!selectedDay ? (
              <p className="text-sm text-slate-400 italic text-center py-8">Klik tanggal di kalender</p>
            ) : selectedMeetings.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">Tidak ada jadwal</p>
            ) : (
              [...selectedMeetings]
                .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
                .map(meet => {
                  const nowMs = Date.now();
                  const meetMs = new Date(meet.meeting_date).getTime();
                  const endMs = meetMs + 60 * 60 * 1000;
                  const isLive = nowMs >= meetMs && nowMs < endMs && !meet.is_completed;
                  const canReport = !meet.is_completed && nowMs >= meetMs + 20 * 60 * 1000;
                  return (
                    <div key={meet.id} className={`rounded-lg border p-3 text-sm ${meet.is_completed ? "border-green-200 bg-green-50" : isLive ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{meet.title}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(meet.meeting_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                            {meet.session_count > 1 && ` · Sesi ${meet.session_number}/${meet.session_count}`}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 mt-0.5">
                          {isLive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-bold animate-pulse">LIVE</span>}
                          {meet.is_completed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-600 text-white font-bold">?</span>}
                        </div>
                      </div>

                      {meet.students.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {meet.students.map(s => (
                            <span key={s.id} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s.name}</span>
                          ))}
                        </div>
                      )}

                      {meet.progress_report && (
                        <p className="text-[11px] italic text-slate-600 border-l-2 border-slate-300 pl-2 mb-2 line-clamp-2">
                          {meet.progress_report}
                        </p>
                      )}

                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {meet.link_url && !meet.is_completed && (
                          <a href={meet.link_url} target="_blank" rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-white ${isLive ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            {isLive ? "Join LIVE" : "Link"}
                          </a>
                        )}
                        {canReport && (
                          <button onClick={() => onReport(meet)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-orange-500 text-white hover:bg-orange-600">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Report
                          </button>
                        )}
                        <button onClick={() => onEdit(meet)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Edit
                        </button>
                        <button onClick={() => onDelete(meet)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-red-50 text-red-600 hover:bg-red-100">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Past Meetings grouped by student ---
function PastMeetingsByStudent({
  pastMeetings,
  onReport,
}: {
  pastMeetings: Meeting[];
  onReport: (m: Meeting) => void;
}) {
  const grouped: Record<string, Meeting[]> = {};
  pastMeetings.forEach(meet => {
    if (meet.students && meet.students.length > 0) {
      meet.students.forEach(stu => {
        if (!grouped[stu.name]) grouped[stu.name] = [];
        grouped[stu.name].push(meet);
      });
    } else {
      if (!grouped["Tanpa Siswa"]) grouped["Tanpa Siswa"] = [];
      grouped["Tanpa Siswa"].push(meet);
    }
  });

  if (Object.keys(grouped).length === 0) {
    return <p className="text-slate-500 italic">Belum ada jadwal dalam riwayat.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(grouped).map(([studentName, meets]) => (
        <div key={studentName} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            {studentName}
          </h2>
          <div className="space-y-3">
            {[...meets].sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()).map(meet => (
              <div key={meet.id} className="text-sm p-3 bg-slate-50 rounded-md border border-slate-100 flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <strong className="text-slate-800">{meet.title}</strong>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${meet.completion_status === "terlewat" ? "bg-red-100 text-red-700 border border-red-200" : "bg-green-100 text-green-700 border border-green-200"}`}>
                    {meet.completion_status === "terlewat" ? "Terlewat" : "Selesai"}
                  </span>
                </div>
                <span className="text-slate-500 text-xs">{new Date(meet.meeting_date).toLocaleString("id-ID")}</span>
                {meet.progress_report && (
                  <p className="mt-1 text-slate-700 italic border-l-2 border-slate-300 pl-2 text-xs">{meet.progress_report}</p>
                )}
                {!meet.is_completed && (
                  <button onClick={() => onReport(meet)} className="mt-2 self-start px-2 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 text-xs rounded border border-orange-200">
                    Tulis Report
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
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

  const [activeTab, setActiveTab] = useState<"calendar" | "past">("calendar");

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
      const res = confirm("Jadwal ini berulang. Hapus sesi ini saja (OK), atau hapus SESI INI DAN SETERUSNYA (Cancel)?");
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
  const pastMeetings = meetings.filter(m => m.is_completed || new Date(m.meeting_date).getTime() + 60*60*1000 <= now.getTime());

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
            + Buat Jadwal Baru
          </button>
        </div>
      </header>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === "calendar" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Kalender
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === "past" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Riwayat ({pastMeetings.length})
          </button>
        </nav>
      </div>

      {loading ? (
        <p className="text-slate-500">Memuat data jadwal...</p>
      ) : activeTab === "calendar" ? (
        <CalendarView
          meetings={meetings}
          onEdit={m => setEditingMeeting(m)}
          onDelete={m => handleDelete(m)}
          onReport={m => setReportingMeeting(m)}
        />
      ) : (
        <PastMeetingsByStudent
          pastMeetings={pastMeetings}
          onReport={m => setReportingMeeting(m)}
        />
      )}

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
