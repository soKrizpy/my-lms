"use client";

import React, { useState, useEffect } from "react";

interface Module {
  id: number;
  name: string;
}

interface AddStudentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStudentModal({ onClose, onSuccess }: AddStudentModalProps) {
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [mpin, setMpin] = useState("");
  const [grade, setGrade] = useState("1"); // Default to Kelas 1
  const [bio, setBio] = useState("");
  
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch modules to populate dropdown/checkboxes
    async function fetchModules() {
      try {
        const res = await fetch("/api/modules");
        const data = await res.json();
        if (res.ok) {
          setAvailableModules(data);
        }
      } catch (err) {
        console.error("Gagal memuat modul:", err);
      }
    }
    fetchModules();
  }, []);

  const toggleModule = (id: number) => {
    setSelectedModules((prev) => 
      prev.includes(id) ? prev.filter((modId) => modId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (mpin.length !== 6 || !/^\d+$/.test(mpin)) {
      setError("MPIN harus berupa 6 digit angka.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          contact,
          mpin,
          grade: `Kelas ${grade}`,
          bio,
          moduleIds: selectedModules
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan siswa.");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Tambah Siswa Baru</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="add-student-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                placeholder="Misal: Budi Santoso" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / Email (Username)</label>
              <input type="text" required value={contact} onChange={e => setContact(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                placeholder="08123456789 atau budi@example.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">MPIN (6 Digit)</label>
                <input type="text" required maxLength={6} value={mpin} onChange={e => setMpin(e.target.value.replace(/\D/g, ''))}
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                  placeholder="123456" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                <select value={grade} onChange={e => setGrade(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900">
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>Kelas {i+1}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mini Bio / Catatan</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                placeholder="Catatan tambahan tentang siswa ini..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Assign Modul</label>
              <div className="space-y-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-md">
                {availableModules.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">Belum ada modul tersedia.</p>
                ) : (
                  availableModules.map(mod => (
                    <label key={mod.id} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedModules.includes(mod.id)}
                        onChange={() => toggleModule(mod.id)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" 
                      />
                      <span className="text-sm text-slate-700">{mod.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
          </form>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button type="submit" form="add-student-form" disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors">
            {isSubmitting ? "Menyimpan..." : "Simpan Siswa"}
          </button>
        </div>
      </div>
    </div>
  );
}
