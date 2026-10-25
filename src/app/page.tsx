import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getPricingConfig } from "@/lib/pricing";
import { Divider } from "@/components/Orn";
import ServiceCards from "@/components/plan/ServiceCards";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";
import BenefitList from "@/components/BenefitList";
import { MEMBER_BENEFITS, VISITOR_BENEFITS } from "@/lib/membership-plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thailand, honestly",
  description: "A candid guide to the good, the bad and the ugly of Thailand.",
};

const truths = [
  { numeral: "I", glyph: "ดี", title: "The Good", thai: "ดี", text: "What people genuinely love, and why so many stay longer than they planned.", link: "Explore the good" },
  { numeral: "II", glyph: "ไม่", title: "The Bad", thai: "ไม่ดี", text: "The everyday friction, costs and trade-offs worth understanding early.", link: "Avoid the hassle" },
  { numeral: "III", glyph: "น่า", title: "The Ugly", thai: "น่าเกลียด", text: "The harder realities few guides talk about, written plainly and without drama.", link: "Know the truth" },
];

export default async function HomePage() {
  const pricing = await getPricingConfig();
  const [articles, courses] = await Promise.all([
    db.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: { category: true },
    }),
    db.course.findMany({ where: { published: true }, take: 4, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="temple-home">
      <section className="temple-hero" aria-labelledby="home-heading">
        <span className="temple-hero-glyph" lang="th" aria-hidden="true">ไทย</span>
        <div className="temple-wrap temple-hero-grid">
          <div className="temple-hero-copy">
            <p className="temple-kicker"><span className="temple-kicker-line" /><span lang="th">สวัสดี</span> · Welcome</p>
            <h1 id="home-heading">The real Thailand.<br /><em>All of it.</em></h1>
            <p className="temple-lead">What people love, what quietly wears them down, and the harder realities — for anyone planning a visit, a move, or a life here.</p>
            <div className="temple-actions">
              <Link href="/membership" className="temple-btn">Become a member</Link>
              <Link href="/articles" className="temple-link">Read the journal</Link>
              <Link href="/plan-your-trip" className="temple-link temple-link-sm temple-link-quiet">Plan your trip</Link>
            </div>
          </div>
          <div className="temple-hero-art">
            <div className="temple-arch temple-arch-lg">
              <div className="temple-arch-inner">
                <Image src="/images/thai-editorial-still-life.png" alt="A still life of Thai paper, flowers and tea on a table" width={1024} height={1536} sizes="(max-width: 900px) 90vw, 470px" priority />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="temple-band" aria-labelledby="truths-heading">
        <div className="temple-wrap">
          <div className="temple-section-head">
            <p className="temple-kicker">Three honest truths</p>
            <h2 id="truths-heading">Every side of the <em>Land of Smiles</em></h2>
          </div>
          <div className="temple-truths">
            {truths.map((item) => (
              <Link href="/articles" className="temple-truth" key={item.title}>
                <div className="temple-arch temple-arch-sm" aria-hidden="true">
                  <div className="temple-arch-inner temple-arch-glyph"><span lang="th">{item.glyph}</span></div>
                </div>
                <span className="temple-numeral">{item.numeral}</span>
                <h3>{item.title} <span lang="th">{item.thai}</span></h3>
                <p>{item.text}</p>
                <span className="temple-link temple-link-sm">{item.link}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="temple-wrap temple-library" id="journal" aria-labelledby="library-heading">
        <div className="temple-library-intro">
          <p className="temple-kicker">The journal</p>
          <h2 id="library-heading">Begin with the <em>essentials</em></h2>
          <p>Articles are open to everyone. Members also unlock the structured course library.</p>
          <Link href="/articles" className="temple-link temple-link-sm">View all articles</Link>
        </div>
        {articles.length > 0 ? (
          <ol className="temple-list">
            {articles.map((article, index) => (
              <li key={article.id}>
                <Link href={`/articles/${article.slug}`}>
                  <span className="temple-list-no">{String(index + 1).padStart(2, "0")}</span>
                  <span className="temple-list-cat">{article.category?.name ?? "Article"}</span>
                  <span className="temple-list-title">{article.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <div className="temple-list temple-list-empty">
            <p className="temple-kicker">In preparation</p>
            <p className="temple-list-title">The first stories are on their way.</p>
            <p>Reviewed articles will appear here when they are published.</p>
          </div>
        )}
      </section>

      <section className="temple-wrap plan-home" aria-labelledby="plan-home-heading">
        <div className="temple-section-head">
          <p className="temple-kicker">Plan your trip</p>
          <h2 id="plan-home-heading">A little local knowledge <em>goes a long way.</em></h2>
          <p>Planning a holiday, exploring a new city, or thinking about making Thailand home? Get personalised advice from someone who has spent approximately 18 years learning the country beyond the tourist trail.</p>
        </div>
        <ServiceCards />
      </section>

      <section className="temple-wrap plan-home" aria-labelledby="newsletter-home-heading">
        <div className="temple-section-head">
          <p className="temple-kicker">Free checklist · in preparation</p>
          <h2 id="newsletter-home-heading">15 Things You Need to Know <em>Before Visiting Thailand</em></h2>
          <p>The checklist is not ready to download yet. Register your interest and we will email you when it is, once email sending is switched on.</p>
        </div>
        <NewsletterSignup source="home" />
        <p className="newsletter-note"><Link href="/guide-shop">Paid guides are also in preparation: see the preview shop.</Link></p>
      </section>

      <section className="temple-band temple-join" id="join" aria-labelledby="join-heading">
        <div className="temple-wrap temple-join-inner">
          <div className="temple-section-head">
            <Divider />
            <p className="temple-kicker">Membership</p>
            <h2 id="join-heading">Know Thailand <em>like a local.</em></h2>
            <p>One payment opens the full course library — no subscription and no automatic renewal.</p>
          </div>
          <div className="temple-plans">
            <div className="temple-plan">
              <span className="temple-plan-label">Visitor</span>
              <span className="temple-plan-price">Free</span>
              <hr />
              <BenefitList items={VISITOR_BENEFITS} />
              <Link href="/sign-up" className="temple-btn temple-btn-ghost">Sign up free</Link>
            </div>
            <div className="temple-plan temple-plan-member">
              <span className="temple-plan-label temple-gold">Member</span>
              <span className="temple-plan-price">{pricing.configured ? pricing.displayPrice : "One payment"}{pricing.configured && <small> / once</small>}</span>
              <hr />
              <BenefitList items={MEMBER_BENEFITS} />
              <Link href="/membership" className="temple-btn">Become a member</Link>
            </div>
          </div>
          {courses.length > 0 && <ul className="temple-courses" aria-label="Inside the library">{courses.map((course) => <li key={course.id}>{course.title}</li>)}</ul>}
        </div>
      </section>
    </div>
  );
}
