import Image from "next/image";
import { TrackedAnchor } from "@/components/TrackedLink";
import {
  AFFILIATE_DISCLOSURE,
  AFFILIATE_PROVIDERS,
  validateAffiliateUrl,
  type AffiliateItem,
} from "@/lib/affiliates";

/**
 * Editorial affiliate recommendation. Renders nothing unless the configured URL
 * is an https link on the provider's own domain.
 */
export default function AffiliateRecommendation({ item }: { item: AffiliateItem }) {
  const provider = AFFILIATE_PROVIDERS[item.provider];
  const href = validateAffiliateUrl(item.url, item.provider);
  if (!href) return null;

  return (
    <aside className="affiliate-rec" aria-label={`Recommendation: ${item.name}`}>
      {item.image && (
        <span className="affiliate-rec-img">
          <Image src={item.image} alt={item.imageAlt ?? ""} fill sizes="200px" />
        </span>
      )}
      <div className="affiliate-rec-body">
        <p className="affiliate-rec-meta">{provider.category} · {item.destination} · via {provider.name}</p>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        {item.indicativePrice && <p className="affiliate-rec-price">{item.indicativePrice}</p>}
        <TrackedAnchor event="affiliate_outbound_click" className="temple-btn temple-btn-ghost" href={href} target="_blank" rel="sponsored nofollow noopener noreferrer">
          {item.cta ?? provider.defaultCta}
          <span className="sr-only"> (opens {provider.name} in a new tab)</span>
        </TrackedAnchor>
        <p className="affiliate-rec-disclosure">{AFFILIATE_DISCLOSURE}</p>
      </div>
    </aside>
  );
}
