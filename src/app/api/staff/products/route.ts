import { NextResponse } from "next/server";
import {
  createProduct,
  deleteProducts,
  getProductsDataSource,
  listProducts,
} from "@/services/products-server";
import type { ProductInput } from "@/types";
import { requireAdminContext } from "@/staff/lib/require-admin-context";
import { recordAuditEvent } from "@/staff/lib/audit-log";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await requireAdminContext();
  const url = new URL(req.url);
  const result = await listProducts({
    search: url.searchParams.get("search") || undefined,
    status: (url.searchParams.get("status") as "all") || "all",
    type: (url.searchParams.get("type") as "all") || "all",
    categoryId: url.searchParams.get("categoryId") || "all",
    page: Number(url.searchParams.get("page") || 1),
    pageSize: Number(url.searchParams.get("pageSize") || 50),
    sortBy: (url.searchParams.get("sortBy") as "createdAt") || "createdAt",
    sortDir: (url.searchParams.get("sortDir") as "desc") || "desc",
    trash: url.searchParams.get("trash") === "1",
    fulfillment: (url.searchParams.get("fulfillment") as "all" | "printify" | "non_printify") || "all",
  });
  return NextResponse.json({ data: result, meta: getProductsDataSource() });
}

export async function POST(req: Request) {
  try {
    const context = await requireAdminContext();
    const body = (await req.json()) as ProductInput;
    const product = await createProduct(body);
    await recordAuditEvent(context, "product.created", "product", product.id);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const context = await requireAdminContext();
    const body = (await req.json()) as { ids?: string[] };
    const count = await deleteProducts(body.ids || []);
    await recordAuditEvent(context, "product.deleted", "product", undefined, { count, ids: body.ids || [] });
    return NextResponse.json({ data: { count } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 400 },
    );
  }
}
