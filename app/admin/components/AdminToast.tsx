"use client";

import React, { useEffect } from "react";

export type AdminNotice = {
  type: "success" | "error";
  text: string;
};

export default function AdminToast({
  notice,
  onDismiss,
}: {
  notice: AdminNotice | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!notice) return;

    const timeoutId = window.setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [notice, onDismiss]);

  if (!notice) return null;

  return (
    <div className="fixed right-4 top-4 z-[60] max-w-sm">
      <div
        className={`rounded-md border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
          notice.type === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        {notice.text}
      </div>
    </div>
  );
}
