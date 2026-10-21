import { NextResponse } from "next/server";
import { getCustomer } from "@/services/customers-server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const customer = await getCustomer(id);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: customer });
}
