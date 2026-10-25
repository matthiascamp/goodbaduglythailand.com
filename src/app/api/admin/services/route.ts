import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const createServiceSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().min(1).max(2000),
  details: z.string().max(5000).optional(),
  priceCents: z.number().int().positive("Price must be a positive integer in cents"),
  currency: z.string().length(3).default("USD"),
  durationMin: z.number().int().positive().optional(),
  available: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const services = await db.service.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ services });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await db.service.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A service with this slug already exists" },
        { status: 409 }
      );
    }

    const service = await db.service.create({ data: parsed.data });
    return NextResponse.json({ service }, { status: 201 });
  } catch (err) {
    console.error("[admin/services POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
