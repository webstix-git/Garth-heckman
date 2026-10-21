import { NextResponse } from "next/server";

import { duplicatePost } from "@/services/blog-server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const post = await duplicatePost(id);
    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Duplicate failed" },
      { status: 400 },
    );
  }
}
