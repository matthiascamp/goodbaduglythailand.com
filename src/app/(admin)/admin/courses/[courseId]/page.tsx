"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  videoUrl: string | null;
  durationMin: number | null;
  sortOrder: number;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  sortOrder: number;
  modules: Module[];
}

type EditState =
  | { kind: "none" }
  | { kind: "course" }
  | { kind: "module"; id: string }
  | { kind: "lesson"; id: string; moduleId: string };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<EditState>({ kind: "none" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Module/lesson creation forms
  const [modForm, setModForm] = useState({ title: "", description: "", sortOrder: 0 });
  const [activeModId, setActiveModId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: "", slug: "", description: "", content: "", videoUrl: "", durationMin: "", sortOrder: 0,
  });

  async function load() {
    const res = await fetch(`/api/admin/courses/${params.courseId}`);
    if (!res.ok) { setError("Course not found"); setLoading(false); return; }
    const data = await res.json();
    setCourse(data.course);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveCourse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!course) return;
    setSaving(true); setFormError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get("title") as string,
      slug: fd.get("slug") as string,
      description: fd.get("description") as string,
      published: fd.get("published") === "on",
      sortOrder: parseInt(fd.get("sortOrder") as string) || 0,
    };
    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setFormError(data.error ?? "Error saving"); return; }
    setEditing({ kind: "none" });
    await load();
  }

  async function createModule(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    setSaving(true); setFormError("");
    const res = await fetch(`/api/admin/courses/${course.id}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modForm),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setFormError(data.error ?? "Error creating module"); return; }
    setModForm({ title: "", description: "", sortOrder: 0 });
    await load();
  }

  async function deleteModule(id: string) {
    if (!confirm("Delete this module and all its lessons?")) return;
    await fetch(`/api/admin/modules/${id}`, { method: "DELETE" });
    await load();
  }

  async function createLesson(e: React.FormEvent, moduleId: string) {
    e.preventDefault();
    setSaving(true); setFormError("");
    const body = {
      ...lessonForm,
      durationMin: lessonForm.durationMin ? parseInt(lessonForm.durationMin) : undefined,
      videoUrl: lessonForm.videoUrl || undefined,
    };
    const res = await fetch(`/api/admin/modules/${moduleId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setFormError(data.error ?? "Error creating lesson"); return; }
    setLessonForm({ title: "", slug: "", description: "", content: "", videoUrl: "", durationMin: "", sortOrder: 0 });
    setActiveModId(null);
    await load();
  }

  async function deleteLesson(id: string) {
    if (!confirm("Delete this lesson and all progress records?")) return;
    await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" });
    await load();
  }

  function startEditLesson(lesson: Lesson, moduleId: string) {
    setActiveModId(null);
    setEditing({ kind: "lesson", id: lesson.id, moduleId });
    setLessonForm({
      title: lesson.title, slug: lesson.slug, description: lesson.description ?? "",
      content: lesson.content, videoUrl: lesson.videoUrl ?? "",
      durationMin: lesson.durationMin?.toString() ?? "", sortOrder: lesson.sortOrder,
    });
    setFormError("");
  }

  async function saveLesson(e: React.FormEvent, lessonId: string) {
    e.preventDefault();
    setSaving(true); setFormError("");
    const res = await fetch(`/api/admin/lessons/${lessonId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...lessonForm,
        durationMin: lessonForm.durationMin ? Number(lessonForm.durationMin) : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setFormError(data.error ?? "Error saving lesson"); return; }
    setEditing({ kind: "none" });
    setLessonForm({ title: "", slug: "", description: "", content: "", videoUrl: "", durationMin: "", sortOrder: 0 });
    await load();
  }

  if (loading) return <div className="text-center py-20 text-charcoal/40">Loading…</div>;
  if (error || !course) return <div className="text-center py-20 text-burgundy">{error || "Not found"}</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/courses" className="text-gold hover:text-gold-dark text-sm">← All courses</Link>
        <span className="text-charcoal/30">/</span>
        <h1 className="font-serif text-2xl font-bold text-charcoal">{course.title}</h1>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          course.published ? "bg-emerald/10 text-emerald" : "bg-charcoal/10 text-charcoal/50"
        }`}>{course.published ? "Published" : "Draft"}</span>
      </div>

      {/* Course edit */}
      <div className="bg-cream border border-gold/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-semibold text-charcoal">Course Details</h2>
          <button onClick={() => setEditing(editing.kind === "course" ? { kind: "none" } : { kind: "course" })}
            className="text-xs font-semibold px-3 py-1.5 border border-gold/30 rounded-lg text-charcoal/70 hover:border-gold transition-colors">
            {editing.kind === "course" ? "Cancel" : "Edit"}
          </button>
        </div>
        {editing.kind === "course" ? (
          <form onSubmit={saveCourse} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">Title</label>
                <input name="title" required defaultValue={course.title}
                  className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">Slug</label>
                <input name="slug" required defaultValue={course.slug} pattern="[a-z0-9-]+"
                  className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Description</label>
              <textarea name="description" required rows={3} defaultValue={course.description}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div className="flex items-center gap-4">
              <input name="sortOrder" type="number" defaultValue={course.sortOrder}
                className="w-20 border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              <label className="flex items-center gap-2 text-sm text-charcoal/70 cursor-pointer">
                <input type="checkbox" name="published" defaultChecked={course.published} className="rounded" />
                Published
              </label>
              <button type="submit" disabled={saving}
                className="ml-auto bg-charcoal hover:bg-charcoal/80 disabled:opacity-50 text-cream text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            {formError && <p className="text-burgundy text-sm">{formError}</p>}
          </form>
        ) : (
          <div className="text-sm text-charcoal/70 space-y-1">
            <p><span className="font-medium text-charcoal">Slug:</span> <span className="font-mono">{course.slug}</span></p>
            <p className="line-clamp-2">{course.description}</p>
          </div>
        )}
      </div>

      {/* Modules */}
      <h2 className="font-serif text-xl font-semibold text-charcoal mb-4">Modules & Lessons</h2>

      <div className="space-y-4 mb-8">
        {course.modules.map((mod) => (
          <div key={mod.id} className="bg-cream border border-gold/20 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
              <div>
                <h3 className="font-serif font-semibold text-charcoal">{mod.title}</h3>
                {mod.description && <p className="text-xs text-charcoal/50 mt-0.5">{mod.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing({ kind: "none" }); setActiveModId(activeModId === mod.id ? null : mod.id); setLessonForm({ title: "", slug: "", description: "", content: "", videoUrl: "", durationMin: "", sortOrder: 0 }); }}
                  className="text-xs font-semibold px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-charcoal rounded-lg transition-colors">
                  + Lesson
                </button>
                <button onClick={() => deleteModule(mod.id)}
                  className="text-xs font-semibold px-3 py-1.5 bg-burgundy/10 hover:bg-burgundy/20 text-burgundy rounded-lg transition-colors">
                  Delete Module
                </button>
              </div>
            </div>

            {/* Lessons list */}
            <div className="divide-y divide-gold/10">
              {mod.lessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between px-5 py-3 hover:bg-gold/5">
                  <div>
                    <span className="text-sm font-medium text-charcoal">{lesson.title}</span>
                    <span className="ml-2 text-xs text-charcoal/40 font-mono">{lesson.slug}</span>
                    {lesson.durationMin && (
                      <span className="ml-2 text-xs text-charcoal/40">{lesson.durationMin} min</span>
                    )}
                  </div>
                <div className="flex gap-2">
                  <button onClick={() => startEditLesson(lesson, mod.id)}
                    className="text-xs font-semibold px-3 py-1 bg-gold/10 hover:bg-gold/20 text-charcoal rounded-lg transition-colors">Edit</button>
                  <button onClick={() => deleteLesson(lesson.id)}
                    className="text-xs font-semibold px-3 py-1 bg-burgundy/10 hover:bg-burgundy/20 text-burgundy rounded-lg transition-colors">Delete</button>
                </div>
                </div>
              ))}
              {mod.lessons.length === 0 && (
                <p className="px-5 py-3 text-sm text-charcoal/40 italic">No lessons yet.</p>
              )}
            </div>

            {/* Add lesson form */}
            {(activeModId === mod.id || (editing.kind === "lesson" && editing.moduleId === mod.id)) && (
              <form onSubmit={(e) => editing.kind === "lesson" ? saveLesson(e, editing.id) : createLesson(e, mod.id)}
                className="px-5 py-4 bg-cream-dark/30 border-t border-gold/10 space-y-3">
                <p className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide">{editing.kind === "lesson" ? "Edit Lesson" : "New Lesson"}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-charcoal/60 mb-1">Title</label>
                    <input required value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value, slug: slugify(e.target.value) })}
                      className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-charcoal/60 mb-1">Slug</label>
                    <input required value={lessonForm.slug} pattern="[a-z0-9-]+"
                      onChange={(e) => setLessonForm({ ...lessonForm, slug: e.target.value })}
                      className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal/60 mb-1">Description</label>
                  <input value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal/60 mb-1">Content (Markdown)</label>
                  <textarea required rows={4} value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-charcoal/60 mb-1">Video URL (optional)</label>
                    <input type="url" value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                      className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                      placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-charcoal/60 mb-1">Duration (minutes)</label>
                    <input type="number" min="1" value={lessonForm.durationMin}
                      onChange={(e) => setLessonForm({ ...lessonForm, durationMin: e.target.value })}
                      className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" value={lessonForm.sortOrder} min={0}
                    onChange={(e) => setLessonForm({ ...lessonForm, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-20 border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
                  <span className="text-xs text-charcoal/50">Sort order</span>
                  <button type="button" onClick={() => { setActiveModId(null); setEditing({ kind: "none" }); }}
                    className="ml-auto text-xs font-semibold px-4 py-2 border border-gold/30 rounded-lg text-charcoal/60 hover:border-gold transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="text-xs font-semibold px-4 py-2 bg-charcoal hover:bg-charcoal/80 disabled:opacity-50 text-cream rounded-lg transition-colors">
                    {saving ? "Saving…" : editing.kind === "lesson" ? "Save Lesson" : "Add Lesson"}
                  </button>
                </div>
                {formError && <p className="text-burgundy text-xs">{formError}</p>}
              </form>
            )}
          </div>
        ))}
      </div>

      {/* Add module form */}
      <div className="bg-cream border border-gold/20 rounded-xl p-6">
        <h3 className="font-serif font-semibold text-charcoal mb-4">Add Module</h3>
        <form onSubmit={createModule} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Module Title</label>
              <input required value={modForm.title}
                onChange={(e) => setModForm({ ...modForm, title: e.target.value })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                placeholder="Module 1: Getting Started" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Description (optional)</label>
              <input value={modForm.description}
                onChange={(e) => setModForm({ ...modForm, description: e.target.value })}
                className="w-full border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="number" value={modForm.sortOrder} min={0}
              onChange={(e) => setModForm({ ...modForm, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-20 border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            <span className="text-xs text-charcoal/50">Sort order</span>
            <button type="submit" disabled={saving}
              className="ml-auto bg-charcoal hover:bg-charcoal/80 disabled:opacity-50 text-cream text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              {saving ? "Adding…" : "Add Module"}
            </button>
          </div>
          {formError && <p className="text-burgundy text-sm">{formError}</p>}
        </form>
      </div>
    </div>
  );
}
