import { NextResponse } from "next/server";

import { createBlogCategory, listBlogCategories, renamePostCategory } from "@/services/blog-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try { return NextResponse.json({ data: await listBlogCategories(new URL(req.url).searchParams.get("trash") === "1") }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load categories" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: string;
      from?: string;
      to?: string;
    };
    if (body.action === "create") {
      return NextResponse.json({ data: await createBlogCategory(body as never) }, { status: 201 });
    }
    if (!body.from || !body.to) {
      return NextResponse.json({ error: "from and to are required" }, { status: 400 });
    }
    await renamePostCategory(body.from, body.to);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Category update failed" },
      { status: 400 },
    );
  }
}
