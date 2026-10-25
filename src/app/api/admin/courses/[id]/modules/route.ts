import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().optional().default(0),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: Context
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const modules = await db.module.findMany({
    where: { courseId: id },
    orderBy: { sortOrder: "asc" },
    include: { lessons: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ modules });
}

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

    const parsed = createModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const course = await db.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const module_ = await db.module.create({
      data: { ...parsed.data, courseId: id },
    });

    return NextResponse.json({ module: module_ }, { status: 201 });
  } catch (err) {
    console.error("[admin/modules POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
