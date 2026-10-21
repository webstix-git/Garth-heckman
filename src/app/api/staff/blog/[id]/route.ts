import { NextResponse } from "next/server";

import { permanentlyDeletePost, trashPost, getPost, updatePost } from "@/services/blog-server";
import type { BlogPostInput } from "@/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const post = await getPost(id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: post });
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Partial<BlogPostInput>;
    const post = await updatePost(id, body);
    return NextResponse.json({ data: post });
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
      await permanentlyDeletePost(id);
    } else {
      await trashPost(id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 400 },
    );
  }
}
