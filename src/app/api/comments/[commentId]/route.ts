import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Next.js 16: params is a Promise
type Context = { params: Promise<{ commentId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { commentId } = await params;

  try {
    const comment = await db.comment.update({
      where: { id: commentId },
      data: { approved: true },
    });
    return NextResponse.json({ id: comment.id, approved: comment.approved });
  } catch {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { commentId } = await params;

  try {
    await db.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }
}
