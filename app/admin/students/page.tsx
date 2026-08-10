"use client";

import React, { useState, useEffect } from "react";
import AdminToast, { type AdminNotice } from "../components/AdminToast";
import AddStudentModal from "./AddStudentModal";
import EditStudentModal from "./EditStudentModal";
import StudentDetailPanel from "./StudentDetailPanel";

interface AssignedModule {
  id: number;
  name: string;
}

interface Student {
  id: string;
  full_name: string;
  email_or_phone: string;
  mpin: string;
  grade: string;
  bio: string;
  created_at: string;
  modules: AssignedModule[];
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/students");
      const data = await res.json();
      if (res.ok) {
        setStudents(data);
      }
    } catch (error) {
      console.error("Failed to fetch students", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleExportCSV = () => {
    if (students.length === 0) return;

    // CSV Header
    const headers = [
      "Nama Lengkap",
      "Kontak (WA/Email)",
      "MPIN",
      "Kelas",
      "Modul Aktif",
      "Bio",
      "Terdaftar",
    ];

    // CSV Rows
    const rows = students.map((student) => [
      `"${student.full_name || ""}"`,
      `"${student.email_or_phone || ""}"`,
      `"${student.mpin || ""}"`,
      `"${student.grade || ""}"`,
      `"${student.modules.map((m) => m.name).join(", ")}"`,
      `"${student.bio || ""}"`,
      `"${new Date(student.created_at).toLocaleDateString("id-ID")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Data_Siswa_LMS_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus siswa ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotice({ type: "success", text: "Siswa berhasil dihapus." });
        fetchStudents();
      } else {
        const data = await res.json();
        setNotice({ type: "error", text: data.error || "Gagal menghapus siswa." });
      }
    } catch (err) {
      setNotice({ type: "error", text: "Terjadi kesalahan sistem." });
    }
  };

  return (
    <div className="space-y-6">
      <AdminToast notice={notice} onDismiss={() => setNotice(null)} />
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Siswa</h1>
          <p className="text-sm text-slate-600">
            Kelola daftar siswa, MPIN, dan modul yang mereka ambil.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={students.length === 0}
            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Tambah Siswa
          </button>
        </div>
      </header>

      <section className="glass-panel border border-[var(--glass-border)] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Nama & Kontak
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Kelas & Akses
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Modul Aktif
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Terdaftar
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)] bg-transparent">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Memuat data siswa...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Belum ada siswa yang terdaftar.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase">
                          {student.full_name?.charAt(0) || "?"}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {student.full_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {student.email_or_phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-1">
                        {student.grade || "Belum diatur"}
                      </span>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                          />
                        </svg>
                        MPIN:{" "}
                        <span className="font-mono bg-slate-100 px-1 rounded">
                          {student.mpin || "------"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {student.modules.length > 0 ? (
                          student.modules.map((mod) => (
                            <span
                              key={mod.id}
                              className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                            >
                              {mod.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Belum ada modul
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(student.created_at).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setDetailStudentId(student.id)}
                          title="Lihat Detail"
                          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-700 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Detail
                        </button>
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="text-blue-600 hover:text-blue-900 text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, student.full_name)}
                          className="text-red-600 hover:text-red-900 text-xs font-semibold"
                        >
                          Hapus
                        </button>
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
        <AddStudentModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchStudents();
            setNotice({ type: "success", text: "Siswa berhasil ditambahkan." });
          }}
        />
      )}

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            setEditingStudent(null);
            fetchStudents();
            setNotice({ type: "success", text: "Data siswa berhasil diubah." });
          }}
        />
      )}

      {detailStudentId && (
        <StudentDetailPanel
          studentId={detailStudentId}
          onClose={() => setDetailStudentId(null)}
          onEdit={(student) => {
            // Find the full student object to open edit modal
            const found = students.find((s) => s.id === student.id);
            if (found) {
              setDetailStudentId(null);
              setEditingStudent(found);
            }
          }}
          onDelete={async (id, name) => {
            setDetailStudentId(null);
            await handleDelete(id, name);
          }}
        />
      )}
    </div>
  );
}
