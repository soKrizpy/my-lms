"use client";

import React, { useState, useEffect } from "react";

interface Student {
  id: string;
  full_name: string;
  email_or_phone: string;
}

export default function EditMeetingModal({ 
  meeting, 
  onClose, 
  onSuccess 
}: { 
  meeting: any; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [title, setTitle] = useState(meeting.title || "");
  const [meetingDate, setMeetingDate] = useState("");
  const [linkUrl, setLinkUrl] = useState(meeting.link_url || "");
  const [notes, setNotes] = useState(meeting.notes || "");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    meeting.students?.map((s: any) => s.id) || []
  );
  
  // "single" or "series"
  const [editMode, setEditMode] = useState<"single" | "series">("single");

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Format existing date to datetime-local format
    if (meeting.meeting_date) {
      const date = new Date(meeting.meeting_date);
      // Adjust for local timezone offset to display correctly in input
      const offset = date.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
      setMeetingDate(localISOTime);
    }

    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/admin/students");
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
        }
      } catch (error) {
        console.error("Failed to fetch students", error);
      }
    };
    fetchStudents();
  }, [meeting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dateObj = new Date(meetingDate);
      
      const payload = {
        id: meeting.id,
        title,
        meetingDate: dateObj.toISOString(),
        linkUrl,
        notes,
        studentIds: selectedStudentIds,
        editMode,
        seriesId: meeting.series_id,
        sessionNumber: meeting.session_number
      };

      const res = await fetch("/api/admin/meetings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
      } else {
        alert(data.error || "Gagal mengubah jadwal.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const isPartOfSeries = meeting.session_count > 1 && meeting.series_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-full flex flex-col shadow-xl">
        
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Ubah Jadwal Pertemuan</h2>
            {isPartOfSeries && (
              <p className="text-sm text-slate-500">Sesi {meeting.session_number} dari {meeting.session_count}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto">
          <form id="edit-meeting-form" onSubmit={handleSubmit} className="space-y-6">
            
            {isPartOfSeries && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
                <p className="text-sm font-medium text-orange-800 mb-2">Jadwal ini merupakan bagian dari rangkaian (berulang).</p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="editMode" 
                      value="single" 
                      checked={editMode === "single"} 
                      onChange={() => setEditMode("single")}
                      className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Ubah sesi ini saja</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="editMode" 
                      value="series" 
                      checked={editMode === "series"} 
                      onChange={() => setEditMode("series")}
                      className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Ubah sesi ini dan seluruh sesi setelahnya (termasuk tanggal akan bergeser mengikuti)</span>
                  </label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Judul Pertemuan</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Tanggal & Waktu</label>
                <input
                  type="datetime-local"
                  required
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Link Pertemuan (Opsional)</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Pilih Siswa yang Hadir</label>
              <div className="mt-1 border border-slate-200 rounded-md max-h-48 overflow-y-auto bg-slate-50 p-2">
                {students.length === 0 ? (
                  <p className="text-sm text-slate-500 p-2">Belum ada siswa yang terdaftar.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {students.map(student => (
                      <label key={student.id} className="flex items-start space-x-3 p-2 hover:bg-white rounded border border-transparent hover:border-slate-200 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">{student.full_name}</span>
                          <span className="text-xs text-slate-500">{student.email_or_phone}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Catatan Tambahan</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-lg flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="edit-meeting-form"
            disabled={loading || !title || !meetingDate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>

      </div>
    </div>
  );
}
