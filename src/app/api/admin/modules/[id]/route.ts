import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const updateModuleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
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

    const parsed = updateModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const module_ = await db.module.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ module: module_ });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    console.error("[admin/modules PATCH]", err);
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
    await db.module.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    console.error("[admin/modules DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
