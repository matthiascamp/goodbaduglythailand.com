"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = ["NEW", "REPLIED", "ARCHIVED"] as const;

export default function EnquiryStatusButtons({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function set(next: string) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (!res.ok) return setError("Could not update status");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATUSES.filter((s) => s !== status).map((s) => (
        <button key={s} onClick={() => set(s)} disabled={busy} className="px-3 py-1 rounded-lg text-xs font-semibold border border-gold/30 text-charcoal/70 hover:border-gold disabled:opacity-50">
          Mark {s.toLowerCase()}
        </button>
      ))}
      {error && <span role="alert" className="text-xs text-burgundy">{error}</span>}
    </div>
  );
}
