/**
 * What the membership comparison may claim. "live" items are operational today;
 * "planned" items are not built yet and must be labelled as such in the UI.
 * The existing purchase is ONE-TIME lifetime membership (see lib/pricing.ts).
 */

export type BenefitStatus = "live" | "planned";

export interface Benefit {
  label: string;
  status: BenefitStatus;
}

export const VISITOR_BENEFITS: Benefit[] = [
  { label: "Read the journal", status: "live" },
  { label: "Browse public resources", status: "live" },
  { label: "Register interest in the newsletter", status: "live" },
  { label: "Newsletter emails and free checklist", status: "planned" },
];

export const MEMBER_BENEFITS: Benefit[] = [
  { label: "Every published course", status: "live" },
  { label: "Member resources & downloads", status: "live" },
  { label: "Progress saved to your account", status: "live" },
  { label: "Member Q&A", status: "planned" },
  { label: "Premium insights", status: "planned" },
  { label: "Member checklists", status: "planned" },
];

/**
 * PROPOSAL ONLY. Not offered, not in checkout, never displayed as a purchase option.
 * Kept here so a recurring tier can be decided deliberately later.
 */
export const PROPOSED_MONTHLY_MEMBERSHIP = { priceAud: 9, interval: "month", status: "proposed" } as const;
