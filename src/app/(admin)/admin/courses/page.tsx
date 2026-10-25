"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  sortOrder: number;
  _count: { modules: number };
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    published: false,
    sortOrder: 0,
  });
  const [formError, setFormError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/courses");
    const data = await res.json();
    setCourses(data.courses ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setCreating(true);
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setFormError(data.error ?? "Error creating course"); return; }
    setForm({ title: "", slug: "", description: "", published: false, sortOrder: 0 });
    await load();
  }

  async function togglePublished(course: Course) {
    setActionId(course.id);
    await fetch(`/api/admin/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !course.published }),
    });
    await load();
    setActionId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course and all its modules and lessons? This cannot be undone.")) return;
    setActionId(id);
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    await load();
    setActionId(null);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-charcoal mb-8">Courses</h1>

      {/* Create form */}
      <div className="bg-cream border border-gold/20 rounded-xl p-6 mb-8">
        <h2 className="font-serif font-semibold text-charcoal mb-4">New Course</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-1">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                placeholder="Course title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-1">Slug</label>
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                pattern="[a-z0-9-]+"
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold"
                placeholder="course-title"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal/70 mb-1">Description</label>
            <textarea
              required
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-20 border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
              <span className="text-sm text-charcoal/60">Sort order</span>
            </div>
            <label className="flex items-center gap-2 text-sm text-charcoal/70 cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="rounded"
              />
              Published
            </label>
            <button
              type="submit"
              disabled={creating}
              className="ml-auto bg-charcoal hover:bg-charcoal/80 disabled:opacity-50 text-cream text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {creating ? "Creating…" : "Create Course"}
            </button>
          </div>
          {formError && <p className="text-burgundy text-sm">{formError}</p>}
        </form>
      </div>

      {/* Course list */}
      {loading ? (
        <div className="text-center py-16 text-charcoal/40">Loading…</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-charcoal/40 font-serif">No courses yet.</div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-cream border border-gold/20 rounded-xl p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-serif font-semibold text-charcoal truncate">{course.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    course.published ? "bg-emerald/10 text-emerald" : "bg-charcoal/10 text-charcoal/50"
                  }`}>
                    {course.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-charcoal/50 font-mono">/courses/{course.slug}</p>
                <p className="text-xs text-charcoal/50 mt-0.5">{course._count.modules} module{course._count.modules !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => togglePublished(course)}
                  disabled={actionId === course.id}
                  className="text-xs font-semibold px-3 py-1.5 border border-gold/30 rounded-lg hover:border-gold text-charcoal/70 transition-colors disabled:opacity-50"
                >
                  {course.published ? "Unpublish" : "Publish"}
                </button>
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="text-xs font-semibold px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-charcoal rounded-lg transition-colors"
                >
                  Edit / Modules
                </Link>
                <button
                  onClick={() => handleDelete(course.id)}
                  disabled={actionId === course.id}
                  className="text-xs font-semibold px-3 py-1.5 bg-burgundy/10 hover:bg-burgundy/20 text-burgundy rounded-lg transition-colors disabled:opacity-50"
                >
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
