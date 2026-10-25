"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Counts = { comments: number; enquiries: number };
type Item = { href: string; label: string; exact?: boolean; badge?: keyof Counts };

const groups: { label: string | null; items: Item[] }[] = [
  { label: null, items: [{ href: "/admin", label: "Dashboard", exact: true }] },
  {
    label: "Content",
    items: [
      { href: "/admin/articles", label: "Articles" },
      { href: "/admin/resources", label: "Resources" },
      { href: "/admin/courses", label: "Courses" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/enquiries", label: "Enquiries", badge: "enquiries" },
      { href: "/admin/services", label: "Services" },
      { href: "/admin/pricing", label: "Prices" },
      { href: "/admin/newsletter", label: "Newsletter" },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/admin/comments", label: "Comments", badge: "comments" },
      { href: "/admin/users", label: "Users" },
    ],
  },
];

export default function AdminNav({ counts }: { counts: Counts }) {
  const pathname = usePathname();
  // Same pattern as the public nav: the menu is tied to the route it was opened on.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const currentLabel = groups.flatMap((g) => g.items).find((item) => isActive(item.href, item.exact))?.label ?? "Studio";

  return (
    <nav className="admin-nav" aria-label="Studio">
      <button type="button" className="admin-nav-toggle" aria-expanded={open} aria-controls="admin-nav-list" onClick={() => setOpenPath(open ? null : pathname)}>
        <span><small>Studio</small> {currentLabel}</span>
        <span aria-hidden="true" className="admin-nav-caret" />
      </button>
      <div id="admin-nav-list" className="admin-nav-list" data-open={open || undefined}>
        {groups.map((group, index) => (
          <div className="admin-nav-group" key={group.label ?? index} role="group" aria-label={group.label ?? undefined}>
            {group.label && <p className="admin-nav-group-label" aria-hidden="true">{group.label}</p>}
            <ul>
              {group.items.map((item) => {
                const count = item.badge ? counts[item.badge] : 0;
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={isActive(item.href, item.exact) ? "page" : undefined} onClick={() => setOpenPath(null)}>
                      {item.label}
                      {count > 0 && <span className="admin-nav-badge"><span className="sr-only">, </span>{count}<span className="sr-only"> waiting</span></span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <Link className="admin-nav-site" href="/">View public site ↗</Link>
      </div>
    </nav>
  );
}
