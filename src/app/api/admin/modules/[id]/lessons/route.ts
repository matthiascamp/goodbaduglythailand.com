import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().max(1000).optional(),
  content: z.string().min(1),
  videoUrl: z.string().url().optional().or(z.literal("")),
  durationMin: z.number().int().positive().optional(),
  sortOrder: z.number().int().optional().default(0),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(
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

    const parsed = createLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const module_ = await db.module.findUnique({ where: { id } });
    if (!module_) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const conflict = await db.lesson.findFirst({
      where: { moduleId: id, slug: parsed.data.slug },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "A lesson with this slug already exists in this module" },
        { status: 409 }
      );
    }

    const lesson = await db.lesson.create({
      data: {
        ...parsed.data,
        videoUrl: parsed.data.videoUrl || null,
        moduleId: id,
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (err) {
    console.error("[admin/lessons POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
