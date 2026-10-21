import { NextResponse } from "next/server";
import { duplicateProduct } from "@/services/products-server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const product = await duplicateProduct(slug);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Duplicate failed" },
      { status: 400 },
    );
  }
}
