"use client";

import React, { useState, useEffect } from "react";
import AddMeetingModal from "./AddMeetingModal";

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
  created_at: string;
  students: StudentMinimal[];
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleExportCSV = () => {
    if (meetings.length === 0) return;
    
    // CSV Header
    const headers = ["Judul", "Tanggal & Waktu", "Link", "Sesi", "Catatan", "Siswa Terlibat", "Status"];
    
    const now = new Date();
    
    // CSV Rows
    const rows = meetings.map(meet => {
      const meetDate = new Date(meet.meeting_date);
      const status = meetDate > now ? "Mendatang" : "Telah Lewat";
      const studentsStr = meet.students.map(s => s.name).join("; ");
      
      return [
        `"${meet.title}"`,
        `"${meetDate.toLocaleString("id-ID")}"`,
        `"${meet.link_url || ""}"`,
        `"${meet.session_count || 1}"`,
        `"${(meet.notes || "").replace(/"/g, '""')}"`,
        `"${studentsStr}"`,
        `"${status}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

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

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Jadwal Pertemuan</h1>
          <p className="text-sm text-slate-600">
            Kelola jadwal sesi 1-on-1 atau grup dengan siswa.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            disabled={meetings.length === 0}
            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Buat Jadwal Baru
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "upcoming" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}
            `}
          >
            Mendatang ({upcomingMeetings.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "past" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}
            `}
          >
            Telah Lewat ({pastMeetings.length})
          </button>
        </nav>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Judul & Sesi</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Waktu & Link</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Siswa Terlibat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-500">
                    Memuat data jadwal...
                  </td>
                </tr>
              ) : displayedMeetings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-500">
                    Belum ada jadwal {activeTab === "upcoming" ? "mendatang" : "yang lewat"}.
                  </td>
                </tr>
              ) : (
                displayedMeetings.map((meet) => (
                  <tr key={meet.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{meet.title}</div>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 mt-1">
                        Total {meet.session_count || 1} Pertemuan
                      </span>
                      {meet.notes && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{meet.notes}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 font-medium">
                        {new Date(meet.meeting_date).toLocaleDateString("id-ID", {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        Jam: {new Date(meet.meeting_date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {meet.link_url && (
                        <a 
                          href={meet.link_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2 font-medium"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Buka Link
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {meet.students.length > 0 ? (
                          meet.students.map(stu => (
                            <div key={stu.id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs border border-blue-100">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span title={stu.contact}>{stu.name}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">Tidak ada siswa (Jadwal kosong)</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <AddMeetingModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchMeetings();
          }} 
        />
      )}
    </div>
  );
}
