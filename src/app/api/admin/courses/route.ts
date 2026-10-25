import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().min(1).max(5000),
  published: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const courses = await db.course.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { modules: true } },
    },
  });

  return NextResponse.json({ courses });
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

    const parsed = createCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await db.course.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A course with this slug already exists" },
        { status: 409 }
      );
    }

    const course = await db.course.create({ data: parsed.data });
    return NextResponse.json({ course }, { status: 201 });
  } catch (err) {
    console.error("[admin/courses POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
