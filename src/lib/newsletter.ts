import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT_PER_IP = 8;
const LIMIT_GLOBAL = 200;

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function hashIp(ip: string) {
  const salt = process.env.AUTH_SECRET ?? "newsletter";
  return createHash("sha256").update(`newsletter:${salt}:${ip}`).digest("hex");
}

/** Records the attempt and reports whether the caller is over the hourly limit. */
export async function isRateLimited(ip: string) {
  const ipHash = hashIp(ip);
  const since = new Date(Date.now() - WINDOW_MS);
  const [perIp, total] = await Promise.all([
    db.newsletterAttempt.count({ where: { ipHash, createdAt: { gte: since } } }),
    db.newsletterAttempt.count({ where: { createdAt: { gte: since } } }),
  ]);
  if (perIp >= LIMIT_PER_IP || total >= LIMIT_GLOBAL) return true;
  await db.newsletterAttempt.create({ data: { ipHash } });
  // Opportunistic pruning keeps the table small.
  if (Math.random() < 0.05) {
    await db.newsletterAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * WINDOW_MS) } } });
  }
  return false;
}

export function isValidToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

/**
 * Optional email provider boundary (Resend over HTTP). Not required: when
 * RESEND_API_KEY and NEWSLETTER_FROM_EMAIL are unset nothing is sent and the
 * caller must not claim delivery. Returns true only if the API confirmed.
 */
export function isEmailProviderConfigured() {
  return !!process.env.RESEND_API_KEY && !!process.env.NEWSLETTER_FROM_EMAIL;
}

export async function sendConfirmationEmail(to: string, unsubscribeToken: string): Promise<boolean> {
  if (!isEmailProviderConfigured()) return false;
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const unsubscribeUrl = `${base}/newsletter/unsubscribe?token=${unsubscribeToken}`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NEWSLETTER_FROM_EMAIL,
        to,
        subject: "You're on the list — The Good, Bad & Ugly of Thailand",
        text: `Thanks for registering your interest. We will email you when the checklist is ready.\n\nUnsubscribe any time: ${unsubscribeUrl}`,
        headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    // Never log the key, token or recipient.
    console.error("[newsletter] provider request failed");
    return false;
  }
}
