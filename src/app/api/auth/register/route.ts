import { trackEvent } from "@/lib/analytics";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, password } = parsed.data;
    // Normalize email — must match how sign-in queries the DB
    const email = parsed.data.email.toLowerCase().trim();
    if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
      return NextResponse.json({ error: "This email address is unavailable." }, { status: 409 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER",
        membershipStatus: "NONE",
      },
      select: { id: true, email: true, name: true },
    });

    await trackEvent("membership_signup");
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
