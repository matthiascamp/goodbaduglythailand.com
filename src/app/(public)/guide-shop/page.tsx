import type { Metadata } from "next";
import Link from "next/link";
import GuideCover from "@/components/guides/GuideCover";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";
import { GUIDE_AVAILABILITY_NOTICE, formatGuidePrice } from "@/lib/guide-products";
import { getResolvedGuides } from "@/lib/site-prices";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guide Shop (preview)",
  description: "Four Thailand guides in preparation: first-timer survival, Bangkok, moving to Thailand and scam prevention. Register for release updates.",
  alternates: { canonical: "/guide-shop" },
};

export default async function GuideShopPage() {
  const guides = await getResolvedGuides();
  return (
    <div className="temple-home">
      <section className="plan-hero">
        <div className="temple-wrap">
          <p className="temple-kicker">Guide shop · Preview</p>
          <h1>Practical guides, <em>in preparation.</em></h1>
          <p className="temple-lead">{GUIDE_AVAILABILITY_NOTICE}</p>
        </div>
      </section>

      <section className="temple-wrap plan-section" aria-labelledby="guides-heading">
        <h2 id="guides-heading" className="sr-only">The guides</h2>
        <ul className="guide-grid">
          {guides.map((p) => (
            <li key={p.slug} className="guide-card">
              <GuideCover product={p} />
              <div className="guide-card-body">
                <p className="guide-status">Coming soon · not for sale yet</p>
                <h3><Link href={`/guide-shop/${p.slug}`}>{p.title}</Link></h3>
                <p>{p.tagline}</p>
                <p className="guide-price">Planned price: <strong>{formatGuidePrice(p.priceAud)}</strong></p>
                <Link href={`/guide-shop/${p.slug}`} className="temple-link temple-link-sm">See the preview</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="temple-wrap newsletter-note">Digital product terms: <Link href="/policies">policies</Link> (final policy pending owner review) · <Link href="/privacy">privacy</Link></p>

      <section className="temple-wrap plan-section guide-updates">
        <NewsletterSignup
          source="guide-shop"
          heading="Get release updates"
          intro="Tell us you are interested and you will be on the list for guide announcements once email sending is switched on."
          buttonLabel="Get release updates"
        />
      </section>
    </div>
  );
}
