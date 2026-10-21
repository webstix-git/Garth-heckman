import { NextResponse } from "next/server";
import {
  permanentlyDeleteCategory,
  trashCategory,
  getCategory,
  updateCategory,
} from "@/services/categories-server";
import type { CategoryInput } from "@/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const category = await getCategory(id);
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: category });
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Partial<CategoryInput>;
    const category = await updateCategory(id, body);
    return NextResponse.json({ data: category });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const permanent = new URL(req.url).searchParams.get("permanent") === "1";
    if (permanent) {
      await permanentlyDeleteCategory(id);
    } else {
      await trashCategory(id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 400 },
    );
  }
}
