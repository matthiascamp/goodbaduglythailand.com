import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe";
import { trackEvent } from "@/lib/analytics";
import { getPricingConfig } from "@/lib/pricing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function POST(_request: NextRequest) {
  try {
    const pricing = await getPricingConfig();
    if (!pricing.configured) {
      console.error("[checkout] Not configured:", pricing.reason);
      return NextResponse.json(
        { error: "Checkout is not available yet. Please check back later." },
        { status: 503 }
      );
    }

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.membershipStatus === "ACTIVE" || session.user.role === "ADMIN") {
      return NextResponse.json(
        { error: "You already have an active membership." },
        { status: 400 }
      );
    }

    const lineItems = [{
      price_data: {
        currency: pricing.currency,
        product_data: {
          name: "Good, Bad & Ugly Thailand — Lifetime Membership",
          description: "One-time payment for access to the published course library.",
        },
        unit_amount: pricing.priceCents,
      },
      quantity: 1 as const,
    }];

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
        product: "lifetime_membership",
      },
      success_url: `${SITE_URL}/dashboard?payment=success`,
      cancel_url: `${SITE_URL}/membership?payment=cancelled`,
      allow_promotion_codes: true,
    });

    await trackEvent("membership_checkout_started");
    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
