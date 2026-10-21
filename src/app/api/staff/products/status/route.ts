import { NextResponse } from "next/server";
import { setProductsStatus } from "@/services/products-server";
import type { ProductStatus } from "@/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { ids?: string[]; status?: ProductStatus };
    if (!body.ids?.length || !body.status) {
      return NextResponse.json({ error: "ids and status required" }, { status: 400 });
    }
    const count = await setProductsStatus(body.ids, body.status);
    return NextResponse.json({ data: { count } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status update failed" },
      { status: 400 },
    );
  }
}
