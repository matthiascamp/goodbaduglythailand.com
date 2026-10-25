import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";
import { enquirySchema } from "@/lib/enquiry-schema";

const MAX_BODY_BYTES = 20_000;
const HOURLY_LIMIT_PER_EMAIL = 3;
const HOURLY_LIMIT_GLOBAL = 60;

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = enquirySchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] ??= issue.message;
      }
      return NextResponse.json(
        { error: Object.values(fieldErrors)[0] ?? "Invalid input", fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Honeypot: pretend success without storing anything.
    if (data.website) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [byEmail, total] = await Promise.all([
      db.serviceEnquiry.count({ where: { email: data.email, createdAt: { gte: since } } }),
      db.serviceEnquiry.count({ where: { createdAt: { gte: since } } }),
    ]);
    if (byEmail >= HOURLY_LIMIT_PER_EMAIL || total >= HOURLY_LIMIT_GLOBAL) {
      return NextResponse.json(
        { error: "Too many enquiries just now. Please try again later." },
        { status: 429 }
      );
    }

    const session = await auth();

    const { kind, serviceSlug, name, email, message, acknowledged, website, ...answers } = data;

    const enquiry = await db.serviceEnquiry.create({
      data: {
        kind,
        serviceSlug,
        packageId: data.kind === "ITINERARY" ? data.packageId : null,
        name,
        email,
        message,
        details: JSON.stringify(answers),
        userId: session?.user?.id ?? null,
      },
      select: { id: true },
    });

    await trackEvent(kind === "ITINERARY" ? "itinerary_enquiry_submitted" : "enquiry_submitted");
    return NextResponse.json({ ok: true, id: enquiry.id }, { status: 201 });
  } catch (err) {
    console.error("[enquiries POST]", err);
    return NextResponse.json({ error: "We could not save your enquiry. Please try again." }, { status: 500 });
  }
}
