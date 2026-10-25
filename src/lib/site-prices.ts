import { db } from "@/lib/db";
import { GUIDE_PRODUCTS, type GuideProduct } from "@/lib/guide-products";
import { PLAN_SERVICES, type PlanService } from "@/lib/plan-services";

export const PRICE_DEFINITIONS = [
  ...PLAN_SERVICES.filter((s) => s.kind !== "ITINERARY").map((s) => ({ key: `service:${s.slug}`, label: s.title, defaultCents: s.priceAud * 100, group: "Services" })),
  ...PLAN_SERVICES.find((s) => s.kind === "ITINERARY")!.packages!.map((p) => ({ key: `package:${p.id}`, label: p.label, defaultCents: p.priceAud * 100, group: "Itinerary packages" })),
  ...GUIDE_PRODUCTS.map((g) => ({ key: `guide:${g.slug}`, label: `${g.title} (planned)`, defaultCents: g.priceAud * 100, group: "Guide previews" })),
  { key: "membership:one-time", label: "Lifetime membership (one-time)", defaultCents: Number(process.env.MEMBERSHIP_PRICE_CENTS) || 0, group: "Membership" },
] as const;

export type PriceKey = (typeof PRICE_DEFINITIONS)[number]["key"];

export async function getSitePrices(): Promise<Record<string, number>> {
  const rows = await db.sitePrice.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.cents]));
}

export function resolvePlanServices(prices: Record<string, number>): PlanService[] {
  return PLAN_SERVICES.map((s) => {
    if (s.kind === "ITINERARY") {
      const packages = s.packages!.map((p) => ({ ...p, priceAud: (prices[`package:${p.id}`] ?? p.priceAud * 100) / 100 }));
      return { ...s, packages, priceAud: packages[0].priceAud };
    }
    return { ...s, priceAud: (prices[`service:${s.slug}`] ?? s.priceAud * 100) / 100 };
  });
}

export function resolveGuideProducts(prices: Record<string, number>): GuideProduct[] {
  return GUIDE_PRODUCTS.map((g) => ({ ...g, priceAud: (prices[`guide:${g.slug}`] ?? g.priceAud * 100) / 100 }));
}

export async function getResolvedServices() { return resolvePlanServices(await getSitePrices()); }
export async function getResolvedGuides() { return resolveGuideProducts(await getSitePrices()); }
