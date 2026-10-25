/**
 * Central affiliate configuration.
 *
 * No affiliate IDs, links, prices or ratings are invented here. A recommendation
 * only renders once a real article-specific entry is added to `ARTICLE_AFFILIATES`
 * with an https URL on the provider's own domain.
 */

export type AffiliateProviderId = "viator" | "klook" | "booking";

export interface AffiliateProvider {
  id: AffiliateProviderId;
  name: string;
  category: string;
  /** Hostnames a configured link must belong to. */
  hosts: string[];
  defaultCta: string;
}

export const AFFILIATE_PROVIDERS: Record<AffiliateProviderId, AffiliateProvider> = {
  viator: { id: "viator", name: "Viator", category: "Tours & experiences", hosts: ["viator.com"], defaultCta: "Explore this experience" },
  klook: { id: "klook", name: "Klook", category: "Activities & attractions", hosts: ["klook.com"], defaultCta: "Explore this activity" },
  booking: { id: "booking", name: "Booking.com", category: "Accommodation", hosts: ["booking.com"], defaultCta: "Check availability" },
};

export interface AffiliateItem {
  provider: AffiliateProviderId;
  name: string;
  description: string;
  destination: string;
  /** Full partner URL supplied by the owner from their own affiliate account. */
  url: string;
  image?: string;
  imageAlt?: string;
  /** Only set when a real, current price has been confirmed, e.g. "from A$45". */
  indicativePrice?: string;
  cta?: string;
}

export const AFFILIATE_DISCLOSURE =
  "Affiliate link: if you book through it we may earn a commission at no extra cost to you. Our editorial opinions are our own.";

/**
 * Article slug -> recommendations. Intentionally empty until real links exist.
 * Shape: "article-slug": [{ provider: "booking", name, description, destination, url }]
 */
export const ARTICLE_AFFILIATES: Record<string, AffiliateItem[]> = {};

/** Returns a normalised https URL on an allowed provider host, or null. */
export function validateAffiliateUrl(raw: string, provider: AffiliateProviderId): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    const host = u.hostname.toLowerCase();
    const ok = AFFILIATE_PROVIDERS[provider].hosts.some((h) => host === h || host.endsWith(`.${h}`));
    return ok ? u.toString() : null;
  } catch {
    return null;
  }
}

export function getArticleAffiliates(slug: string): AffiliateItem[] {
  return (ARTICLE_AFFILIATES[slug] ?? []).filter((i) => validateAffiliateUrl(i.url, i.provider));
}
