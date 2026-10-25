/**
 * Membership pricing configuration.
 *
 * Call getPricingConfig() in any server context that needs to know whether
 * checkout is safe to initiate, and at what price.
 *
 * How to integrate with the public membership page:
 *   import { getPricingConfig } from "@/lib/pricing";
 *   const pricing = getPricingConfig();
 *   // pricing.configured === false  →  show "coming soon" or hide the buy button
 *   // pricing.configured === true   →  show pricing.displayPrice
 */

import { db } from "@/lib/db";

export type PricingConfig =
  | {
      configured: true;
      /** Amount in cents */
      priceCents: number;
      /** ISO 4217 currency code, lower-case */
      currency: string;
      /** Human-readable price from the same amount used by checkout */
      displayPrice: string;
    }
  | {
      configured: false;
      /** Reason checkout is blocked — safe to log server-side, do not surface to browser */
      reason: string;
      displayPrice?: string;
    };

export async function getPricingConfig(): Promise<PricingConfig> {
  const override = await db.sitePrice.findUnique({ where: { key: "membership:one-time" } });
  const rawCents = override?.cents ?? process.env.MEMBERSHIP_PRICE_CENTS;
  const currency = (process.env.MEMBERSHIP_CURRENCY || "AUD").toLowerCase();

  const cents = Number(rawCents);
  const displayPrice = Number.isSafeInteger(cents) && cents > 0 && /^[a-z]{3}$/.test(currency)
    ? new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(cents / 100)
    : undefined;

  if (process.env.ENABLE_CHECKOUT !== "true") {
    return { configured: false, reason: "Checkout is disabled.", displayPrice };
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return { configured: false, reason: "Stripe keys and webhook secret are required." };
  }

  if (!/^[a-z]{3}$/.test(currency)) {
    return { configured: false, reason: "MEMBERSHIP_CURRENCY must be a three-letter currency code." };
  }

  // A displayed amount and checkout amount must come from the same configuration.
  if (!rawCents) {
    return {
      configured: false,
      reason:
        "Checkout is not configured. Set MEMBERSHIP_PRICE_CENTS before enabling purchases.",
    };
  }

  if (!Number.isSafeInteger(cents) || cents <= 0) {
    return {
      configured: false,
      reason:
        "MEMBERSHIP_PRICE_CENTS must be a positive integer (amount in cents, e.g. 29700 for $297).",
    };
  }

  return {
    configured: true,
    priceCents: cents,
    currency,
    displayPrice: displayPrice!,
  };
}
