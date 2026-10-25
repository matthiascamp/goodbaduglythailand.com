import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const updateServiceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().min(1).max(2000).optional(),
  details: z.string().max(5000).optional().nullable(),
  priceCents: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  durationMin: z.number().int().positive().optional().nullable(),
  available: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    if (parsed.data.slug) {
      const conflict = await db.service.findFirst({
        where: { slug: parsed.data.slug, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "A service with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const service = await db.service.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ service });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    console.error("[admin/services PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: Context
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    await db.service.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    console.error("[admin/services DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
