/**
 * Central, editable configuration for the featured "Plan Your Trip" services.
 * Prices are in AUD whole dollars. Edit here — nothing else hardcodes a price.
 * These sit alongside (never replace) the database-managed `Service` records.
 */

export const SERVICE_CURRENCY = "AUD";

/** Owner-provided. Describe carefully: lived experience, not professional accreditation. */
export const EXPERIENCE_STATEMENT =
  "Written and delivered by someone who has lived in Thailand for approximately 18 years.";

export const ADVICE_DISCLAIMER =
  "This is practical personal advice drawn from lived experience. It is not licensed immigration, legal, financial or medical advice.";

export const ENQUIRY_NOTICE =
  "Sending an enquiry is not a booking and no payment is taken. Nothing is confirmed until you receive a direct reply with scheduling and payment details.";

export type ServiceKind = "CALL" | "ITINERARY";

export interface ServicePackage {
  id: string;
  label: string;
  detail: string;
  priceAud: number;
  /** Show "From A$x" rather than a fixed price. */
  from?: boolean;
}

export interface PlanService {
  slug: string;
  kind: ServiceKind;
  title: string;
  short: string;
  intro: string;
  image: string;
  imageAlt: string;
  priceAud: number;
  from?: boolean;
  durationLabel?: string;
  packages?: ServicePackage[];
  included: string[];
  notIncluded: string[];
  topics: string[];
  metaDescription: string;
  disclaimer?: string;
}

export const PLAN_SERVICES: PlanService[] = [
  {
    slug: "thailand-insider-consultation",
    kind: "CALL",
    title: "Thailand Insider Consultation",
    short: "A private 30-minute online conversation about where to go, where to stay and what to avoid.",
    intro:
      "A private 30-minute online consultation with someone who has lived in Thailand for approximately 18 years. Bring your questions and leave with a clearer, more realistic plan.",
    image: "/images/bangkok-evening.webp",
    imageAlt: "Bangkok street in the evening light",
    priceAud: 79,
    durationLabel: "30 minutes, online",
    included: [
      "One private 30-minute online call",
      "Honest guidance on destinations and areas worth staying in",
      "Costs, budgets and common tourist mistakes",
      "Local customs, etiquette and how to avoid common scams",
    ],
    notIncluded: [
      "A written itinerary (see Custom Thailand Itinerary)",
      "Bookings made on your behalf",
      "Legal, immigration, financial or medical advice",
    ],
    topics: [
      "Which destinations to visit",
      "Which areas are worth staying in",
      "Mistakes tourists regularly make",
      "Costs and travel budgets",
      "Accommodation recommendations",
      "Local customs and etiquette",
      "How to avoid common scams",
      "Practical questions before travelling",
    ],
    metaDescription:
      "A private 30-minute online Thailand consultation for A$79 with someone who has lived in Thailand for approximately 18 years.",
  },
  {
    slug: "custom-thailand-itinerary",
    kind: "ITINERARY",
    title: "Custom Thailand Itinerary",
    short: "A personalised itinerary built around your dates, budget and travel style.",
    intro:
      "A personalised itinerary based on your preferences, with suggested daily activities, areas to stay, transport considerations and local recommendations.",
    image: "/images/thai-morning-street.webp",
    imageAlt: "A quiet Thai street in the morning",
    priceAud: 69,
    from: true,
    packages: [
      { id: "7-day", label: "7-day itinerary", detail: "One week, usually one or two regions.", priceAud: 69 },
      { id: "14-day", label: "14-day itinerary", detail: "Two weeks, with room for several regions.", priceAud: 99 },
      { id: "extended", label: "Extended / custom itinerary", detail: "Longer or more complex trips. Scope is confirmed with you before any work begins.", priceAud: 149, from: true },
    ],
    included: [
      "A personalised written itinerary",
      "Suggested daily activities",
      "Areas to stay and why",
      "Transport considerations between stops",
      "Local recommendations and things to skip",
    ],
    notIncluded: [
      "Flights, accommodation or tours booked on your behalf",
      "Visa, legal or medical advice",
      "Live changes while you are travelling",
    ],
    topics: [],
    metaDescription:
      "Personalised Thailand itineraries from A$69: 7-day A$69, 14-day A$99, extended from A$149.",
  },
  {
    slug: "moving-to-thailand-consultation",
    kind: "CALL",
    title: "Moving to Thailand Consultation",
    short: "For people considering living in Thailand: lifestyle, neighbourhoods, budgets and preparation.",
    intro:
      "For individuals considering living in Thailand. A practical conversation covering lifestyle, neighbourhoods, approximate budgets, preparation and first-hand experience of what daily life is like.",
    image: "/images/thai-laneway.webp",
    imageAlt: "A residential laneway in Thailand",
    priceAud: 199,
    durationLabel: "Online consultation",
    included: [
      "A private online consultation about moving to Thailand",
      "Lifestyle and neighbourhood comparisons",
      "Approximate living budgets",
      "Practical preparation and first-hand experience",
    ],
    notIncluded: [
      "Licensed immigration, visa, legal, tax, financial or medical advice",
      "Handling applications or paperwork",
      "Property, employment or business arrangements",
    ],
    topics: [
      "Lifestyle and daily life",
      "Which neighbourhoods and cities might suit you",
      "Approximate monthly budgets",
      "Practical preparation before moving",
    ],
    disclaimer: ADVICE_DISCLAIMER,
    metaDescription:
      "A Moving to Thailand consultation for A$199: lifestyle, neighbourhoods, budgets and practical preparation from lived experience.",
  },
];

export function getPlanService(slug: string): PlanService | undefined {
  return PLAN_SERVICES.find((s) => s.slug === slug);
}

export function formatAud(amount: number, from = false): string {
  return `${from ? "From " : ""}A$${amount}`;
}
