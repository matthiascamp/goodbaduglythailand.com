"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  content: string;
  videoUrl: string | null;
  durationMin: number | null;
  completed: boolean;
  course: { title: string; slug: string };
  module: { title: string };
  prevLesson: { slug: string } | null;
  nextLesson: { slug: string } | null;
}

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h2 key={i} className="font-serif text-2xl font-bold text-charcoal mt-10 mb-4">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3 key={i} className="font-serif text-xl font-bold text-charcoal mt-8 mb-3">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      return (
        <p key={i} className="font-semibold text-charcoal mb-2">
          {line.slice(2, -2)}
        </p>
      );
    }
    if (line.startsWith("- [ ] ")) {
      return (
        <li key={i} className="flex items-start gap-2 text-charcoal/80 leading-relaxed mb-1">
          <span className="mt-1 w-4 h-4 border border-gold/40 rounded inline-flex items-center justify-center shrink-0" />
          {line.slice(6)}
        </li>
      );
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <li key={i} className="text-charcoal/80 leading-relaxed ml-4 mb-1 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === "") {
      return <div key={i} className="mb-3" />;
    }
    return (
      <p key={i} className="text-charcoal/80 leading-relaxed mb-4">
        {line}
      </p>
    );
  });
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseSlug = params.courseSlug as string;
  const lessonSlug = params.lessonSlug as string;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/progress?courseSlug=${courseSlug}&lessonSlug=${lessonSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setLesson(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load lesson");
        setLoading(false);
      });
  }, [courseSlug, lessonSlug]);

  async function markComplete() {
    if (!lesson || lesson.completed) return;
    setMarking(true);

    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id }),
    });

    if (res.ok) {
      setLesson((l) => (l ? { ...l, completed: true } : l));
      if (lesson.nextLesson) {
        setTimeout(() => {
          router.push(`/courses/${courseSlug}/${lesson.nextLesson!.slug}`);
        }, 800);
      }
    }
    setMarking(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-charcoal/40 text-lg font-serif">Loading lesson…</div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-burgundy text-lg font-serif mb-4">
          {error || "Lesson not found"}
        </div>
        <Link href={`/courses/${courseSlug}`} className="text-gold hover:text-gold-dark">
          ← Back to course
        </Link>
      </div>
    );
  }

  return (
    <div className="lesson-shell">
    <div className="lesson-page max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="lesson-breadcrumb flex items-center gap-2 text-sm text-charcoal/50 mb-8 flex-wrap" aria-label="Breadcrumb">
        <Link href="/courses" className="hover:text-gold transition-colors">
          Courses
        </Link>
        <span>/</span>
        <Link
          href={`/courses/${courseSlug}`}
          className="hover:text-gold transition-colors"
        >
          {lesson.course.title}
        </Link>
        <span>/</span>
        <span className="truncate max-w-[200px]">{lesson.title}</span>
      </nav>

      {/* Lesson header */}
      <header className="lesson-header mb-8">
        <div className="text-xs font-semibold text-emerald uppercase tracking-wider mb-2">
          {lesson.module.title}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mb-3">
          {lesson.title}
        </h1>
        {lesson.description && (
          <p className="text-charcoal/60 text-lg">{lesson.description}</p>
        )}
        <div className="flex items-center gap-4 mt-4 text-sm text-charcoal/50">
          {lesson.durationMin && <span>{lesson.durationMin} min</span>}
          {lesson.completed && (
            <span className="text-emerald font-semibold">✓ Completed</span>
          )}
        </div>
      </header>

      {lesson.videoUrl && <div className="lesson-video bg-charcoal p-8 mb-8 text-cream">
        <p className="text-xs uppercase tracking-wider text-gold mb-3">Video lesson</p>
        <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="font-serif text-2xl hover:text-gold transition-colors">Open the video in a new tab ↗</a>
      </div>}

      {/* Lesson content */}
      <div className="lesson-prose prose-thai mb-12">{renderContent(lesson.content)}</div>

      {/* Navigation + Mark Complete */}
      <div className="lesson-actions border-t border-gold/20 pt-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Prev */}
          <div>
            {lesson.prevLesson ? (
              <Link
                href={`/courses/${courseSlug}/${lesson.prevLesson.slug}`}
                className="inline-flex items-center gap-2 text-charcoal/60 hover:text-gold transition-colors text-sm"
              >
                ← Previous Lesson
              </Link>
            ) : (
              <Link
                href={`/courses/${courseSlug}`}
                className="inline-flex items-center gap-2 text-charcoal/60 hover:text-gold transition-colors text-sm"
              >
                ← Course Overview
              </Link>
            )}
          </div>

          {/* Mark Complete */}
          <button
            onClick={markComplete}
            disabled={lesson.completed || marking}
            className={`lesson-complete-button px-6 py-3 font-bold text-sm transition-colors ${
              lesson.completed
                ? "bg-emerald/20 border border-emerald/40 text-emerald cursor-default"
                : "bg-gold hover:bg-gold-dark text-charcoal"
            }`}
          >
            {lesson.completed
              ? "✓ Lesson Complete"
              : marking
                ? "Marking…"
                : "Mark as Complete →"}
          </button>

          {/* Next */}
          <div className="text-right">
            {lesson.nextLesson ? (
              <Link
                href={`/courses/${courseSlug}/${lesson.nextLesson.slug}`}
                className="inline-flex items-center gap-2 text-charcoal/60 hover:text-gold transition-colors text-sm"
              >
                Next Lesson →
              </Link>
            ) : (
              <Link
                href={`/courses/${courseSlug}`}
                className="inline-flex items-center gap-2 text-charcoal/60 hover:text-gold transition-colors text-sm"
              >
                Course Overview →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
