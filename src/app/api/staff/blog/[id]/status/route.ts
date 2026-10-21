import { NextResponse } from "next/server";

import { setPostStatus } from "@/services/blog-server";
import type { BlogPostStatus } from "@/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { status?: BlogPostStatus };
    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }
    const post = await setPostStatus(id, body.status);
    return NextResponse.json({ data: post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status update failed" },
      { status: 400 },
    );
  }
}
