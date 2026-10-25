import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readResourceFile } from "@/lib/resource-storage";

export const runtime = "nodejs";
const SAFE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await db.resource.findUnique({ where: { id } });
  if (!resource || !SAFE_IMAGE_TYPES.has(resource.mimeType)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
  const session = await auth();
  if ((!resource.published || resource.access !== "PUBLIC") && session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
  let bytes: Buffer;
  try { bytes = await readResourceFile(resource.storageKey); }
  catch { return NextResponse.json({ error: "Image unavailable" }, { status: 404 }); }
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": resource.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
