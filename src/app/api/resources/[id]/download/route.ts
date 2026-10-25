import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readResourceFile } from "@/lib/resource-storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await db.resource.findUnique({ where: { id } });
  const session = await auth();
  const admin = session?.user.role === "ADMIN";

  if (!resource || (!resource.published && !admin)) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }
  if (resource.access === "MEMBER" && !admin && session?.user.membershipStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Membership required" }, { status: 403 });
  }

  let bytes: Buffer;
  try { bytes = await readResourceFile(resource.storageKey); }
  catch { return NextResponse.json({ error: "File unavailable" }, { status: 404 }); }
  const filename = resource.originalName.replace(/["\\\r\n]/g, "_");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(bytes.length),
      "Content-Disposition": `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
