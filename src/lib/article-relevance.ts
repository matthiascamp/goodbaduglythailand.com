/**
 * Bounded, rules-based relevance for article pages and the trip finder.
 * Looks only at the article's real title, excerpt and category name (not the slug,
 * body or comments). A topic counts when the title matches (2 points) and/or the
 * excerpt or category matches (1 point); an offer needs at least MIN_SCORE points.
 */

export type Topic = "relocation" | "itinerary" | "firstTimer" | "bangkok" | "scam" | "travel";

const PATTERNS: Record<Topic, RegExp> = {
  relocation: /\b(mov(e|ing) to|relocat\w*|expats?|retire\w*|living in|live in|cost of living|long[- ]term|resident\w*|settl(e|ing))\b/i,
  itinerary: /\b(itinerar\w*|\d+[- ]day|where to (go|stay)|best time to|plan(ning)? (a|your) (trip|holiday)|route)\b/i,
  firstTimer: /\b(first[- ]time\w*|first visit|beginners?|what to expect|before you (go|visit|travel)|newcomers?)\b/i,
  bangkok: /\bbangkok\b/i,
  scam: /\b(scams?|rip[- ]?offs?|tourist traps?|overcharg\w*|safety)\b/i,
  travel: /\b(travel\w*|trips?|holiday\w*|visit\w*|tourists?|islands?|beach\w*|phuket|chiang mai|pattaya|koh \w+|temples?)\b/i,
};

export const MIN_SCORE = 2;

export interface ArticleText {
  title: string;
  excerpt: string;
  category?: string | null;
}

export function topicScores({ title, excerpt, category }: ArticleText): Record<Topic, number> {
  const rest = `${excerpt} ${category ?? ""}`;
  const out = {} as Record<Topic, number>;
  for (const topic of Object.keys(PATTERNS) as Topic[]) {
    out[topic] = (PATTERNS[topic].test(title) ? 2 : 0) + (PATTERNS[topic].test(rest) ? 1 : 0);
  }
  return out;
}

export interface ArticleOffer {
  /** plan-services slug, or null when no service fits this article. */
  serviceSlug: string | null;
  /** guide-products slug for a preview link, or null. */
  guideSlug: string | null;
}

export function offerForArticle(article: ArticleText): ArticleOffer {
  const s = topicScores(article);

  let serviceSlug: string | null = null;
  if (s.relocation >= MIN_SCORE) serviceSlug = "moving-to-thailand-consultation";
  else if (s.itinerary >= MIN_SCORE) serviceSlug = "custom-thailand-itinerary";
  else if (s.travel + s.firstTimer + s.bangkok >= MIN_SCORE) serviceSlug = "thailand-insider-consultation";

  const guideCandidates: [number, string][] = [
    [s.relocation, "moving-to-thailand-checklist"],
    [s.scam, "scam-prevention"],
    [s.bangkok, "bangkok-insider"],
    [s.firstTimer, "first-timer-survival"],
  ];
  const best = guideCandidates.sort((a, b) => b[0] - a[0])[0];
  const guideSlug = best[0] >= MIN_SCORE ? best[1] : null;

  return { serviceSlug, guideSlug };
}
