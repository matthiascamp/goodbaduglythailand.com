import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { db } from "@/lib/db";

const commentSchema = z.object({
  articleId: z.string().min(1),
  content: z.string().min(1, "Comment cannot be empty").max(2000),
  authorName: z.string().min(1).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { articleId, content, authorName } = parsed.data;

    const article = await db.article.findUnique({
      where: { id: articleId, published: true },
      select: { id: true },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const session = await auth();

    const comment = await db.comment.create({
      data: {
        content,
        approved: false,
        articleId,
        userId: session?.user?.id ?? null,
        authorName: session?.user?.id ? null : (authorName ?? null),
      },
      select: { id: true },
    });

    return NextResponse.json(
      { id: comment.id, message: "Comment submitted for review" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[comments POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const articleId = searchParams.get("articleId");

  const session = await auth();

  try {
    if (session?.user?.role === "ADMIN") {
      const where =
        status === "pending"
          ? { approved: false }
          : status === "approved"
            ? { approved: true }
            : {};

      const comments = await db.comment.findMany({
        where: articleId ? { ...where, articleId } : where,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          article: { select: { title: true, slug: true } },
        },
      });
      return NextResponse.json({ comments });
    }

    if (!articleId) {
      return NextResponse.json({ error: "articleId required" }, { status: 400 });
    }

    const comments = await db.comment.findMany({
      where: { articleId, approved: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        authorName: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("[comments GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
