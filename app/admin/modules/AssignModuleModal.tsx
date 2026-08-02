"use client";

import React, { useEffect, useState } from "react";

interface AssignModuleModalProps {
  module: { id: string; name: string };
  onClose: () => void;
  onSuccess: () => void;
}

interface Student {
  id: string;
  full_name: string;
  email_or_phone: string;
  modules: { id: number; name: string }[];
}

export default function AssignModuleModal({
  module,
  onClose,
  onSuccess,
}: AssignModuleModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/admin/students");
        if (!res.ok) throw new Error("Gagal memuat data siswa");
        const data = await res.json();
        setStudents(data);

        // Pre-select students who already have this module
        const moduleIdNum = Number(module.id);
        const initialSelected = new Set<string>();
        data.forEach((student: Student) => {
          if (student.modules.some((m) => m.id === moduleIdNum)) {
            initialSelected.add(student.id);
          }
        });
        setSelectedStudentIds(initialSelected);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [module.id]);

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudentIds);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudentIds(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/modules/${module.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(selectedStudentIds) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan data");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg flex flex-col max-h-[90vh]">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Assign Modul: {module.name}
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-4 border border-slate-200 rounded-md p-2">
          {loading ? (
            <p className="text-sm text-slate-500 p-2">Memuat data siswa...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500 p-2">Belum ada siswa.</p>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 rounded hover:bg-slate-50 p-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedStudentIds.has(student.id)}
                    onChange={() => toggleStudent(student.id)}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {student.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {student.email_or_phone}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
