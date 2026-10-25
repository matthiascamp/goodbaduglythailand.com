"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CoverResource { id: string; title: string; mimeType: string; access: string; published: boolean }

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  category: { id: string; name: string } | null;
  _count: { comments: number };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const BLANK_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  categoryId: "",
  published: false,
};

export default function AdminArticlesPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-charcoal/40">Loading…</div>}>
      <AdminArticles />
    </Suspense>
  );
}

function AdminArticles() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coverResources, setCoverResources] = useState<CoverResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(searchParams.get("new") === "1");
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  async function load() {
    const [artRes, catRes, resourceRes] = await Promise.all([
      fetch("/api/admin/articles"),
      fetch("/api/admin/categories"),
      fetch("/api/admin/resources"),
    ]);
    const artData = await artRes.json();
    const catData = await catRes.json();
    setArticles(artData.articles ?? []);
    setCategories(catData.categories ?? []);
    if (resourceRes.ok) {
      const resourceData = await resourceRes.json();
      setCoverResources((resourceData.resources ?? []).filter((r: CoverResource) => r.published && r.access === "PUBLIC" && ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(r.mimeType)));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    const res = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        coverImage: form.coverImage || undefined,
        categoryId: form.categoryId || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setFormError(data.error ?? "Error creating article"); return; }
    setForm(BLANK_FORM);
    setShowCreate(false);
    await load();
  }

  async function togglePublished(article: Article) {
    setActionId(article.id);
    await fetch(`/api/admin/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !article.published }),
    });
    await load();
    setActionId(null);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}" and all its comments? This cannot be undone.`)) return;
    setActionId(id);
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    await load();
    setActionId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold text-charcoal">
          Articles ({articles.length})
        </h1>
        <button
          onClick={() => { setShowCreate(!showCreate); setFormError(""); }}
          className="bg-charcoal hover:bg-charcoal/80 text-cream text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          {showCreate ? "Cancel" : "+ New Article"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-cream border border-gold/20 rounded-xl p-6 mb-8">
          <h2 className="font-serif font-semibold text-charcoal mb-4">New Article</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })}
                  className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  placeholder="My Article Title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">Slug</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  pattern="[a-z0-9-]+"
                  className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold"
                  placeholder="my-article-title"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">
                Excerpt <span className="text-charcoal/40">(shown in listing, max 500 chars)</span>
              </label>
              <textarea
                required
                rows={2}
                maxLength={500}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">
                Content
                <span className="ml-2 font-normal text-charcoal/40">
                  — ## Heading 2 · ### Heading 3 · **bold** · - list item · blank line = paragraph break
                </span>
              </label>
              <textarea
                required
                rows={12}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold"
                placeholder={"## Introduction\n\nWrite your article content here.\n\n- Use bullet points for lists\n- **Bold text** is also supported\n\n### Sub-section\n\nMore content..."}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">Cover image (optional)</label>
                <select className="w-full border border-gold/30 px-3 py-2 text-sm mb-2" value={form.coverImage.startsWith("/api/resources/") ? form.coverImage : ""} onChange={(e) => setForm({ ...form, coverImage: e.target.value })}>
                  <option value="">Choose an uploaded image</option>
                  {coverResources.map((resource) => <option key={resource.id} value={`/api/resources/${resource.id}/view`}>{resource.title}</option>)}
                </select>
                <input
                  type="text"
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  placeholder="Or paste an https:// image URL"
                />
                <Link href="/admin/resources" className="text-xs text-gold mt-2 inline-block">Upload a cover image ↗</Link>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold bg-white"
                >
                  <option value="">— No category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-charcoal/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="rounded"
                />
                Publish immediately
              </label>
              <button
                type="submit"
                disabled={saving}
                className="ml-auto bg-charcoal hover:bg-charcoal/80 disabled:opacity-50 text-cream text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                {saving ? "Creating…" : "Create Article"}
              </button>
            </div>
            {formError && <p className="text-burgundy text-sm">{formError}</p>}
          </form>
        </div>
      )}

      {/* Article list */}
      {loading ? (
        <div className="text-center py-16 text-charcoal/40">Loading…</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 text-charcoal/40 font-serif">No articles yet. Create one above.</div>
      ) : (
        <div className="bg-cream border border-gold/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark">
                <tr>
                  <th className="text-left px-6 py-3 text-charcoal/60 font-medium">Title</th>
                  <th className="text-left px-6 py-3 text-charcoal/60 font-medium">Category</th>
                  <th className="text-left px-6 py-3 text-charcoal/60 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-charcoal/60 font-medium">Comments</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-cream-dark/50">
                    <td className="px-6 py-3">
                      <div className="font-medium text-charcoal max-w-xs truncate">{article.title}</div>
                      <div className="text-charcoal/40 text-xs font-mono">{article.slug}</div>
                    </td>
                    <td className="px-6 py-3 text-charcoal/60">
                      {article.category?.name ?? "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        article.published
                          ? "bg-emerald/10 text-emerald"
                          : "bg-gold/10 text-gold"
                      }`}>
                        {article.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-charcoal/60 text-center">
                      {article._count.comments}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => togglePublished(article)}
                          disabled={actionId === article.id}
                          className="text-xs font-semibold px-3 py-1.5 border border-gold/30 rounded-lg hover:border-gold text-charcoal/70 transition-colors disabled:opacity-50"
                        >
                          {article.published ? "Unpublish" : "Publish"}
                        </button>
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="text-xs font-semibold px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-charcoal rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                        {article.published && (
                          <Link
                            href={`/articles/${article.slug}`}
                            target="_blank"
                            className="text-xs font-semibold px-3 py-1.5 border border-charcoal/20 rounded-lg hover:border-charcoal/40 text-charcoal/60 transition-colors"
                          >
                            View →
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(article.id, article.title)}
                          disabled={actionId === article.id}
                          className="text-xs font-semibold px-3 py-1.5 bg-burgundy/10 hover:bg-burgundy/20 text-burgundy rounded-lg transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category manager */}
      <CategoryManager categories={categories} onCreated={load} />
    </div>
  );
}

function CategoryManager({
  categories,
  onCreated,
}: {
  categories: Category[];
  onCreated: () => void;
}) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, description: form.description || undefined }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Error creating category"); return; }
    setForm({ name: "", slug: "", description: "" });
    onCreated();
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-semibold text-charcoal">
          Categories ({categories.length})
        </h2>
        <button
          onClick={() => { setShow(!show); setError(""); }}
          className="text-sm font-semibold px-4 py-1.5 border border-gold/30 rounded-lg hover:border-gold text-charcoal/70 transition-colors"
        >
          {show ? "Cancel" : "+ New Category"}
        </button>
      </div>

      {show && (
        <div className="bg-cream border border-gold/20 rounded-xl p-5 mb-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                  className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  placeholder="Living in Thailand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">Slug</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  pattern="[a-z0-9-]+"
                  className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold"
                  placeholder="living-in-thailand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">Description (optional)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {error && <p className="text-burgundy text-sm">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="ml-auto bg-charcoal hover:bg-charcoal/80 disabled:opacity-50 text-cream text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                {saving ? "Creating…" : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="text-xs px-3 py-1.5 bg-cream border border-gold/20 rounded-full text-charcoal/60 font-mono">
              {c.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
