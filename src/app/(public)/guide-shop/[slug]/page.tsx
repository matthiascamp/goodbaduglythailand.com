import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GuideCover from "@/components/guides/GuideCover";
import { TrackedAnchor } from "@/components/TrackedLink";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";
import { db } from "@/lib/db";
import { GUIDE_AVAILABILITY_NOTICE, GUIDE_PRODUCTS, formatGuidePrice } from "@/lib/guide-products";
import { getResolvedGuides } from "@/lib/site-prices";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getResolvedGuides()).find((p) => p.slug === slug);
  if (!product) return { title: "Guide not found" };
  const title = `${product.title} (preview)`;
  return {
    title,
    description: `${product.tagline} In preparation, not yet for sale.`,
    alternates: { canonical: `/guide-shop/${product.slug}` },
    openGraph: { title, description: product.tagline, url: `/guide-shop/${product.slug}` },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const product = (await getResolvedGuides()).find((p) => p.slug === slug);
  if (!product) notFound();

  // Only published articles whose title or slug matches the guide's keywords.
  const published = await db.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true },
    take: 100,
  });
  const related = published
    .filter((a) => product.relatedKeywords.some((k) => `${a.title} ${a.slug}`.toLowerCase().includes(k)))
    .slice(0, 4);

  return (
    <div className="temple-home">
      <section className="plan-hero plan-hero-detail">
        <div className="temple-wrap guide-detail-head">
          <GuideCover product={product} />
          <div>
            <p className="temple-kicker"><Link href="/guide-shop">Guide shop</Link> · Preview</p>
            <h1>{product.title}</h1>
            <p className="temple-lead">{product.tagline}</p>
            <p className="guide-status">Coming soon · not for sale yet</p>
            <p className="plan-price">Planned price: <strong>{formatGuidePrice(product.priceAud)}</strong></p>
            <TrackedAnchor event="guide_purchase_intent" href="#updates" className="temple-btn">Get release updates</TrackedAnchor>
          </div>
        </div>
      </section>

      <section className="temple-wrap plan-section plan-detail-grid">
        <div>
          <h2>About this guide</h2>
          <p>{product.description}</p>
          <p><strong>Who it is for:</strong> {product.audience}</p>
          <h2>Availability and delivery</h2>
          <p>{GUIDE_AVAILABILITY_NOTICE} When released, the guide is intended as a digital document; delivery method and final price will be confirmed first.</p>
        </div>
        <div>
          <h2>Contents preview</h2>
          <p className="guide-preview-note">Planned chapters only. The text is not finished and this list may change.</p>
          <ol className="plan-list">{product.contentsPreview.map((c) => <li key={c}>{c}</li>)}</ol>
        </div>
      </section>

      <section className="temple-wrap plan-section" aria-labelledby="guide-faq-heading">
        <h2 id="guide-faq-heading">Questions</h2>
        <div className="guide-faq">
          {product.faqs.map((f) => (
            <details key={f.question}><summary>{f.question}</summary><p>{f.answer}</p></details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="temple-wrap plan-section" aria-labelledby="guide-related-heading">
          <h2 id="guide-related-heading">Related articles</h2>
          <ul className="plan-list">
            {related.map((a) => <li key={a.id}><Link href={`/articles/${a.slug}`}>{a.title}</Link></li>)}
          </ul>
        </section>
      )}

      <p className="temple-wrap newsletter-note">Refund terms: <Link href="/policies">policies</Link> (final policy pending owner review) · <Link href="/privacy">privacy</Link></p>

      <section className="temple-wrap plan-section plan-enquire" id="updates" aria-labelledby="guide-updates-heading">
        <h2 id="guide-updates-heading" className="sr-only">Release updates</h2>
        <NewsletterSignup
          source={`guide:${product.slug}`}
          heading="Get release updates"
          intro={`Register interest in ${product.title} and other guides. Nothing is sold or sent yet.`}
          buttonLabel="Get release updates"
        />
      </section>
    </div>
  );
}
