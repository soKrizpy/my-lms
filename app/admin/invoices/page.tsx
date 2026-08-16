"use client";

import React, { useState, useEffect } from "react";
import InvoiceModal from "./InvoiceModal";

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // By default select the previous month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [reminderVisible, setReminderVisible] = useState(false);

  useEffect(() => {
    const today = new Date();
    if (today.getDate() <= 7) {
      setReminderVisible(true);
    }
  }, []);

  const fetchInvoices = async (month: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices?monthYear=${month}`);
      if (!res.ok) throw new Error("Gagal mengambil data invoice");
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(selectedMonth);
  }, [selectedMonth]);

  const handleGenerate = async () => {
    if (!confirm(`Generate invoice untuk bulan ${selectedMonth}?`)) return;
    setGenerating(true);
    // Yield a macrotask so the browser can repaint (disabled button state)
    // before the fetch blocks the main thread — fixes INP regression.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    try {
      const res = await fetch("/api/admin/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthYear: selectedMonth })
      });
      if (!res.ok) throw new Error("Gagal generate invoice");
      const result = await res.json();
      alert(`Berhasil generate ${result.generated} invoice.`);
      fetchInvoices(selectedMonth);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleUpdateStatus = async (invoice: Invoice, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: invoice.id,
          price_per_meeting: invoice.price_per_meeting,
          bank_account: invoice.bank_account,
          status: newStatus,
          total_amount: invoice.total_amount
        }),
      });
      if (!res.ok) throw new Error("Gagal update status");
      fetchInvoices(selectedMonth);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Manajemen Invoice</h1>
        
        <div className="flex items-center gap-4">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--glass-border)] focus:outline-none focus:border-brand-primary transition-colors"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-[0_0_15px_var(--color-primary-glow)] disabled:opacity-50"
          >
            {generating ? "Memproses..." : "Generate Invoice"}
          </button>
        </div>
      </div>

      {reminderVisible && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-700 dark:text-yellow-200 p-4 rounded-xl flex justify-between items-center">
          <div>
            <span className="font-bold">Pengingat:</span> Ini awal bulan, jangan lupa untuk generate dan kirim invoice kelas bulan lalu.
          </div>
          <button onClick={() => setReminderVisible(false)} className="text-lg font-bold hover:opacity-75">×</button>
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
                  <td className="p-4">
                    <div className="font-medium">{inv.students?.full_name || "Unknown"}</div>
                  </td>
                  <td className="p-4">
                    {inv.attended_meetings} / {inv.total_meetings} Pertemuan
                  </td>
                  <td className="p-4">
                    Rp {(inv.total_amount || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      inv.status === 'draft' ? 'bg-gray-500/20 border-gray-500/50 text-gray-700 dark:text-gray-300' :
                      inv.status === 'sent' ? 'bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300' :
                      'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300'
                    }`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(inv)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--glass-border)] hover:border-brand-primary hover:text-brand-primary transition-colors text-sm"
                      >
                        Edit
                      </button>
                      {inv.status === 'draft' && (
                        <button
                          onClick={() => handleUpdateStatus(inv, 'sent')}
                          className="px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
                        >
                          Kirim
                        </button>
                      )}
                      {inv.status === 'sent' && (
                        <button
                          onClick={() => handleUpdateStatus(inv, 'paid')}
                          className="px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-sm"
                        >
                          Tandai Lunas
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceModal 
          invoice={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)} 
          onSaved={() => {
            setSelectedInvoice(null);
            fetchInvoices(selectedMonth);
          }}
        />
      )}
    </div>
  );
}
