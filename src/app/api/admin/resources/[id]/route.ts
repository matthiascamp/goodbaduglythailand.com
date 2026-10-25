import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { removeResourceFile } from "@/lib/resource-storage";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const existing = await db.resource.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  let input: unknown;
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json({ error: "Invalid resource details" }, { status: 400 });
  }
  const data = input as Record<string, unknown>;
  if (data.title !== undefined && (typeof data.title !== "string" || !data.title.trim() || data.title.length > 160)) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }
  if (data.description !== undefined && (typeof data.description !== "string" || data.description.length > 1000)) {
    return NextResponse.json({ error: "Invalid description" }, { status: 400 });
  }
  if (data.access !== undefined && data.access !== "PUBLIC" && data.access !== "MEMBER") {
    return NextResponse.json({ error: "Invalid access level" }, { status: 400 });
  }
  if (data.published !== undefined && typeof data.published !== "boolean") {
    return NextResponse.json({ error: "Invalid publish setting" }, { status: 400 });
  }
  if ((data.published === false || data.access === "MEMBER") && await db.article.count({ where: { coverImage: `/api/resources/${id}/view` } })) {
    return NextResponse.json({ error: "This image is used as an article cover. Choose another cover first." }, { status: 409 });
  }
  const resource = await db.resource.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: (data.title as string).trim() } : {}),
      ...(data.description !== undefined ? { description: (data.description as string).trim() } : {}),
      ...(data.access !== undefined ? { access: data.access as string } : {}),
      ...(data.published !== undefined ? { published: data.published as boolean } : {}),
    },
    select: { id: true, title: true, description: true, originalName: true, mimeType: true, sizeBytes: true, access: true, published: true, createdAt: true },
  });
  return NextResponse.json({ resource });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const resource = await db.resource.findUnique({ where: { id } });
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  if (await db.article.count({ where: { coverImage: `/api/resources/${id}/view` } })) {
    return NextResponse.json({ error: "This image is used as an article cover. Choose another cover first." }, { status: 409 });
  }
  await db.resource.delete({ where: { id } });
  await removeResourceFile(resource.storageKey);
  return NextResponse.json({ ok: true });
}
