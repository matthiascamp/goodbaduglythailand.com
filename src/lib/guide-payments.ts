/**
 * Server-only readiness boundary for FUTURE guide payments. Nothing here
 * creates a checkout session, a purchase or a download. It reports which
 * prerequisites are still missing so no UI can imply guides are for sale.
 *
 * Later work, once files and prices are confirmed:
 *  1. Create Stripe Products/Prices for each guide with metadata { guideSlug }.
 *  2. Add a separate checkout route for guides (do not reuse membership checkout).
 *  3. Handle checkout.session.completed in a verified webhook that records a
 *     purchase row (not yet modelled) keyed by Stripe session id.
 *  4. Serve files from private storage via an authenticated, entitlement-checked route.
 */
import { GUIDE_PRODUCTS, isGuidePurchasable } from "@/lib/guide-products";

export interface GuidePaymentReadiness {
  ready: false;
  missing: string[];
}

export function getGuidePaymentReadiness(): GuidePaymentReadiness {
  const missing: string[] = [];
  if (!GUIDE_PRODUCTS.some(isGuidePurchasable)) missing.push("No guide has status 'available' (no files supplied)");
  if (!process.env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
  if (!process.env.STRIPE_GUIDES_WEBHOOK_SECRET) missing.push("STRIPE_GUIDES_WEBHOOK_SECRET");
  if (process.env.ENABLE_GUIDE_SALES !== "true") missing.push("ENABLE_GUIDE_SALES=true");
  // Always unready until the purchase flow itself is built.
  missing.push("Guide checkout, verified webhook and protected file route (not built)");
  return { ready: false, missing };
}
