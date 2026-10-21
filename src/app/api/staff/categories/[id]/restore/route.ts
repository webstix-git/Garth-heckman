import { NextResponse } from "next/server";
import { restoreCategory } from "@/services/categories-server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await restoreCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Restore failed" },
      { status: 400 },
    );
  }
}
