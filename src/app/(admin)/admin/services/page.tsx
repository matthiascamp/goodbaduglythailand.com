"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  details: string | null;
  priceCents: number;
  currency: string;
  durationMin: number | null;
  available: boolean;
  sortOrder: number;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const BLANK = {
  title: "", slug: "", description: "", details: "",
  price: "", currency: "AUD", durationMin: "", sortOrder: 0, available: true,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/services");
    const data = await res.json();
    setServices(data.services ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError("");
    const body = {
      title: form.title,
      slug: form.slug,
      description: form.description,
      details: form.details || (editId ? null : undefined),
      priceCents: Math.round(Number(form.price) * 100),
      currency: form.currency.toUpperCase(),
      durationMin: form.durationMin ? parseInt(form.durationMin as string) : (editId ? null : undefined),
      available: form.available,
      sortOrder: form.sortOrder,
    };
    const url = editId ? `/api/admin/services/${editId}` : "/api/admin/services";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setFormError(data.error ?? "Error saving"); return; }
    setForm(BLANK); setEditId(null);
    await load();
  }

  function startEdit(service: Service) {
    setEditId(service.id);
    setForm({
      title: service.title,
      slug: service.slug,
      description: service.description,
      details: service.details ?? "",
      price: (service.priceCents / 100).toFixed(2),
      currency: service.currency,
      durationMin: service.durationMin ? String(service.durationMin) : "",
      sortOrder: service.sortOrder,
      available: service.available,
    });
    setFormError("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service?")) return;
    setActionId(id);
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    await load();
    setActionId(null);
  }

  async function toggleAvailable(service: Service) {
    setActionId(service.id);
    await fetch(`/api/admin/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !service.available }),
    });
    await load();
    setActionId(null);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-charcoal mb-8">Services & Advice Calls</h1>

      {/* Form */}
      <div className="bg-cream border border-gold/20 rounded-xl p-6 mb-8">
        <h2 className="font-serif font-semibold text-charcoal mb-4">
          {editId ? "Edit Service" : "New Service"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Title</label>
              <input required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                placeholder="Service title" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Slug</label>
              <input required value={form.slug} pattern="[a-z0-9-]+"
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal/60 mb-1">Short Description</label>
            <textarea required rows={2} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal/60 mb-1">Details (optional, shown on services page)</label>
            <textarea rows={3} value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Price ({form.currency || "currency"})</label>
              <input required type="number" min="0.01" step="0.01" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                placeholder="197.00" />
              <p className="text-xs text-charcoal/40 mt-0.5">Enter the amount clients will see.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Currency</label>
              <input value={form.currency} maxLength={3}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Duration (min)</label>
              <input type="number" min="1" value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Sort order</label>
              <input type="number" value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-charcoal/70 cursor-pointer">
              <input type="checkbox" checked={form.available}
                onChange={(e) => setForm({ ...form, available: e.target.checked })} className="rounded" />
              Available (visible on site)
            </label>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm(BLANK); setFormError(""); }}
                className="text-sm px-4 py-2 border border-gold/30 rounded-lg text-charcoal/60 hover:border-gold transition-colors">
                Cancel Edit
              </button>
            )}
            <button type="submit" disabled={saving}
              className="ml-auto bg-charcoal hover:bg-charcoal/80 disabled:opacity-50 text-cream text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              {saving ? "Saving…" : editId ? "Save Changes" : "Create Service"}
            </button>
          </div>
          {formError && <p className="text-burgundy text-sm">{formError}</p>}
        </form>
      </div>

      {/* Services list */}
      {loading ? (
        <div className="text-center py-16 text-charcoal/40">Loading…</div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 text-charcoal/40 font-serif">No services yet.</div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="bg-cream border border-gold/20 rounded-xl p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-serif font-semibold text-charcoal truncate">{service.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    service.available ? "bg-emerald/10 text-emerald" : "bg-charcoal/10 text-charcoal/50"
                  }`}>{service.available ? "Available" : "Hidden"}</span>
                </div>
                <p className="text-xs text-charcoal/50 font-mono">/services/{service.slug}</p>
                <p className="text-sm font-semibold text-gold mt-0.5">
                  {formatPrice(service.priceCents, service.currency, "en-AU")} {service.currency}
                  {service.durationMin && <span className="text-charcoal/40 font-normal ml-2">{service.durationMin} min</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleAvailable(service)} disabled={actionId === service.id}
                  className="text-xs font-semibold px-3 py-1.5 border border-gold/30 rounded-lg hover:border-gold text-charcoal/70 transition-colors disabled:opacity-50">
                  {service.available ? "Hide" : "Show"}
                </button>
                <button onClick={() => startEdit(service)}
                  className="text-xs font-semibold px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-charcoal rounded-lg transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(service.id)} disabled={actionId === service.id}
                  className="text-xs font-semibold px-3 py-1.5 bg-burgundy/10 hover:bg-burgundy/20 text-burgundy rounded-lg transition-colors disabled:opacity-50">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
