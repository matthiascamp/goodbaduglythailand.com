import Link from "next/link";
import { TrackedLink } from "@/components/TrackedLink";
import { offerForArticle, type ArticleText } from "@/lib/article-relevance";
import { EXPERIENCE_STATEMENT, formatAud } from "@/lib/plan-services";
import { getSitePrices, resolveGuideProducts, resolvePlanServices } from "@/lib/site-prices";

/**
 * Contextual pointer for an article. Shows a planning service and/or a guide preview link
 * only when the article's own title, excerpt or category supports it; otherwise renders nothing.
 */
export default async function ArticleServiceCta({ article }: { article: ArticleText }) {
  const offer = offerForArticle(article);
  if (!offer.serviceSlug && !offer.guideSlug) return null;
  const prices = await getSitePrices();
  const service = offer.serviceSlug ? resolvePlanServices(prices).find((s) => s.slug === offer.serviceSlug) : undefined;
  const guide = offer.guideSlug ? resolveGuideProducts(prices).find((g) => g.slug === offer.guideSlug) : undefined;
  if (!service && !guide) return null;

  return (
    <aside className="article-service-cta" aria-labelledby="article-service-heading">
      <p className="temple-kicker">Related help</p>
      {service && (
        <>
          <h2 id="article-service-heading">Want advice that fits your plans?</h2>
          <p>{EXPERIENCE_STATEMENT} Talk it through, or have it written up for your own dates and budget. Sending an enquiry is not a booking.</p>
          <div className="temple-actions">
            <TrackedLink event="service_cta_click" href={`/plan-your-trip/${service.slug}`} className="temple-btn">
              {service.title} · {formatAud(service.priceAud, service.from)}
            </TrackedLink>
            <Link href="/plan-your-trip" className="temple-link temple-link-sm">All services</Link>
          </div>
        </>
      )}
      {guide && (
        <p className="article-guide-preview">
          {service ? "Also in preparation: " : ""}
          <Link href={`/guide-shop/${guide.slug}`}>{guide.title}</Link>
          {" "}(preview only, not for sale yet).
        </p>
      )}
      {!service && <span id="article-service-heading" className="sr-only">Related guide</span>}
    </aside>
  );
}
