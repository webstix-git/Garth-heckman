import { NextResponse } from "next/server";

import { fetchBackendBlog } from "@/lib/backend-blog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const category = new URL(request.url).searchParams.get("category")?.trim() || undefined;
    const { posts, categories } = await fetchBackendBlog(category);
    return NextResponse.json({
      data: posts,
      categories: categories.map((item) => ({ slug: item.slug, name: item.name, posts: item.posts })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load posts",
        data: [],
        categories: [],
      },
      { status: 500 },
    );
  }
}
