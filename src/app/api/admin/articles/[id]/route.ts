import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const updateArticleSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: z
    .string()
    .min(1)
    .max(300)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  excerpt: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  coverImage: z.string().url().or(z.string().regex(/^\/api\/resources\/[a-z0-9]+\/view$/)).optional().or(z.literal("")).optional(),
  categoryId: z.string().optional().nullable(),
  published: z.boolean().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: Context
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const article = await db.article.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json({ article });
}

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

    const parsed = updateArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    if (parsed.data.slug) {
      const conflict = await db.article.findFirst({
        where: { slug: parsed.data.slug, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "An article with this slug already exists" },
          { status: 409 }
        );
      }
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

    const existing = await db.article.findUnique({ where: { id }, select: { published: true, publishedAt: true } });
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Set publishedAt when first publishing; clear it on unpublish
    let publishedAt: Date | null | undefined = undefined;
    if (parsed.data.published !== undefined) {
      if (parsed.data.published && !existing.published) {
        publishedAt = new Date();
      } else if (!parsed.data.published) {
        publishedAt = null;
      }
    }

    const updateData = {
      ...parsed.data,
      coverImage:
        parsed.data.coverImage !== undefined
          ? parsed.data.coverImage || null
          : undefined,
      categoryId:
        parsed.data.categoryId !== undefined
          ? parsed.data.categoryId || null
          : undefined,
      ...(publishedAt !== undefined ? { publishedAt } : {}),
      updatedAt: new Date(),
    };

    const article = await db.article.update({ where: { id }, data: updateData });

    return NextResponse.json({ article });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    console.error("[admin/articles PATCH]", err);
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
    await db.article.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    console.error("[admin/articles DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
