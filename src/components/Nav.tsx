"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LotusMark, KanokRule } from "./Orn";

type MenuId = "more" | "account" | "mobile";

export default function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  // Remember which route a menu was opened on, so navigating closes it without an effect.
  const [openMenu, setOpenMenu] = useState<{ id: MenuId; path: string } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const active = openMenu && openMenu.path === pathname ? openMenu.id : null;
  const member = session?.user?.membershipStatus === "ACTIVE" || session?.user?.role === "ADMIN";
  const admin = session?.user?.role === "ADMIN";

  const primary = [
    { href: "/articles", label: "Articles" },
    { href: "/plan-your-trip", label: "Plan Your Trip" },
    { href: "/services", label: "Advice" },
    { href: "/guide-shop", label: "Guides" },
  ];
  const more = [
    { href: "/resources", label: "Resources" },
    { href: member ? "/courses" : "/membership", label: "Courses" },
    { href: "/trip-finder", label: "Trip finder" },
    { href: "/about", label: "About" },
  ];
  const library = { href: member ? "/dashboard" : "/membership", label: member ? "My library" : "Join" };

  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);
  const moreCurrent = more.some((link) => current(link.href));
  const toggle = (id: MenuId) => setOpenMenu(active === id ? null : { id, path: pathname });
  const close = () => setOpenMenu(null);

  useEffect(() => {
    if (!active) return;
    const onPointer = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Escape" || !active) return;
    setOpenMenu(null);
    navRef.current?.querySelector<HTMLElement>(`[data-menu="${active}"]`)?.focus();
  };

  return (
    <div className="editorial-nav-wrap" onKeyDown={onKeyDown}>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="temple-topbar">
        <div><span>Independent guides to Thailand</span><span lang="th">ประเทศไทย</span></div>
      </div>
      <header>
        <nav className="editorial-nav" aria-label="Main navigation" ref={navRef}>
          <Link href="/" className="editorial-wordmark" onClick={close} aria-label="The Good, Bad & Ugly of Thailand home">
            <LotusMark />
            <span className="editorial-wordmark-text">
              <span className="editorial-wordmark-name">The Good, Bad &amp; Ugly</span>
              <small>of Thailand</small>
            </span>
          </Link>

          <ul className="editorial-nav-links">
            {primary.map((link) => (
              <li key={link.href}><Link href={link.href} aria-current={current(link.href)}>{link.label}</Link></li>
            ))}
            <li className="editorial-nav-menu">
              <button type="button" data-menu="more" className="editorial-nav-trigger" aria-expanded={active === "more"} aria-controls="nav-more" data-current={moreCurrent || undefined} onClick={() => toggle("more")}>
                More <span aria-hidden="true" className="editorial-nav-caret" />
              </button>
              {active === "more" && (
                <ul id="nav-more" className="editorial-nav-dropdown">
                  {more.map((link) => (
                    <li key={link.label}><Link href={link.href} aria-current={current(link.href)} onClick={close}>{link.label}</Link></li>
                  ))}
                </ul>
              )}
            </li>
          </ul>

          <div className="editorial-nav-actions">
            {session ? (
              <div className="editorial-nav-menu">
                <button type="button" data-menu="account" className="editorial-nav-trigger" aria-expanded={active === "account"} aria-controls="nav-account" data-current={pathname.startsWith("/admin") || undefined} onClick={() => toggle("account")}>
                  Account <span aria-hidden="true" className="editorial-nav-caret" />
                </button>
                {active === "account" && (
                  <ul id="nav-account" className="editorial-nav-dropdown editorial-nav-dropdown-end">
                    {admin && <li><Link href="/admin" aria-current={pathname.startsWith("/admin") ? "page" : undefined} onClick={close}>Admin</Link></li>}
                    <li><button type="button" onClick={() => { close(); signOut({ callbackUrl: "/" }); }}>Sign out</button></li>
                  </ul>
                )}
              </div>
            ) : (
              <Link className="editorial-nav-signin" href="/sign-in" aria-current={current("/sign-in")}>Sign in</Link>
            )}
            <Link className="editorial-nav-join" href={library.href} aria-current={current(library.href)}>{library.label}</Link>
          </div>

          <button type="button" data-menu="mobile" className="editorial-nav-toggle" onClick={() => toggle("mobile")} aria-expanded={active === "mobile"} aria-controls="editorial-mobile-menu">
            {active === "mobile" ? "Close" : "Menu"}
          </button>
        </nav>
        {active === "mobile" && (
          <div id="editorial-mobile-menu" className="editorial-mobile-menu">
            {[...primary, ...more].map((link) => (
              <Link key={link.label} href={link.href} aria-current={current(link.href)} onClick={close}>{link.label}</Link>
            ))}
            <Link href={member ? "/dashboard" : "/membership"} aria-current={current(member ? "/dashboard" : "/membership")} onClick={close}>{member ? "My library" : "Membership"}</Link>
            {admin && <Link href="/admin" aria-current={pathname.startsWith("/admin") ? "page" : undefined} onClick={close}>Admin</Link>}
            {session ? <button type="button" onClick={() => { close(); signOut({ callbackUrl: "/" }); }}>Sign out</button> : <Link href="/sign-in" onClick={close}>Sign in</Link>}
          </div>
        )}
      </header>
      <KanokRule />
    </div>
  );
}
