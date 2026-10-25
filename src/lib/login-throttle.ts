import { createHash } from "node:crypto";
import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 30 * 60 * 1000;
const MAX_FAILURES = 8;

function keyFor(identifier: string) {
  return createHash("sha256").update(`password-login:${identifier}`).digest("hex");
}

export async function isLoginBlocked(identifier: string) {
  const attempt = await db.loginThrottle.findUnique({ where: { key: keyFor(identifier) } });
  return !!attempt?.blockedUntil && attempt.blockedUntil.getTime() > Date.now();
}

export async function recordLoginFailure(identifier: string) {
  const key = keyFor(identifier);
  const now = new Date();
  const attempt = await db.loginThrottle.findUnique({ where: { key } });

  if (!attempt || now.getTime() - attempt.windowStart.getTime() > WINDOW_MS) {
    await db.loginThrottle.upsert({
      where: { key },
      create: { key, failures: 1, windowStart: now },
      update: { failures: 1, windowStart: now, blockedUntil: null },
    });
    return;
  }

  const updated = await db.loginThrottle.update({
    where: { key },
    data: { failures: { increment: 1 } },
  });
  if (updated.failures >= MAX_FAILURES) {
    await db.loginThrottle.update({
      where: { key },
      data: { blockedUntil: new Date(now.getTime() + BLOCK_MS) },
    });
  }
}

export async function clearLoginFailures(identifier: string) {
  await db.loginThrottle.deleteMany({ where: { key: keyFor(identifier) } });
}
