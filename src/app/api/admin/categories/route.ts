import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional(),
});

export async function GET(_request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: { select: { articles: true } },
    },
  });

  return NextResponse.json({ categories });
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

    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const nameConflict = await db.category.findUnique({ where: { name: parsed.data.name } });
    if (nameConflict) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }

    const slugConflict = await db.category.findUnique({ where: { slug: parsed.data.slug } });
    if (slugConflict) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 409 }
      );
    }

    const category = await db.category.create({ data: parsed.data });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    console.error("[admin/categories POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
