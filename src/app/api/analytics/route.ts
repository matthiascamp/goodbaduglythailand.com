import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CLIENT_EVENTS, isAnalyticsEnabled, isBurstLimited, isOverDailyCap, trackEvent } from "@/lib/analytics";

const schema = z.object({ event: z.enum(CLIENT_EVENTS) }).strict();

/** Same-origin only: the Origin host must match the Host header. */
function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // sendBeacon from same-origin pages may omit it
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAnalyticsEnabled()) return new NextResponse(null, { status: 204 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const raw = await request.text();
  if (raw.length > 200) return NextResponse.json({ error: "Request too large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Unknown event" }, { status: 400 });

  // The IP is hashed in memory only for the burst window and is never stored.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const key = createHash("sha256").update(`analytics:${ip}`).digest("hex");
  if (isBurstLimited(key) || (await isOverDailyCap(parsed.data.event))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  await trackEvent(parsed.data.event);
  return new NextResponse(null, { status: 204 });
}
