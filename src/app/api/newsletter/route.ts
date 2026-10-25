import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { NEWSLETTER_CONSENT_TEXT, newsletterSchema } from "@/lib/newsletter-schema";
import { trackEvent } from "@/lib/analytics";
import { isRateLimited, newToken, sendConfirmationEmail } from "@/lib/newsletter";

const MAX_BODY_BYTES = 4_000;

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Request too large" }, { status: 413 });
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
      return NextResponse.json({ error: Object.values(fieldErrors)[0] ?? "Invalid input", fieldErrors }, { status: 400 });
    }
    const { email, source, website } = parsed.data;

    // Honeypot: pretend success without storing anything.
    if (website) return NextResponse.json({ ok: true, emailSent: false }, { status: 201 });

    if (await isRateLimited(clientIp(request))) {
      return NextResponse.json({ error: "Too many attempts just now. Please try again later." }, { status: 429 });
    }

    const existing = await db.newsletterSubscriber.findUnique({ where: { email } });

    if (existing && existing.status === "ACTIVE") {
      // Already registered: respond identically so the list cannot be probed for addresses.
      return NextResponse.json({ ok: true, emailSent: false }, { status: 201 });
    }
    const token = newToken();
    const now = new Date();
    if (existing) {
      // Re-subscribing after unsubscribing records fresh consent and a fresh token.
      await db.newsletterSubscriber.update({
        where: { email },
        data: { status: "ACTIVE", consentAt: now, consentSource: source, consentText: NEWSLETTER_CONSENT_TEXT, unsubscribeToken: token, unsubscribedAt: null },
      });
    } else {
      try {
        await db.newsletterSubscriber.create({
          data: { email, consentAt: now, consentSource: source, consentText: NEWSLETTER_CONSENT_TEXT, unsubscribeToken: token },
        });
      } catch (err) {
        // Concurrent duplicate signup: treat as already registered.
        if ((err as { code?: string }).code === "P2002") return NextResponse.json({ ok: true, emailSent: false }, { status: 201 });
        throw err;
      }
    }

    await trackEvent("newsletter_subscribe");
    if (source.startsWith("guide")) await trackEvent("guide_release_interest");
    const emailSent = await sendConfirmationEmail(email, token);
    return NextResponse.json({ ok: true, emailSent }, { status: 201 });
  } catch {
    console.error("[newsletter POST] failed");
    return NextResponse.json({ error: "We could not save your sign-up. Please try again." }, { status: 500 });
  }
}
