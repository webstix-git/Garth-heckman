import { NextResponse } from "next/server";
import { restoreProduct } from "@/services/products-server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    await restoreProduct(slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Restore failed" },
      { status: 400 },
    );
  }
}
