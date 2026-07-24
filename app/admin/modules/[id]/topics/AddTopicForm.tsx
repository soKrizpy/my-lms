"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../../../../lib/supabaseClient";

export function AddTopicForm({
  moduleId,
  onCreated,
}: {
  moduleId: string;
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [orderIndex, setOrderIndex] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Judul topik wajib diisi.");
      return;
    }

    if (orderIndex === "" || Number.isNaN(Number(orderIndex))) {
      setErrorMsg("Urutan topik harus angka.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.from("topics").insert({
        module_id: Number(moduleId),
        title,
        order_index: Number(orderIndex),
      });

      console.log("insert topic for module_id:", Number(moduleId));
      console.log("insert topic error:", error);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // Reset form
      setTitle("");
      setOrderIndex("");

      if (onCreated) {
        onCreated();
      }
    } catch (err: any) {
      setErrorMsg(err.message ?? "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: "1.5rem",
        marginBottom: "1.5rem",
        padding: "1rem",
        backgroundColor: "white",
        borderRadius: "0.5rem",
        border: "1px solid #e5e7eb",
      }}
    >
      <h2 style={{ marginBottom: "0.75rem" }}>Tambah Topik Baru</h2>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", marginBottom: "0.25rem" }}>
          Judul Topik
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "0.25rem",
            border: "1px solid #d1d5db",
          }}
          placeholder="Contoh: Pengantar JavaScript"
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", marginBottom: "0.25rem" }}>
          Urutan Topik (1, 2, 3, ...)
        </label>
        <input
          type="number"
          value={orderIndex}
          onChange={(e) =>
            setOrderIndex(e.target.value === "" ? "" : Number(e.target.value))
          }
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "0.25rem",
            border: "1px solid #d1d5db",
          }}
          placeholder="Contoh: 1"
        />
      </div>

      {errorMsg && (
        <p style={{ color: "red", marginBottom: "0.75rem" }}>{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#0f172a",
          color: "white",
          borderRadius: "0.25rem",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Menyimpan..." : "Simpan Topik"}
      </button>
    </form>
  );
}
