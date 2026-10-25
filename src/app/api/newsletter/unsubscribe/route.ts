import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidToken } from "@/lib/newsletter";

/** POST only: link scanners and prefetchers issue GET, which must never unsubscribe anyone. */
export async function POST(request: NextRequest) {
  try {
    let token: unknown = request.nextUrl.searchParams.get("token");
    if (!token) {
      const raw = await request.text();
      if (raw.length > 2_000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
      try {
        token = (JSON.parse(raw) as { token?: unknown }).token;
      } catch {
        token = new URLSearchParams(raw).get("token");
      }
    }
    if (!isValidToken(token)) return NextResponse.json({ error: "This unsubscribe link is not valid." }, { status: 400 });

    const subscriber = await db.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token }, select: { id: true, status: true } });
    if (!subscriber) return NextResponse.json({ error: "This unsubscribe link is not valid or has expired." }, { status: 404 });
    if (subscriber.status !== "UNSUBSCRIBED") {
      await db.newsletterSubscriber.update({ where: { id: subscriber.id }, data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() } });
    }
    return NextResponse.json({ ok: true });
  } catch {
    console.error("[newsletter unsubscribe] failed");
    return NextResponse.json({ error: "We could not process that. Please try again." }, { status: 500 });
  }
}
