/**
 * Central configuration for the digital guide shop.
 * Every product is a PREVIEW: no files exist yet and nothing can be bought.
 * Prices are planned AUD whole dollars and are shown as "planned".
 * Content previews describe intended chapters, not finished text.
 */

export type GuideStatus = "preview" | "available";

export interface GuideProduct {
  slug: string;
  title: string;
  tagline: string;
  /** Planned price in AUD whole dollars. */
  priceAud: number;
  status: GuideStatus;
  audience: string;
  description: string;
  /** Planned chapters. Shown only as a preview of intended contents. */
  contentsPreview: string[];
  faqs: { question: string; answer: string }[];
  /** Keywords matched against published article titles/slugs for the related list. */
  relatedKeywords: string[];
  /** Original CSS cover: a Thai glyph on a colour treatment. */
  cover: { glyph: string; hue: "burgundy" | "gold" | "ink" | "jade" };
}

export const GUIDE_CURRENCY = "AUD";

export const GUIDE_AVAILABILITY_NOTICE =
  "Preview only. These guides are being written and cannot be bought yet. No payment is taken on this site for guides and no download exists. Register for release updates and you will be told when a guide is ready.";

const sharedFaqs = (title: string) => [
  { question: "Can I buy this guide now?", answer: "Not yet. It is in preparation and there is no checkout. Register for release updates to be told when it is ready." },
  { question: "What format will it be?", answer: `The intended format for ${title} is a digital document delivered after purchase once sales open. Format and delivery details will be confirmed before release.` },
  { question: "Is the price final?", answer: "No. The price shown is the planned price and may change before release." },
  { question: "Is this professional advice?", answer: "No. It is practical guidance from lived experience, not licensed immigration, legal, financial or medical advice." },
];

export const GUIDE_PRODUCTS: GuideProduct[] = [
  {
    slug: "first-timer-survival",
    title: "First-Timer Survival Guide",
    tagline: "What to expect, what to skip, and how not to waste your first week.",
    priceAud: 19,
    status: "preview",
    audience: "First-time visitors planning a holiday.",
    description: "A plain-spoken guide to the first days in Thailand: getting from the airport, money, SIM cards, transport, heat, food and the small habits that make the trip easier.",
    contentsPreview: ["Arriving and getting into the city", "Money, cards and cash", "Getting around safely", "Eating well without getting ill", "Etiquette that matters", "A realistic first-week plan"],
    faqs: sharedFaqs("the First-Timer Survival Guide"),
    relatedKeywords: ["first", "visit", "travel", "tourist", "arriv"],
    cover: { glyph: "ดี", hue: "burgundy" },
  },
  {
    slug: "bangkok-insider",
    title: "Bangkok Insider Guide",
    tagline: "Neighbourhoods, transport and local habits, away from the tourist trail.",
    priceAud: 19,
    status: "preview",
    audience: "Visitors spending time in Bangkok.",
    description: "A guide to choosing where to stay, moving around by rail, boat and taxi, eating away from the crowds, and handling the city's heat, traffic and noise.",
    contentsPreview: ["Choosing a neighbourhood", "BTS, MRT and river boats", "Taxis and ride apps", "Food streets and markets", "Rainy-season and heat planning", "Day trips worth the effort"],
    faqs: sharedFaqs("the Bangkok Insider Guide"),
    relatedKeywords: ["bangkok", "city", "transport"],
    cover: { glyph: "กรุง", hue: "gold" },
  },
  {
    slug: "moving-to-thailand-checklist",
    title: "Moving to Thailand Checklist & Guide",
    tagline: "A structured checklist for planning a longer stay or a move.",
    priceAud: 29,
    status: "preview",
    audience: "People considering living in Thailand.",
    description: "A planning checklist and guide covering the questions to settle before moving: where to live, running costs, banking, healthcare, and how to verify visa rules with official sources.",
    contentsPreview: ["Deciding where to live", "Realistic monthly costs", "Renting and what to check", "Banking and money transfers", "Healthcare and insurance questions", "Visa rules: how to check official sources"],
    faqs: [
      ...sharedFaqs("the Moving to Thailand Checklist & Guide"),
      { question: "Does it tell me which visa to apply for?", answer: "No. Visa and immigration rules change and vary by person. The guide will point you to official sources and is not immigration advice." },
    ],
    relatedKeywords: ["mov", "reloc", "expat", "living", "retire", "visa", "cost"],
    cover: { glyph: "บ้าน", hue: "jade" },
  },
  {
    slug: "scam-prevention",
    title: "Scam Prevention Guide",
    tagline: "The common scams, how they work and how to walk away.",
    priceAud: 15,
    status: "preview",
    audience: "Anyone travelling in or moving to Thailand.",
    description: "A guide to the tricks most often aimed at visitors, from transport and attraction-closed stories to booking and romance scams, with calm ways to decline and what to do if something goes wrong.",
    contentsPreview: ["Transport and meter tricks", "Attraction-is-closed stories", "Booking and rental scams", "Card and ATM safety", "Online and romance scams", "What to do if you are caught out"],
    faqs: sharedFaqs("the Scam Prevention Guide"),
    relatedKeywords: ["scam", "safety", "avoid", "trap"],
    cover: { glyph: "ระวัง", hue: "ink" },
  },
];

export function getGuideProduct(slug: string) {
  return GUIDE_PRODUCTS.find((p) => p.slug === slug);
}

export function formatGuidePrice(priceAud: number) {
  return `A$${priceAud}`;
}

/** Whether a guide can currently be purchased. Always false while status is "preview". */
export function isGuidePurchasable(product: GuideProduct) {
  return product.status === "available";
}
