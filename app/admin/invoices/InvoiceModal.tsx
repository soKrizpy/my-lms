"use client";

import React, { useState } from "react";

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
  students: {
    full_name: string;
  };
};

export default function InvoiceModal({ invoice, onClose, onSaved }: { invoice: Invoice, onClose: () => void, onSaved: () => void }) {
  const [price, setPrice] = useState(invoice.price_per_meeting.toString());
  const [bankAccount, setBankAccount] = useState(invoice.bank_account || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const numPrice = parseInt(price) || 0;
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: invoice.id,
          price_per_meeting: numPrice,
          bank_account: bankAccount,
          status: invoice.status,
          total_amount: invoice.attended_meetings * numPrice
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan invoice");
      onSaved();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = invoice.attended_meetings * (parseInt(price) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
          Edit Invoice - {invoice.students?.full_name}
        </h3>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between border-b border-[var(--glass-border)] pb-2">
            <span className="opacity-70">Bulan</span>
            <span className="font-medium">{invoice.month_year}</span>
          </div>
          <div className="flex justify-between border-b border-[var(--glass-border)] pb-2">
            <span className="opacity-70">Kehadiran</span>
            <span className="font-medium">{invoice.attended_meetings} dari {invoice.total_meetings}</span>
          </div>

          <div>
            <label className="block text-sm font-medium opacity-70 mb-1">Harga per Pertemuan (Rp)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--glass-border)] focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium opacity-70 mb-1">Nomor Rekening Admin</label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="Contoh: BCA 1234567890 a.n. John Doe"
              className="w-full px-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--glass-border)] focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          <div className="flex justify-between border-t border-[var(--glass-border)] pt-4 mt-2">
            <span className="font-bold text-lg">Total Tagihan</span>
            <span className="font-bold text-lg text-brand-primary">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--background)] border border-[var(--glass-border)] hover:bg-[var(--glass-border)] transition-colors text-sm font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:opacity-90 transition-all text-sm font-medium shadow-lg hover:shadow-[0_0_15px_var(--color-primary-glow)] disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
