// app/admin/layout.tsx

import React from "react";
import { logout } from "./actions";

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
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </button>
          </form>
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
