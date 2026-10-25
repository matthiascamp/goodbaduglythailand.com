import { db } from "@/lib/db";

/**
 * First-party, privacy-first analytics. Only an event name and a UTC calendar day
 * are counted: no user id, email, IP, user agent, URL, referrer or form answers.
 * No third-party provider is loaded. Set ANALYTICS_ENABLED=false to switch it off.
 */

/** Events a browser may report (public, rate limited). Everything else is server-side only. */
export const CLIENT_EVENTS = ["service_cta_click", "affiliate_outbound_click", "guide_purchase_intent"] as const;
export type ClientEvent = (typeof CLIENT_EVENTS)[number];

/** Events recorded by the server at the moment the outcome is known. */
export const SERVER_EVENTS = [
  "enquiry_submitted",
  "itinerary_enquiry_submitted",
  "newsletter_subscribe",
  "guide_release_interest",
  "membership_signup",
  "membership_checkout_started",
  "purchase_completed",
] as const;
export type ServerEvent = (typeof SERVER_EVENTS)[number];

export type AnalyticsEvent = ClientEvent | ServerEvent;

export function isAnalyticsEnabled() {
  return process.env.ANALYTICS_ENABLED !== "false";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Never throws: analytics must not break a request. */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  if (!isAnalyticsEnabled()) return;
  try {
    const day = today();
    await db.analyticsDaily.upsert({
      where: { event_day: { event, day } },
      create: { event, day, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch {
    console.error("[analytics] could not record event");
  }
}

/** Daily ceiling per public event so a script cannot inflate or flood the table. */
const DAILY_CLIENT_CAP = 20_000;

export async function isOverDailyCap(event: ClientEvent) {
  const row = await db.analyticsDaily.findUnique({ where: { event_day: { event, day: today() } }, select: { count: true } });
  return (row?.count ?? 0) >= DAILY_CLIENT_CAP;
}

/** In-memory (per instance, never persisted) sliding window keyed by a caller-supplied opaque key. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const LIMIT = 30;

export function isBurstLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return false;
}
