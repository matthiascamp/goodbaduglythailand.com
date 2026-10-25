import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Session } from "next-auth";

type AdminAuthResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse };

/**
 * Shared admin auth check for API route handlers.
 * Returns the session on success, or a ready-to-return error Response.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await auth();

  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}
