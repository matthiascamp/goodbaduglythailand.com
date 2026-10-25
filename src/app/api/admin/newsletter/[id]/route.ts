import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(_request: NextRequest, { params }: Context) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  try {
    await db.newsletterSubscriber.update({ where: { id }, data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Subscriber not found." }, { status: 404 }); }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  try {
    await db.newsletterSubscriber.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Subscriber not found." }, { status: 404 }); }
}
