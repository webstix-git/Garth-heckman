import { NextResponse } from "next/server";

import {
  createPost,
  listPosts,
} from "@/services/blog-server";
import type { BlogPostInput } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const result = await listPosts({
      search: url.searchParams.get("search") || undefined,
      status: (url.searchParams.get("status") as "all") || "all",
      category: url.searchParams.get("category") || "all",
      tag: url.searchParams.get("tag") || "all",
      page: Number(url.searchParams.get("page") || 1),
      pageSize: Number(url.searchParams.get("pageSize") || 50),
      sortBy: (url.searchParams.get("sortBy") as "createdAt") || "createdAt",
      sortDir: (url.searchParams.get("sortDir") as "desc") || "desc",
      trash: url.searchParams.get("trash") === "1",
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load posts" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BlogPostInput;
    const post = await createPost(body);
    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 400 },
    );
  }
}
