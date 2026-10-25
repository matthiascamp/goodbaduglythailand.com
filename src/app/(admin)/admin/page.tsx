import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { requireAdminPage } from "@/lib/page-auth";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const [
    pendingComments,
    newEnquiries,
    draftArticles,
    draftCourses,
    draftResources,
    publishedArticles,
    activeMembers,
    subscribers,
    recentArticles,
  ] = await Promise.all([
    db.comment.count({ where: { approved: false } }),
    db.serviceEnquiry.count({ where: { status: "NEW" } }),
    db.article.count({ where: { published: false } }),
    db.course.count({ where: { published: false } }),
    db.resource.count({ where: { published: false } }),
    db.article.count({ where: { published: true } }),
    db.user.count({ where: { membershipStatus: "ACTIVE" } }),
    db.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    db.article.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, published: true, updatedAt: true },
    }),
  ]);

  const attention = [
    { count: newEnquiries, text: plural(newEnquiries, "new enquiry", "new enquiries"), hint: "Reply by email, then mark as replied", href: "/admin/enquiries", action: "Open enquiries" },
    { count: pendingComments, text: plural(pendingComments, "comment") + " awaiting review", hint: "Approve or remove before they appear", href: "/admin/comments", action: "Moderate" },
    { count: draftArticles, text: plural(draftArticles, "draft article"), hint: "Written but not yet published", href: "/admin/articles", action: "Review drafts" },
    { count: draftCourses, text: plural(draftCourses, "unpublished course"), hint: "Hidden from members", href: "/admin/courses", action: "Open courses" },
    { count: draftResources, text: plural(draftResources, "unpublished resource"), hint: "Hidden from the public library", href: "/admin/resources", action: "Open resources" },
  ].filter((item) => item.count > 0);

  const glance = [
    { label: "Published articles", value: publishedArticles, href: "/admin/articles" },
    { label: "Active members", value: activeMembers, href: "/admin/users" },
    { label: "Newsletter interest", value: subscribers, href: "/admin/newsletter" },
  ];

  return (
    <div className="admin-dash">
      <header className="admin-head">
        <div>
          <p className="editorial-small-label">Studio</p>
          <h1>What needs <em>attention</em></h1>
        </div>
        <Link href="/admin/articles?new=1" className="editorial-button">Write article</Link>
      </header>

      <section aria-labelledby="attention-heading" className="admin-section">
        <h2 id="attention-heading" className="admin-section-title">Waiting for you</h2>
        {attention.length === 0 ? (
          <p className="admin-clear">Nothing is waiting. No new enquiries, comments or drafts.</p>
        ) : (
          <ul className="admin-attention">
            {attention.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <span className="admin-attention-count">{item.count}</span>
                  <span className="admin-attention-text"><strong>{item.text}</strong><small>{item.hint}</small></span>
                  <span className="admin-attention-go">{item.action} <span aria-hidden="true">→</span></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-heading" className="admin-section">
        <div className="admin-section-head">
          <h2 id="recent-heading" className="admin-section-title">Recently edited articles</h2>
          <Link href="/admin/articles" className="admin-link">All articles</Link>
        </div>
        {recentArticles.length === 0 ? (
          <p className="admin-clear">No articles yet. Use Write article to start the first one.</p>
        ) : (
          <ul className="admin-recent">
            {recentArticles.map((article) => (
              <li key={article.id}>
                <Link href={`/admin/articles/${article.id}`}>
                  <span className="admin-recent-title">{article.title}</span>
                  <span className={`admin-tag ${article.published ? "admin-tag-live" : ""}`}>{article.published ? "Published" : "Draft"}</span>
                  <span className="admin-recent-date">{formatDate(article.updatedAt, { month: "short", day: "numeric", year: undefined })}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="glance-heading" className="admin-section">
        <h2 id="glance-heading" className="admin-section-title">At a glance</h2>
        <ul className="admin-glance">
          {glance.map((stat) => (
            <li key={stat.label}>
              <Link href={stat.href}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
