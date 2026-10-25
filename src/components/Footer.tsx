"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Divider } from "./Orn";
import NewsletterSignup from "./newsletter/NewsletterSignup";

export default function Footer() {
  const { data: session } = useSession();

  return (
    <footer className="editorial-footer">
      <div className="editorial-container editorial-footer-inner">
        <Divider />
        <NewsletterSignup source="footer" compact heading="Newsletter" intro="Register interest in the free Thailand checklist and updates." />
        <span className="editorial-footer-brand">The Good, Bad &amp; Ugly</span>
        <nav aria-label="Footer" className="editorial-footer-links">
          <Link href="/articles">Articles</Link>
          <Link href="/plan-your-trip">Plan Your Trip</Link>
          <Link href="/services">Advice</Link>
          <Link href="/guide-shop">Guide Shop</Link>
          <Link href="/newsletter">Newsletter</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/membership">Membership</Link>
          <Link href="/trip-finder">Trip finder</Link>
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/policies">Policies</Link>
          {!session && <Link href="/sign-in">Sign in</Link>}
          <Link href="/dashboard">Member library</Link>
          {session?.user.role === "ADMIN" && <Link href="/admin">Admin</Link>}
        </nav>
        <span className="editorial-footer-bottom">© {new Date().getFullYear()} The Good, Bad &amp; Ugly of Thailand · <span lang="th">ขอบคุณ</span></span>
      </div>
    </footer>
  );
}
