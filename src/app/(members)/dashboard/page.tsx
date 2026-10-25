import type { Metadata } from "next";
import { requireMemberPage } from "@/lib/page-auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
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
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const totalLessons = courses.reduce(
    (acc, c) => acc + c.modules.reduce((ma, m) => ma + m.lessons.length, 0),
    0
  );
  const completedLessons = courses.reduce(
    (acc, c) =>
      acc +
      c.modules.reduce(
        (ma, m) =>
          ma + m.lessons.filter((l) => l.lessonProgress.length > 0).length,
        0
      ),
    0
  );

  const overallPercent =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  const latestArticles = await db.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { title: true, slug: true, publishedAt: true, category: true },
  });

  return (
    <div className="member-dashboard-shell">
    <div className="member-dashboard max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mb-2">
          Your Thailand, <em>in progress.</em>
        </h1>
        <p className="text-charcoal/60">Welcome back, {session.user.name ?? "member"}. Pick up where you left off.</p>
      </div>

      <div className="member-stat-grid grid grid-cols-2 lg:grid-cols-4 mb-10">
        {[
          { label: "Overall Progress", value: `${overallPercent}%`, sub: `${completedLessons}/${totalLessons} lessons` },
          { label: "Courses Available", value: String(courses.length), sub: "Your library" },
          { label: "Lessons Completed", value: String(completedLessons), sub: `of ${totalLessons} total` },
          { label: "Membership", value: "Lifetime", sub: "One-time purchase" },
        ].map((stat) => (
          <div key={stat.label} className="member-stat">
            <div className="text-2xl font-serif font-bold text-charcoal mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-charcoal/70">{stat.label}</div>
            <div className="text-xs text-charcoal/40 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {totalLessons > 0 && <div className="member-progress-panel mb-10">
        <h2 className="font-serif text-lg font-semibold text-charcoal mb-4">Overall Course Progress</h2>
        <ProgressBar
          value={overallPercent}
          label={`${completedLessons} of ${totalLessons} lessons completed`}
          size="lg"
          color="gold"
        />
      </div>}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl font-bold text-charcoal">Your Courses</h2>
            <Link href="/courses" className="text-gold hover:text-gold-dark text-sm font-semibold">
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {courses.map((course) => {
              const totalL = course.modules.reduce((a, m) => a + m.lessons.length, 0);
              const completedL = course.modules.reduce(
                (a, m) => a + m.lessons.filter((l) => l.lessonProgress.length > 0).length,
                0
              );
              const pct = totalL > 0 ? Math.round((completedL / totalL) * 100) : 0;

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="member-course-row"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-serif font-bold text-charcoal">{course.title}</h3>
                    <span className="member-progress-badge shrink-0">
                      {pct}%
                    </span>
                  </div>
                  <ProgressBar value={pct} showPercent={false} size="sm" />
                  <div className="text-xs text-charcoal/50 mt-2">
                    {completedL}/{totalL} lessons · {course.modules.length} modules
                  </div>
                </Link>
              );
            })}
          </div>
          {courses.length === 0 && <div className="member-empty"><span>THE MEMBER LIBRARY</span><h3>Your courses will live here.</h3><p>Newly published courses will appear in your library automatically.</p><Link href="/articles" className="editorial-text-link">Read the journal ↗</Link></div>}
        </div>

        <div>
          <Link href="/resources" className="member-resource-link">
            <span>THE DOWNLOAD LIBRARY</span>
            <strong>Guides, files &amp; useful extras.</strong>
            <small>Explore resources included with your membership ↗</small>
          </Link>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl font-bold text-charcoal">Recent Articles</h2>
            <Link href="/articles" className="text-gold hover:text-gold-dark text-sm font-semibold">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {latestArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="member-article-row"
              >
                {article.category && (
                  <div className="text-xs font-semibold text-emerald mb-1">
                    {article.category.name}
                  </div>
                )}
                <div className="font-serif text-sm font-semibold text-charcoal leading-snug">
                  {article.title}
                </div>
                <div className="text-xs text-charcoal/40 mt-1">
                  {formatDate(article.publishedAt)}
                </div>
              </Link>
            ))}
          </div>
          {latestArticles.length === 0 && <p className="text-charcoal/50 text-sm">The journal is being prepared.</p>}
        </div>
      </div>
    </div>
    </div>
  );
}
