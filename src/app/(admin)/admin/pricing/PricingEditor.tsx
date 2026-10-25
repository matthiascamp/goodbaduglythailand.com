"use client";

import { useState, type FormEvent } from "react";

type Entry = { key: string; label: string; group: string; cents: number };

export default function PricingEditor({ entries }: { entries: Entry[] }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(entries.map((e) => [e.key, (e.cents / 100).toFixed(2)])));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prices: Record<string, number> = {};
    for (const entry of entries) {
      const raw = values[entry.key];
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) { setState("error"); setMessage(`Enter a valid AUD amount for ${entry.label}.`); return; }
      prices[entry.key] = Math.round(Number(raw) * 100);
      if ((prices[entry.key] < 100 && !(entry.key === "membership:one-time" && prices[entry.key] === 0)) || prices[entry.key] > 10_000_000) { setState("error"); setMessage(`Price for ${entry.label} must be between A$1 and A$100,000. Membership may be A$0 while unset.`); return; }
    }
    setState("saving"); setMessage("");
    try {
      const response = await fetch("/api/admin/pricing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prices }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Prices could not be saved.");
      setState("saved"); setMessage("Prices saved. Public pages and new membership checkouts now use these amounts.");
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Prices could not be saved."); }
  }

  return (
    <form onSubmit={save} className="bg-cream border border-gold/20 rounded-xl p-6 max-w-3xl">
      {Array.from(new Set(entries.map((entry) => entry.group))).map((group) => (
        <fieldset key={group} className="mb-6">
          <legend className="font-serif text-xl font-semibold text-charcoal mb-3">{group}</legend>
          <div className="grid sm:grid-cols-2 gap-4">
            {entries.filter((entry) => entry.group === group).map((entry) => (
              <label key={entry.key} className="block text-sm text-charcoal">
                <span className="block mb-1">{entry.label}</span>
                <span className="flex items-center border border-gold/30 rounded-lg bg-white overflow-hidden"><span className="px-3">A$</span><input className="w-full p-2 outline-none" type="number" min={entry.key === "membership:one-time" ? "0" : "1"} max="100000" step="0.01" required value={values[entry.key]} onChange={(e) => { setValues({ ...values, [entry.key]: e.target.value }); setState("idle"); }} /></span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button className="temple-btn" type="submit" disabled={state === "saving"}>{state === "saving" ? "Saving…" : "Save prices"}</button>
      {message && <p className="mt-4 text-sm" role="status">{message}</p>}
    </form>
  );
}
