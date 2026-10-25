import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireMemberPage } from "@/lib/page-auth";
import { db } from "@/lib/db";
import Link from "next/link";

interface CoursePageProps {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = await db.course.findUnique({
    where: { slug: courseSlug, published: true },
    select: { title: true, description: true },
  });
  if (!course) return { title: "Course Not Found" };
  return { title: course.title, description: course.description };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseSlug } = await params;
  const session = await requireMemberPage();
  const userId = session.user.id;

  const course = await db.course.findUnique({
    where: { slug: courseSlug, published: true },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: { lessonProgress: { where: { userId } } },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const totalLessons = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
  const completedLessons = course.modules.reduce(
    (sum, mod) => sum + mod.lessons.filter((lesson) => lesson.lessonProgress.length > 0).length,
    0
  );
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const continueLesson = course.modules
    .flatMap((mod) => mod.lessons)
    .find((lesson) => lesson.lessonProgress.length === 0);

  return (
    <main className="course-detail-shell">
      <div className="editorial-container course-detail-page">
        <nav className="course-detail-breadcrumb" aria-label="Breadcrumb">
          <Link href="/courses">All courses</Link><span aria-hidden="true">/</span><span>{course.title}</span>
        </nav>

        <header className="course-detail-hero">
          <p className="editorial-eyebrow editorial-eyebrow-light"><span className="editorial-rule" /> MEMBER COURSE</p>
          <h1>{course.title}</h1>
          <p className="course-detail-description">{course.description}</p>
          <div className="course-detail-meta">
            <span>{course.modules.length} {course.modules.length === 1 ? "module" : "modules"}</span>
            <span>{totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}</span>
            <span>{completedLessons} completed</span>
          </div>

          {totalLessons > 0 && <div className="course-detail-progress">
            <div><span>YOUR PROGRESS</span><strong>{progressPercent}%</strong></div>
            <div role="progressbar" aria-label="Course progress" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progressPercent}%` }} /></div>
          </div>}

          {continueLesson && <Link href={`/courses/${course.slug}/${continueLesson.slug}`} className="editorial-button editorial-button-light course-detail-action">
            {completedLessons === 0 ? "Start course" : "Continue course"}<span aria-hidden="true">↗</span>
          </Link>}
          {completedLessons === totalLessons && totalLessons > 0 && <p className="course-detail-finished">✓ Course complete</p>}
        </header>

        <section className="course-detail-modules" aria-label="Course modules">
          {course.modules.map((mod, modIdx) => {
            const modCompleted = mod.lessons.filter((lesson) => lesson.lessonProgress.length > 0).length;
            return <div key={mod.id} className="course-module">
              <div className="course-module-head">
                <div>
                  <span>MODULE / {String(modIdx + 1).padStart(2, "0")}</span>
                  <h2>{mod.title}</h2>
                  {mod.description && <p>{mod.description}</p>}
                </div>
                <strong>{modCompleted} / {mod.lessons.length}</strong>
              </div>
              <ol className="course-lesson-list">
                {mod.lessons.map((lesson, lessonIdx) => {
                  const completed = lesson.lessonProgress.length > 0;
                  return <li key={lesson.id}>
                    <Link href={`/courses/${course.slug}/${lesson.slug}`} className="course-lesson-row">
                      <span className="course-lesson-number">{completed ? "✓" : `${modIdx + 1}.${lessonIdx + 1}`}</span>
                      <span className="course-lesson-name"><strong>{lesson.title}</strong>{lesson.description && <small>{lesson.description}</small>}</span>
                      {lesson.durationMin && <span className="course-lesson-duration">{lesson.durationMin} min</span>}
                      <span className="course-lesson-arrow" aria-hidden="true">↗</span>
                    </Link>
                  </li>;
                })}
              </ol>
            </div>;
          })}
        </section>
      </div>
    </main>
  );
}
