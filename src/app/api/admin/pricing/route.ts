import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PRICE_DEFINITIONS, getSitePrices } from "@/lib/site-prices";

const allowed = new Set<string>(PRICE_DEFINITIONS.map((p) => p.key));
const schema = z.object({ prices: z.record(z.string(), z.number().int().min(0).max(10_000_000)) });

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json({ prices: await getSitePrices() });
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = await request.text();
    if (body.length > 5_000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const parsed = schema.safeParse(JSON.parse(body));
    if (!parsed.success) return NextResponse.json({ error: "Enter valid prices in AUD." }, { status: 400 });
    const entries = Object.entries(parsed.data.prices);
    if (entries.length !== allowed.size || entries.some(([key]) => !allowed.has(key))) {
      return NextResponse.json({ error: "Every listed price is required." }, { status: 400 });
    }
    if (entries.some(([key, cents]) => cents < 100 && !(key === "membership:one-time" && cents === 0))) {
      return NextResponse.json({ error: "Set a price of at least A$1, or leave membership at A$0 while it is unconfigured." }, { status: 400 });
    }
    await db.$transaction(entries.map(([key, cents]) => db.sitePrice.upsert({ where: { key }, create: { key, cents }, update: { cents } })));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save prices." }, { status: 400 });
  }
}
