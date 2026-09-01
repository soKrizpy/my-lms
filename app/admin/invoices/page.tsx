"use client";

import React, { useState, useEffect } from "react";
import InvoiceModal from "./InvoiceModal";

// ─── Parent Link popup ────────────────────────────────────────────────────────
function ParentLinkPopup({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔗</span>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Link Laporan Orang Tua</h3>
        </div>
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
          Bagikan link berikut kepada orang tua siswa. Link berlaku 30 hari dan tidak memerlukan login.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] font-mono truncate"
            style={{ color: 'var(--text-secondary)' }}
            onClick={e => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors text-white ${copied ? 'bg-green-600' : 'bg-brand-primary hover:bg-brand-primary/80'}`}
          >
            {copied ? '✓ Disalin!' : 'Salin'}
          </button>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-[var(--glass-border)] hover:bg-[var(--glass-border)] transition-colors" style={{ color: 'var(--text-muted)' }}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

type Invoice = {
  id: string;
  student_id: string;
  month_year: string;
  total_meetings: number;
  attended_meetings: number;
  price_per_meeting: number;
  total_amount: number;
  bank_account: string;
  status: string;
  created_at: string;
  students: {
    full_name: string;
    email_or_phone: string;
  };
};

type AttendanceRow = {
  meeting_id: string;
  title: string;
  meeting_date: string;
  has_joined: boolean;
};

function AttendanceModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/invoices/${invoice.id}/attendance`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [invoice.id]);

  const attended = rows.filter((r) => r.has_joined).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
              Detail Kehadiran
            </h3>
            <p className="text-sm opacity-70 mt-1">{invoice.students?.full_name} — {invoice.month_year}</p>
          </div>
          <button onClick={onClose} className="text-xl font-bold opacity-50 hover:opacity-100 transition-opacity">x</button>
        </div>

        {loading ? (
          <div className="text-center py-8 opacity-50">Memuat data...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 opacity-50">Tidak ada data pertemuan.</div>
        ) : (
          <>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {rows.map((row, i) => (
                <div key={row.meeting_id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--background)]/50">
                  <div>
                    <div className="text-sm font-medium">{i + 1}. {row.title}</div>
                    <div className="text-xs opacity-50 mt-0.5">
                      {new Date(row.meeting_date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    row.has_joined
                      ? "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300"
                      : "bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300"
                  }`}>
                    {row.has_joined ? "Hadir" : "Absen"}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center border-t border-[var(--glass-border)] pt-4 mt-4 text-sm font-semibold">
              <span>Total Hadir</span>
              <span className="text-brand-primary">{attended} / {rows.length} Pertemuan</span>
            </div>
          </>
        )}

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-[var(--background)] border border-[var(--glass-border)] hover:bg-[var(--glass-border)] transition-colors text-sm font-medium">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [attendanceInvoice, setAttendanceInvoice] = useState<Invoice | null>(null);
  // parentLinks: invoiceId → generated URL (session-level, no DB re-fetch needed)
  const [parentLinks, setParentLinks] = useState<Record<string, string>>({});
  const [generatingLink, setGeneratingLink] = useState<string | null>(null); // invoiceId being generated
  const [popupLink, setPopupLink] = useState<string | null>(null); // URL to show in popup

  const handleGenerateParentLink = async (inv: Invoice) => {
    // If already generated this session, just show it
    if (parentLinks[inv.id]) { setPopupLink(parentLinks[inv.id]); return; }
    setGeneratingLink(inv.id);
    try {
      const res = await fetch('/api/admin/parent-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: inv.student_id, invoiceId: inv.id }),
      });
      if (!res.ok) throw new Error('Gagal generate link');
      const { url } = await res.json() as { url: string };
      setParentLinks(prev => ({ ...prev, [inv.id]: url }));
      setPopupLink(url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGeneratingLink(null);
    }
  };

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [reminderVisible, setReminderVisible] = useState(false);

  useEffect(() => {
    if (new Date().getDate() <= 7) setReminderVisible(true);
  }, []);

  const fetchInvoices = async (month: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices?monthYear=${month}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil data invoice");
      setInvoices(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(selectedMonth); }, [selectedMonth]);

  const handleGenerate = async () => {
    if (!confirm(`Generate invoice untuk bulan ${selectedMonth}?`)) return;
    setGenerating(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    try {
      const res = await fetch("/api/admin/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthYear: selectedMonth }),
      });
      if (!res.ok) throw new Error("Gagal generate invoice");
      const result = await res.json();
      const updatedMsg = result.updated > 0 ? `, ${result.updated} diperbarui` : "";
      alert(`Berhasil generate ${result.generated} invoice baru${updatedMsg}.`);
      fetchInvoices(selectedMonth);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (invoice: Invoice, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoice.id, price_per_meeting: invoice.price_per_meeting, bank_account: invoice.bank_account, status: newStatus, total_amount: invoice.total_amount }),
      });
      if (!res.ok) throw new Error("Gagal update status");
      fetchInvoices(selectedMonth);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Parent link popup */}
      {popupLink && <ParentLinkPopup url={popupLink} onClose={() => setPopupLink(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Manajemen Invoice</h1>
        <div className="flex items-center gap-4">
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--glass-border)] focus:outline-none focus:border-brand-primary transition-colors" />
          <button onClick={handleGenerate} disabled={generating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-[0_0_15px_var(--color-primary-glow)] disabled:opacity-50">
            {generating ? "Memproses..." : "Generate Invoice"}
          </button>
        </div>
      </div>

      {reminderVisible && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-700 dark:text-yellow-200 p-4 rounded-xl flex justify-between items-center">
          <div><span className="font-bold">Pengingat:</span> Ini awal bulan, jangan lupa untuk generate dan kirim invoice kelas bulan lalu.</div>
          <button onClick={() => setReminderVisible(false)} className="text-lg font-bold hover:opacity-75">x</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 opacity-50">Memuat data...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-10 opacity-50 bg-[var(--background)]/50 rounded-xl border border-[var(--glass-border)]">Belum ada invoice untuk bulan ini.</div>
      ) : (
        <div className="overflow-x-auto glass-panel rounded-2xl border border-[var(--glass-border)]">
          <table className="w-full text-left">
            <thead className="border-b border-[var(--glass-border)] bg-[var(--background)]/50">
              <tr>
                <th className="p-4 font-semibold text-sm">Siswa</th>
                <th className="p-4 font-semibold text-sm">Kehadiran</th>
                <th className="p-4 font-semibold text-sm">Total Tagihan</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--background)]/50 transition-colors">
                  <td className="p-4"><div className="font-medium">{inv.students?.full_name || "Unknown"}</div></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span>{inv.attended_meetings} / {inv.total_meetings} Pertemuan</span>
                      <button onClick={() => setAttendanceInvoice(inv)} title="Lihat detail kehadiran"
                        className="p-1 rounded-lg opacity-50 hover:opacity-100 hover:text-brand-primary transition-all" aria-label="Lihat detail kehadiran">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="p-4">Rp {(inv.total_amount || 0).toLocaleString("id-ID")}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      inv.status === "draft" ? "bg-gray-500/20 border-gray-500/50 text-gray-700 dark:text-gray-300" :
                      inv.status === "sent"  ? "bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300" :
                                               "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300"
                    }`}>{inv.status.toUpperCase()}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--glass-border)] hover:border-brand-primary hover:text-brand-primary transition-colors text-sm">
                        Edit
                      </button>
                      {inv.status === "draft" && (
                        <button onClick={() => handleUpdateStatus(inv, "sent")}
                          className="px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm">
                          Kirim
                        </button>
                      )}
                      {inv.status === "sent" && (
                        <button onClick={() => handleUpdateStatus(inv, "paid")}
                          className="px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-sm">
                          Tandai Lunas
                        </button>
                      )}
                      <button
                        onClick={() => handleGenerateParentLink(inv)}
                        disabled={generatingLink === inv.id}
                        title="Generate atau tampilkan link laporan untuk orang tua"
                        className="px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium disabled:opacity-50"
                        style={{
                          background: parentLinks[inv.id] ? 'rgba(124,58,237,0.1)' : 'var(--background)',
                          borderColor: parentLinks[inv.id] ? 'rgba(124,58,237,0.4)' : 'var(--glass-border)',
                          color: parentLinks[inv.id] ? '#7c3aed' : 'var(--text-muted)',
                        }}
                      >
                        {generatingLink === inv.id ? '⏳' : parentLinks[inv.id] ? '🔗 Salin Link' : '🔗 Link Ortu'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)}
          onSaved={() => { setSelectedInvoice(null); fetchInvoices(selectedMonth); }} />
      )}

      {attendanceInvoice && (
        <AttendanceModal invoice={attendanceInvoice} onClose={() => setAttendanceInvoice(null)} />
      )}
    </div>
  );
}