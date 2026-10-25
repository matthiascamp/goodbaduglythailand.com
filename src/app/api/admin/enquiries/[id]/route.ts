import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const patchSchema = z.object({ status: z.enum(["NEW", "REPLIED", "ARCHIVED"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  try {
    const enquiry = await db.serviceEnquiry.update({ where: { id }, data: { status: parsed.data.status }, select: { id: true, status: true } });
    return NextResponse.json({ enquiry });
  } catch {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
  }
}
