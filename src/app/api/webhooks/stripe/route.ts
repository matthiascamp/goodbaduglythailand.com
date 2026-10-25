import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { trackEvent } from "@/lib/analytics";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Only grant membership for sessions tagged with this product key. */
const MEMBERSHIP_PRODUCT_KEY = "lifetime_membership";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // ── Immediate card payment ────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Only process paid sessions (async payments handled separately below)
        if (session.payment_status !== "paid") break;

        await grantMembership(session);
        break;
      }

      // ── Async payment methods (bank transfer, etc.) ───────────────────────
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await grantMembership(session);
        break;
      }

      // ── Refund / reversal — revoke membership ─────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : null;

        if (!paymentIntentId) {
          console.warn("[stripe-webhook] charge.refunded: no payment_intent");
          break;
        }

        // Only revoke if fully refunded
        if (!charge.refunded) break;

        const user = await db.user.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
          select: { id: true, email: true },
        });

        if (!user) {
          console.warn(
            `[stripe-webhook] charge.refunded: no user for PI ${paymentIntentId}`
          );
          break;
        }

        await db.user.update({
          where: { id: user.id },
          data: { membershipStatus: "NONE" },
        });

        console.log(
          `[stripe-webhook] Membership revoked (refund) for user ${user.id} (${user.email})`
        );
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

/**
 * Grant lifetime membership from a completed Checkout Session.
 * Guards:
 *  1. metadata.product must equal "lifetime_membership" — prevents a service
 *     payment from accidentally granting course access.
 *  2. Idempotency — if stripeCheckoutSessionId already matches, skip the update
 *     so Stripe retries don't double-process.
 */
async function grantMembership(session: Stripe.Checkout.Session) {
  // 1. Product guard
  if (session.metadata?.product !== MEMBERSHIP_PRODUCT_KEY) {
    console.log(
      `[stripe-webhook] Skipping session ${session.id}: product="${session.metadata?.product}" is not "${MEMBERSHIP_PRODUCT_KEY}"`
    );
    return;
  }

  const userId = session.metadata?.userId ?? session.client_reference_id;

  if (!userId) {
    console.error(
      `[stripe-webhook] grantMembership: no userId in session ${session.id}`
    );
    return;
  }

  // 2. Idempotency guard
  const existing = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCheckoutSessionId: true },
  });

  if (existing?.stripeCheckoutSessionId === session.id) {
    console.log(
      `[stripe-webhook] Idempotency: session ${session.id} already processed for user ${userId}`
    );
    return;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      membershipStatus: "ACTIVE",
      membershipPaidAt: new Date(),
      stripeCheckoutSessionId: session.id,
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : undefined,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined,
    },
  });

  // Counted only here: after signature verification, paid status and the idempotency guard.
  await trackEvent("purchase_completed");

  console.log(
    `[stripe-webhook] Membership granted for user ${userId} via session ${session.id}`
  );
}
