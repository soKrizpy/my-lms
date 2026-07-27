"use client";

import React, { useState, useEffect } from "react";
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
  created_at: string;
  students: StudentMinimal[];
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const fetchMeetings = async () => {
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
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleDelete = async (meeting: Meeting) => {
    const isSeries = meeting.session_count > 1 && meeting.series_id;
    let mode = "single";
    
    if (isSeries) {
      const res = confirm("Jadwal ini berulang. Hapus sesi ini saja (OK), atau hapus SESI INI DAN SETERUSNYA dalam seri (Cancel)?");
      if (!res) {
        // User pressed cancel, let's confirm if they want to delete series
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
      if (res.ok) {
        fetchMeetings();
      } else {
        alert("Gagal menghapus jadwal.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportCSV = () => {
    if (meetings.length === 0) return;
    
    const headers = ["Judul", "Sesi Ke", "Tanggal & Waktu", "Link", "Catatan", "Siswa Terlibat", "Status"];
    const now = new Date();
    
    const rows = meetings.map(meet => {
      const meetDate = new Date(meet.meeting_date);
      const status = meetDate > now ? "Mendatang" : "Telah Lewat";
      const studentsStr = meet.students.map(s => s.name).join("; ");
      const sesiStr = meet.session_count > 1 ? `${meet.session_number}/${meet.session_count}` : "1/1";
      
      return [
        `"${meet.title}"`,
        `"${sesiStr}"`,
        `"${meetDate.toLocaleString("id-ID")}"`,
        `"${meet.link_url || ""}"`,
        `"${(meet.notes || "").replace(/"/g, '""')}"`,
        `"${studentsStr}"`,
        `"${status}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Jadwal_LMS_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const now = new Date();
  const upcomingMeetings = meetings.filter(m => new Date(m.meeting_date) > now);
  const pastMeetings = meetings.filter(m => new Date(m.meeting_date) <= now);
  
  const displayedMeetings = activeTab === "upcoming" ? upcomingMeetings : pastMeetings;

  // Group by date for card view
  const groupedMeetings = displayedMeetings.reduce((acc, meet) => {
    const dateKey = new Date(meet.meeting_date).toLocaleDateString("id-ID", {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(meet);
    return acc;
  }, {} as Record<string, Meeting[]>);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Jadwal Pertemuan</h1>
          <p className="text-sm text-slate-600">
            Kelola jadwal kelas, edit, hapus, atau atur ulang sesi.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            disabled={meetings.length === 0}
            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            Export CSV
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
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
            Telah Lewat ({pastMeetings.length})
          </button>
        </nav>
      </div>

      <div className="space-y-8">
        {loading ? (
          <p className="text-slate-500">Memuat data jadwal...</p>
        ) : Object.keys(groupedMeetings).length === 0 ? (
          <p className="text-slate-500 italic">Belum ada jadwal {activeTab === "upcoming" ? "mendatang" : "yang lewat"}.</p>
        ) : (
          Object.entries(groupedMeetings).map(([dateLabel, meets]) => (
            <div key={dateLabel} className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">{dateLabel}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meets.map(meet => (
                  <div key={meet.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow relative group">
                    
                    {/* Header: Title & Edit/Delete Actions */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-900 line-clamp-1" title={meet.title}>
                        {meet.title}
                      </h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingMeeting(meet)} className="p-1 text-slate-400 hover:text-blue-600" title="Edit Jadwal">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(meet)} className="p-1 text-slate-400 hover:text-red-600" title="Hapus Jadwal">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>

                    {/* Time & Session */}
                    <div className="flex items-center text-sm text-slate-600 mb-3 gap-2">
                      <span className="flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {new Date(meet.meeting_date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {meet.session_count > 1 && (
                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                          Sesi {meet.session_number}/{meet.session_count}
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

                    {/* Link Button */}
                    <div className="mt-auto">
                      {meet.link_url ? (
                        <a 
                          href={meet.link_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-full bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          Mulai / Join Kelas
                        </a>
                      ) : (
                        <div className="flex items-center justify-center w-full bg-slate-100 text-slate-400 rounded-md py-2 text-sm font-medium border border-slate-200">
                          Tidak ada link
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <AddMeetingModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchMeetings();
          }} 
        />
      )}

      {editingMeeting && (
        <EditMeetingModal
          meeting={editingMeeting}
          onClose={() => setEditingMeeting(null)}
          onSuccess={() => {
            setEditingMeeting(null);
            fetchMeetings();
          }}
        />
      )}
    </div>
  );
}
