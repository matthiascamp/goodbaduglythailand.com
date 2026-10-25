import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const createArticleSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z
    .string()
    .min(1)
    .max(300)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1),
  coverImage: z.string().url().or(z.string().regex(/^\/api\/resources\/[a-z0-9]+\/view$/)).optional().or(z.literal("")),
  categoryId: z.string().optional().nullable(),
  published: z.boolean().optional().default(false),
});

export async function GET(_request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const articles = await db.article.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({ articles });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await db.article.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) {
      return NextResponse.json(
        { error: "An article with this slug already exists" },
        { status: 409 }
      );
    }

    if (parsed.data.categoryId) {
      const cat = await db.category.findUnique({ where: { id: parsed.data.categoryId } });
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
    }

    if (parsed.data.coverImage?.startsWith("/api/resources/")) {
      const imageId = parsed.data.coverImage.split("/")[3];
      const image = await db.resource.findUnique({ where: { id: imageId } });
      if (!image || !image.published || image.access !== "PUBLIC" || !["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(image.mimeType)) {
        return NextResponse.json({ error: "Choose a published public image for the cover" }, { status: 400 });
      }
    }

    const article = await db.article.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: parsed.data.excerpt,
        content: parsed.data.content,
        coverImage: parsed.data.coverImage || null,
        categoryId: parsed.data.categoryId || null,
        published: parsed.data.published,
        publishedAt: parsed.data.published ? new Date() : null,
      },
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (err) {
    console.error("[admin/articles POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
