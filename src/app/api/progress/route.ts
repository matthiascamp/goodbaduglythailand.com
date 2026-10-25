import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (session.user.membershipStatus !== "ACTIVE" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Membership required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const courseSlug = searchParams.get("courseSlug");
  const lessonSlug = searchParams.get("lessonSlug");

  if (!courseSlug || !lessonSlug) {
    return NextResponse.json(
      { error: "courseSlug and lessonSlug required" },
      { status: 400 }
    );
  }

  const lesson = await db.lesson.findFirst({
    where: {
      slug: lessonSlug,
      module: { course: { slug: courseSlug, ...(session.user.role === "ADMIN" ? {} : { published: true }) } },
    },
    include: {
      module: {
        include: {
          course: { select: { title: true, slug: true } },
          lessons: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, slug: true, sortOrder: true },
          },
        },
      },
      lessonProgress: { where: { userId: session.user.id } },
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const siblings = lesson.module.lessons;
  const idx = siblings.findIndex((l) => l.id === lesson.id);
  const prevLesson = idx > 0 ? siblings[idx - 1] : null;
  const nextLesson = idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return NextResponse.json({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    content: lesson.content,
    videoUrl: lesson.videoUrl,
    durationMin: lesson.durationMin,
    completed: lesson.lessonProgress.length > 0,
    course: lesson.module.course,
    module: { title: lesson.module.title },
    prevLesson: prevLesson ? { slug: prevLesson.slug } : null,
    nextLesson: nextLesson ? { slug: nextLesson.slug } : null,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (session.user.membershipStatus !== "ACTIVE" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Membership required" }, { status: 403 });
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { lessonId } = body as { lessonId?: string };

    if (!lessonId || typeof lessonId !== "string") {
      return NextResponse.json({ error: "lessonId required" }, { status: 400 });
    }

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: { select: { published: true } } } } },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    if (!lesson.module.course.published && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: session.user.id, lessonId } },
      create: { userId: session.user.id, lessonId },
      update: { completedAt: new Date() },
    });

    return NextResponse.json({ completed: true, lessonId });
  } catch (err) {
    console.error("[progress POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
