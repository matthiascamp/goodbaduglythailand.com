import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { MAX_RESOURCE_BYTES, removeResourceFile, saveResourceFile } from "@/lib/resource-storage";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const resources = await db.resource.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, description: true, originalName: true, mimeType: true, sizeBytes: true, access: true, published: true, createdAt: true },
  });
  return NextResponse.json({ resources });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_RESOURCE_BYTES + 1_000_000) {
    return NextResponse.json({ error: "File exceeds the 100 MB limit" }, { status: 413 });
  }

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid upload" }, { status: 400 }); }

  const file = form.get("file");
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const access = String(form.get("access") || "MEMBER");
  const published = form.get("published") === "true";

  if (!(file instanceof File) || !file.name || file.size === 0) {
    return NextResponse.json({ error: "Choose a non-empty file" }, { status: 400 });
  }
  if (file.size > MAX_RESOURCE_BYTES) {
    return NextResponse.json({ error: "File exceeds the 100 MB limit" }, { status: 413 });
  }
  if (!title || title.length > 160 || description.length > 1000 || !["PUBLIC", "MEMBER"].includes(access)) {
    return NextResponse.json({ error: "Check the resource details" }, { status: 400 });
  }

  const originalName = file.name.replace(/[\\/\r\n\0]/g, "_").slice(0, 240);
  const storageKey = await saveResourceFile(new Uint8Array(await file.arrayBuffer()));
  try {
    const resource = await db.resource.create({
      data: {
        title, description, originalName, storageKey,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size, access, published,
      },
      select: { id: true, title: true, description: true, originalName: true, mimeType: true, sizeBytes: true, access: true, published: true, createdAt: true },
    });
    return NextResponse.json({ resource }, { status: 201 });
  } catch (cause) {
    await removeResourceFile(storageKey);
    throw cause;
  }
}
