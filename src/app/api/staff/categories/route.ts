import { NextResponse } from "next/server";
import { countCategoriesTrash, createCategory, listCategories } from "@/services/categories-server";
import type { CategoryInput } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("trashCount") === "1") {
    const count = await countCategoriesTrash();
    return NextResponse.json({ data: { count } });
  }
  const data = await listCategories(url.searchParams.get("search") || undefined, {
    trash: url.searchParams.get("trash") === "1",
  });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CategoryInput;
    const category = await createCategory(body);
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 400 },
    );
  }
}
