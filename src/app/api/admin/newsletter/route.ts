import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const subscribers = await db.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { id: true, email: true, status: true, consentAt: true, consentSource: true, unsubscribedAt: true },
  });
  return NextResponse.json({ subscribers });
}
