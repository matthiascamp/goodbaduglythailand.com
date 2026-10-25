import type { Metadata } from "next";
import { requireMemberPage } from "@/lib/page-auth";
import { db } from "@/lib/db";
import CourseCard from "@/components/CourseCard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Course Library",
};

export default async function CoursesPage() {
  const session = await requireMemberPage();
  const userId = session.user.id;

  const courses = await db.course.findMany({
    where: { published: true },
    include: {
      modules: {
        include: {
          lessons: {
            include: {
              lessonProgress: { where: { userId } },
            },
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="library-page">
      <section className="library-hero"><div className="editorial-container">
        <p className="editorial-eyebrow editorial-eyebrow-light"><span className="editorial-rule" /> MEMBER LIBRARY / ALL COURSES</p>
        <h1>Go further. <em>Look closer.</em></h1>
        <p>Every published course in one place. Follow the lessons at your own pace and pick up where you left off.</p>
      </div></section>
      <section className="library-content"><div className="editorial-container">
        <div className="library-section-heading"><span>YOUR COURSES</span><span>{String(courses.length).padStart(2, "0")} AVAILABLE</span></div>

      <div className={`library-course-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-6 ${courses.length === 1 ? "library-course-grid-single" : ""}`}>
        {courses.map((course, index) => {
          const totalL = course.modules.reduce((a, m) => a + m.lessons.length, 0);
          const completedL = course.modules.reduce(
            (a, m) =>
              a + m.lessons.filter((l) => l.lessonProgress.length > 0).length,
            0
          );

          return (
            <CourseCard
              key={course.id}
              number={index + 1}
              title={course.title}
              slug={course.slug}
              description={course.description}
              moduleCount={course.modules.length}
              lessonCount={totalL}
              completedCount={completedL}
            />
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="library-empty">
          <div className="library-empty-photo" role="img" aria-label="A neighbourhood cafe in Thailand" />
          <div><span>01 / THE LIBRARY</span><h2>Something worth<br /><em>taking your time with.</em></h2><p>Courses will appear here as soon as they are published. In the meantime, the journal is open for reading.</p><Link href="/articles" className="editorial-text-link">Explore the journal ↗</Link></div>
        </div>
      )}
      </div></section>
    </main>
  );
}
