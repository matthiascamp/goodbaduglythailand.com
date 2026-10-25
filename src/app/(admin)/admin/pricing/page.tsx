import { PRICE_DEFINITIONS, getSitePrices } from "@/lib/site-prices";
import PricingEditor from "./PricingEditor";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const saved = await getSitePrices();
  const entries = PRICE_DEFINITIONS.map((p) => ({ ...p, cents: saved[p.key] ?? p.defaultCents }));
  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-charcoal mb-3">Public prices</h1>
      <p className="text-charcoal/70 mb-4">Change the featured consultation, itinerary, guide preview and one-time membership prices here. The separate Services editor manages the older advice catalogue on the Services page.</p>
      <p className="text-charcoal/70 mb-8">Guide prices are planned only; guides cannot be purchased yet. The itinerary headline automatically follows the 7-day package. Leave membership at A$0 until its price is decided. Checkout remains disabled until Stripe and the final policies are configured.</p>
      <PricingEditor entries={entries} />
    </div>
  );
}
