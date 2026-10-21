import { NextResponse } from "next/server";
import {
  deleteOrders,
  listOrders,
  listOrdersByCustomer,
  type OrderListParams,
} from "@/services/orders-server";
import { requireAdminContext } from "@/staff/lib/require-admin-context";
import { recordAuditEvent } from "@/staff/lib/audit-log";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await requireAdminContext();
  const url = new URL(req.url);
  const customerId = url.searchParams.get("customerId");
  if (customerId) {
    const items = await listOrdersByCustomer(customerId);
    return NextResponse.json({
      data: { items, total: items.length, page: 1, pageSize: items.length, pageCount: 1 },
    });
  }

  const params: OrderListParams = {
    search: url.searchParams.get("search") || undefined,
    paymentStatus: (url.searchParams.get("paymentStatus") as OrderListParams["paymentStatus"]) || "all",
    fulfillmentStatus:
      (url.searchParams.get("fulfillmentStatus") as OrderListParams["fulfillmentStatus"]) || "all",
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
    page: Number(url.searchParams.get("page") || 1),
    pageSize: Number(url.searchParams.get("pageSize") || 10),
    sortBy: (url.searchParams.get("sortBy") as OrderListParams["sortBy"]) || "createdAt",
    sortDir: (url.searchParams.get("sortDir") as OrderListParams["sortDir"]) || "desc",
  };

  const data = await listOrders(params);
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  try {
    const context = await requireAdminContext();
    const body = (await req.json()) as { ids?: string[] };
    const count = await deleteOrders(body.ids || []);
    await recordAuditEvent(context, "order.deleted", "order", undefined, { count, ids: body.ids || [] });
    return NextResponse.json({ data: { count } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 400 },
    );
  }
}
