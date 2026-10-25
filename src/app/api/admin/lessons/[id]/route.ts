import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().max(1000).optional(),
  content: z.string().min(1).optional(),
  videoUrl: z.string().url().optional().or(z.literal("")).optional(),
  durationMin: z.number().int().positive().optional().nullable(),
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

    const parsed = updateLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    if (parsed.data.slug) {
      const existing = await db.lesson.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }
      const conflict = await db.lesson.findFirst({
        where: {
          moduleId: existing.moduleId,
          slug: parsed.data.slug,
          NOT: { id },
        },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "A lesson with this slug already exists in this module" },
          { status: 409 }
        );
      }
    }

    const data = {
      ...parsed.data,
      ...(parsed.data.videoUrl !== undefined
        ? { videoUrl: parsed.data.videoUrl || null }
        : {}),
    };

    const lesson = await db.lesson.update({ where: { id }, data });
    return NextResponse.json({ lesson });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    console.error("[admin/lessons PATCH]", err);
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
    await db.lesson.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    console.error("[admin/lessons DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
