// app/admin/layout.tsx

import React from "react";
import { logout } from "./actions";
import LogoutButton from "./components/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col p-4">
        <h2 className="text-lg font-semibold mb-6">Admin LMS</h2>

        <nav className="flex flex-col gap-2 text-sm">
          <a
            href="/admin"
            className="px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
          >
            Dashboard
          </a>
          <a
            href="/admin/modules"
            className="px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
          >
            Modul
          </a>
          <a
            href="/admin/students"
            className="px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
          >
            Siswa
          </a>
          <a
            href="/admin/meetings"
            className="px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
          >
            Jadwal
          </a>
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
