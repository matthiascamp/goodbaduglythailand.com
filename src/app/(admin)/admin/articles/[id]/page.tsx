"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ArticleBody from "@/components/ArticleBody";

interface Category {
  id: string;
  name: string;
}

interface CoverResource { id: string; title: string; mimeType: string; access: string; published: boolean }

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Tab = "content" | "preview" | "settings";

export default function AdminArticleEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coverResources, setCoverResources] = useState<CoverResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    categoryId: "",
    published: false,
  });

  async function load() {
    const [artRes, catRes, resourceRes] = await Promise.all([
      fetch(`/api/admin/articles/${params.id}`),
      fetch("/api/admin/categories"),
      fetch("/api/admin/resources"),
    ]);
    if (!artRes.ok) { setError("Article not found"); setLoading(false); return; }
    const artData = await artRes.json();
    const catData = await catRes.json();
    const a: Article = artData.article;
    setArticle(a);
    setCategories(catData.categories ?? []);
    if (resourceRes.ok) {
      const resourceData = await resourceRes.json();
      setCoverResources((resourceData.resources ?? []).filter((r: CoverResource) => r.published && r.access === "PUBLIC" && ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(r.mimeType)));
    }
    setForm({
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      coverImage: a.coverImage ?? "",
      categoryId: a.categoryId ?? "",
      published: a.published,
    });
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);
    setSaving(true);
    const res = await fetch(`/api/admin/articles/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage || "",
        categoryId: form.categoryId || null,
        published: form.published,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveError(data.error ?? "Error saving"); return; }
    setSaveSuccess(true);
    setArticle(data.article);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  async function handleDelete() {
    if (!article) return;
    if (!confirm(`Delete "${article.title}" and all its comments? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/articles/${params.id}`, { method: "DELETE" });
    router.push("/admin/articles");
  }

  if (loading) return <div className="text-center py-20 text-charcoal/40">Loading…</div>;
  if (error || !article) return (
    <div className="text-center py-20">
      <p className="text-burgundy mb-4">{error || "Article not found"}</p>
      <Link href="/admin/articles" className="text-gold hover:text-gold-dark text-sm">← Back to articles</Link>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articles" className="text-gold hover:text-gold-dark text-sm shrink-0">
          ← All articles
        </Link>
        <span className="text-charcoal/30">/</span>
        <h1 className="font-serif text-2xl font-bold text-charcoal truncate">{article.title}</h1>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
          form.published ? "bg-emerald/10 text-emerald" : "bg-gold/10 text-gold"
        }`}>
          {form.published ? "Published" : "Draft"}
        </span>
        {article.published && (
          <Link
            href={`/articles/${article.slug}`}
            target="_blank"
            className="ml-auto shrink-0 text-xs font-semibold px-3 py-1.5 border border-charcoal/20 rounded-lg hover:border-charcoal/40 text-charcoal/60 transition-colors"
          >
            View live →
          </Link>
        )}
      </div>

      <form onSubmit={handleSave}>
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gold/20">
          {(["content", "preview", "settings"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors -mb-px border-b-2 ${
                activeTab === tab
                  ? "border-charcoal text-charcoal"
                  : "border-transparent text-charcoal/50 hover:text-charcoal/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content tab */}
        {activeTab === "content" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">Slug</label>
                <div className="flex gap-2">
                  <input
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    pattern="[a-z0-9-]+"
                    className="flex-1 border border-gold/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, slug: slugify(form.title) })}
                    className="text-xs px-3 py-2 border border-gold/30 rounded-lg text-charcoal/50 hover:border-gold transition-colors"
                    title="Re-generate from title"
                  >
                    ↻
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">
                Excerpt <span className="text-charcoal/40">(shown in article listing, max 500 chars)</span>
              </label>
              <textarea
                required
                rows={2}
                maxLength={500}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
              <p className="text-xs text-charcoal/40 mt-1">{form.excerpt.length}/500</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-charcoal/60">Body Content</label>
                <span className="text-xs text-charcoal/40">
                  ## H2 · ### H3 · **bold** · - list · blank line = paragraph break
                </span>
              </div>
              <textarea
                required
                rows={20}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold leading-relaxed"
                spellCheck
              />
              <p className="text-xs text-charcoal/40 mt-1">
                {form.content.split(/\s+/).filter(Boolean).length} words · {form.content.length} chars
              </p>
            </div>
          </div>
        )}

        {/* Preview tab */}
        {activeTab === "preview" && (
          <div className="bg-cream border border-gold/20 rounded-xl p-8 max-w-2xl">
            <p className="text-xs text-charcoal/40 uppercase tracking-wider font-semibold mb-6">
              Preview — matches public rendering
            </p>
            {form.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.coverImage} alt="" className="w-full rounded-lg mb-6 max-h-64 object-cover" />
            )}
            <h1 className="font-serif text-3xl font-bold text-charcoal mb-3">{form.title || "Untitled"}</h1>
            <p className="text-charcoal/60 text-lg mb-8">{form.excerpt}</p>
            <div className="border-t border-gold/20 pt-8">
              <ArticleBody content={form.content} />
            </div>
          </div>
        )}

        {/* Settings tab */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-lg">
            <div className="bg-cream border border-gold/20 rounded-xl p-5 space-y-4">
              <h3 className="font-serif font-semibold text-charcoal">Publishing</h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-charcoal">Published</span>
                  <p className="text-xs text-charcoal/50">
                    {form.published
                      ? "Visible to the public at /articles/" + form.slug
                      : "Draft — not visible to visitors"}
                  </p>
                </div>
              </label>

              {article.publishedAt && (
                <p className="text-xs text-charcoal/40">
                  First published: {new Date(article.publishedAt).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>

            <div className="bg-cream border border-gold/20 rounded-xl p-5 space-y-4">
              <h3 className="font-serif font-semibold text-charcoal">Category & Media</h3>

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
                {form.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.coverImage} alt="" className="mt-2 rounded-lg max-h-32 object-cover" />
                )}
              </div>
            </div>

            <div className="bg-burgundy/5 border border-burgundy/20 rounded-xl p-5">
              <h3 className="font-serif font-semibold text-burgundy mb-2">Danger Zone</h3>
              <p className="text-xs text-charcoal/60 mb-3">
                Permanently deletes the article and all comments. Cannot be undone.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm font-semibold px-4 py-2 bg-burgundy/10 hover:bg-burgundy/20 text-burgundy rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete Article"}
              </button>
            </div>
          </div>
        )}

        {/* Save bar */}
        <div className="sticky bottom-0 left-0 right-0 mt-6 bg-cream/90 backdrop-blur border-t border-gold/20 px-0 py-4 flex items-center gap-4">
          {saveError && <p className="text-burgundy text-sm">{saveError}</p>}
          {saveSuccess && <p className="text-emerald text-sm font-medium">Saved.</p>}
          <button
            type="submit"
            disabled={saving}
            className="ml-auto bg-charcoal hover:bg-charcoal/80 disabled:opacity-50 text-cream text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
