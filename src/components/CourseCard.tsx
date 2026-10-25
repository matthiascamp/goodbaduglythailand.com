import Link from "next/link";

interface CourseCardProps {
  number: number;
  title: string;
  slug: string;
  description: string;
  moduleCount: number;
  lessonCount: number;
  completedCount?: number;
}

export default function CourseCard({
  number,
  title,
  slug,
  description,
  moduleCount,
  lessonCount,
  completedCount = 0,
}: CourseCardProps) {
  const progressPercent =
    lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

  return (
    <Link href={`/courses/${slug}`} className="library-course-card">
      <div className="library-course-card-top">
        <span>COURSE / {String(number).padStart(2, "0")}</span>
        <span aria-hidden="true">↗</span>
      </div>

      <div className="library-course-card-body">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="library-course-card-foot">
        <span>{moduleCount} {moduleCount === 1 ? "module" : "modules"} · {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}</span>
        <strong>{completedCount > 0 ? "Continue course" : "Open course"}</strong>
      </div>
      {lessonCount > 0 && (
        <div className="library-course-progress" role="progressbar" aria-label={`${title} progress`} aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      )}
    </Link>
  );
}
