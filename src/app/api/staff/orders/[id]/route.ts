import { NextResponse } from "next/server";
import { deleteOrder, getOrder, updateOrderStatus } from "@/services/orders-server";
import type { OrderStatus } from "@/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: order });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json()) as { fulfillmentStatus?: OrderStatus };
  if (!body.fulfillmentStatus) {
    return NextResponse.json({ error: "fulfillmentStatus required" }, { status: 400 });
  }
  try {
    const order = await updateOrderStatus(id, body.fulfillmentStatus);
    return NextResponse.json({ data: order });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await deleteOrder(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    const status = message === "Order not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
