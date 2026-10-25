import type { Metadata } from "next";
import Link from "next/link";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Register your interest in the free Thailand checklist and future updates from The Good, Bad & Ugly of Thailand.",
  alternates: { canonical: "/newsletter" },
};

export default function NewsletterPage() {
  return (
    <div className="temple-home">
      <section className="plan-hero">
        <div className="temple-wrap">
          <p className="temple-kicker">Newsletter</p>
          <h1>15 Things You Need to Know <em>Before Visiting Thailand</em></h1>
          <p className="temple-lead">A free checklist for first-time visitors is being prepared. It is not available to download yet, and email delivery is not switched on. You can register your interest now.</p>
        </div>
      </section>
      <section className="temple-wrap plan-section">
        <NewsletterSignup source="newsletter-page" />
        <p className="newsletter-note">Already registered? Your personal unsubscribe link will be in any email we send. <Link href="/newsletter/unsubscribe">How it works</Link>.</p>
      </section>
    </div>
  );
}
