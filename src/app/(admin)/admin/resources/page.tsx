"use client";

import { useEffect, useState } from "react";

type Resource = {
  id: string;
  title: string;
  description: string;
  originalName: string;
  sizeBytes: number;
  access: "PUBLIC" | "MEMBER";
  published: boolean;
  createdAt: string;
};

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [access, setAccess] = useState<"PUBLIC" | "MEMBER">("MEMBER");
  const [published, setPublished] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/resources", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setResources(data.resources || []);
    } else setError("Could not load resources.");
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setSaving(true); setError(""); setSuccess("");
    const form = new FormData();
    form.set("file", file);
    form.set("title", title);
    form.set("description", description);
    form.set("access", access);
    form.set("published", String(published));
    try {
      const response = await fetch("/api/admin/resources", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setFile(null); setTitle(""); setDescription(""); setAccess("MEMBER"); setPublished(false);
      const input = document.getElementById("resource-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setSuccess("Resource saved. You can change its access or publishing status below.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed"); }
    finally { setSaving(false); }
  }

  async function update(resource: Resource, change: Partial<Pick<Resource, "published" | "access">>) {
    setBusyId(resource.id); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/admin/resources/${resource.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(change),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Update failed"); }
    finally { setBusyId(null); }
  }

  async function remove(resource: Resource) {
    if (!window.confirm(`Permanently delete “${resource.title}” and its file?`)) return;
    setBusyId(resource.id); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/admin/resources/${resource.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Delete failed");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Delete failed"); }
    finally { setBusyId(null); }
  }

  return <div className="resource-admin">
    <div className="resource-admin-heading"><span className="editorial-eyebrow">THE CONTENT STUDIO / RESOURCES</span><h1>Files for the <em>library.</em></h1><p>Upload guides, worksheets, audio, video, archives, or any other file. Files stay private until you publish them.</p></div>
    <form onSubmit={upload} className="resource-upload-form">
      <h2>Add a resource</h2>
      <div className="resource-form-grid">
        <label>Title<input required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} placeholder="A guide to getting started" /></label>
        <label>File <span>Up to 100 MB</span><input id="resource-file" required type="file" onChange={event => setFile(event.target.files?.[0] || null)} /></label>
      </div>
      <label>Description<textarea maxLength={1000} rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder="What will members find inside?" /></label>
      <div className="resource-form-footer">
        <label>Who can download?<select value={access} onChange={event => setAccess(event.target.value as "PUBLIC" | "MEMBER")}><option value="MEMBER">Members only</option><option value="PUBLIC">Everyone</option></select></label>
        <label className="resource-checkbox"><input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)} /> Publish now</label>
        <button type="submit" disabled={saving || !file}>{saving ? "Uploading…" : "Add resource ↗"}</button>
      </div>
    </form>
    {error && <p className="resource-message resource-error" role="alert">{error}</p>}
    {success && <p className="resource-message" role="status">{success}</p>}
    <div className="resource-admin-list-head"><h2>Resources <span>{resources.length}</span></h2><p>Drafts are visible only in this studio.</p></div>
    {loading ? <p>Loading resources…</p> : resources.length === 0 ? <div className="resource-admin-empty">No resources yet. Your first upload will appear here.</div> :
      <div className="resource-admin-list">{resources.map(resource => <div className="resource-admin-row" key={resource.id}>
        <div><span className="resource-admin-meta">{resource.originalName} · {(resource.sizeBytes / 1024 / 1024).toFixed(1)} MB</span><h3>{resource.title}</h3><p>{resource.description || "No description"}</p></div>
        <div className="resource-admin-controls">
          <label>Access<select disabled={busyId === resource.id} value={resource.access} onChange={event => void update(resource, { access: event.target.value as "PUBLIC" | "MEMBER" })}><option value="MEMBER">Members</option><option value="PUBLIC">Everyone</option></select></label>
          <button disabled={busyId === resource.id} onClick={() => void update(resource, { published: !resource.published })}>{resource.published ? "Unpublish" : "Publish"}</button>
          <a href={`/api/resources/${resource.id}/download`}>Download</a>
          <button className="resource-delete" disabled={busyId === resource.id} onClick={() => void remove(resource)}>Delete</button>
        </div>
      </div>)}</div>}
  </div>;
}
