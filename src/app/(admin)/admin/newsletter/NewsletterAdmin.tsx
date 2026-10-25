"use client";

import { useEffect, useState } from "react";

type Subscriber = { id: string; email: string; status: string; consentAt: string; consentSource: string };

export default function NewsletterAdmin() {
  const [rows, setRows] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const response = await fetch("/api/admin/newsletter");
      if (!response.ok) throw new Error("Could not load subscribers.");
      const data = await response.json();
      setRows(data.subscribers ?? []);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load subscribers."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function change(row: Subscriber, method: "PATCH" | "DELETE") {
    if (!window.confirm(method === "DELETE" ? `Permanently delete ${row.email} and its consent record?` : `Unsubscribe ${row.email}?`)) return;
    setBusy(row.id); setError("");
    try {
      const response = await fetch(`/api/admin/newsletter/${row.id}`, { method });
      if (!response.ok) throw new Error("The change could not be saved.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "The change could not be saved."); }
    finally { setBusy(null); }
  }

  if (loading) return <p>Loading subscribers…</p>;
  return (
    <div className="bg-cream border border-gold/20 rounded-xl p-5 overflow-x-auto">
      {error && <p className="text-burgundy mb-4" role="alert">{error}</p>}
      {rows.length === 0 ? <p>No sign-ups yet.</p> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th className="p-2">Email</th><th className="p-2">Status</th><th className="p-2">Consent date</th><th className="p-2">Source</th><th className="p-2">Actions</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-gold/20"><td className="p-2">{row.email}</td><td className="p-2">{row.status}</td><td className="p-2">{new Date(row.consentAt).toLocaleDateString("en-AU")}</td><td className="p-2">{row.consentSource}</td><td className="p-2 space-x-3">{row.status === "ACTIVE" && <button type="button" disabled={busy === row.id} onClick={() => change(row, "PATCH")} className="underline">Unsubscribe</button>}<button type="button" disabled={busy === row.id} onClick={() => change(row, "DELETE")} className="underline text-burgundy">Delete</button></td></tr>)}</tbody>
        </table>
      )}
      {rows.length === 500 && <p className="mt-4 text-sm">Showing the 500 most recent records.</p>}
    </div>
  );
}
