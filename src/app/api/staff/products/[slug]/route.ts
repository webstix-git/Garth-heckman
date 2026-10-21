import { NextResponse } from "next/server";
import {
  permanentlyDeleteProduct,
  trashProduct,
  getProduct,
  updateProduct,
} from "@/services/products-server";
import type { ProductInput } from "@/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const product = await getProduct(slug);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: product });
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const body = (await req.json()) as Partial<ProductInput>;
    const product = await updateProduct(slug, body);
    return NextResponse.json({ data: product });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const permanent = new URL(req.url).searchParams.get("permanent") === "1";
    if (permanent) {
      await permanentlyDeleteProduct(slug);
    } else {
      await trashProduct(slug);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 400 },
    );
  }
}
