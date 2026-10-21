import { NextResponse } from "next/server";

import { fetchProductsFromSupabase } from "@/lib/products-supabase";
import { listCustomers } from "@/services/customers-server";
import { getOrdersSnapshot } from "@/services/orders-server";

export const runtime = "nodejs";

function csv(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function file(resource: string, rows: Record<string, unknown>[]) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const body = [headers.join(","), ...rows.map((row) => headers.map((key) => csv(row[key])).join(","))].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${resource}-export.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(_request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (resource === "products") {
    const result = await fetchProductsFromSupabase();
    if (!result.ok) return NextResponse.json({ error: result.error || "Products export failed" }, { status: 400 });
    return file("products", result.products.map((product) => ({
      name: product.name, slug: product.slug, sku: product.sku, status: product.status,
      product_type: product.type, price: product.price, inventory: product.inventory?.quantity ?? "",
      category_id: product.categoryId || "", created_at: product.createdAt, updated_at: product.updatedAt,
    })));
  }
  if (resource === "orders") {
    const orders = await getOrdersSnapshot();
    return file("orders", orders.map((order) => ({
      order_number: order.number, customer_name: order.customerName, customer_email: order.customerEmail,
      payment_status: order.paymentStatus, fulfillment_status: order.fulfillmentStatus,
      items: order.items.map((item) => `${item.productName} × ${item.quantity}`).join("; "),
      subtotal: order.subtotal, shipping: order.shipping, tax: order.tax, total: order.total, created_at: order.createdAt,
    })));
  }
  if (resource === "customers") {
    const customers = await listCustomers({ page: 1, pageSize: 10000 });
    return file("customers", customers.items.map((customer) => ({
      first_name: customer.firstName, last_name: customer.lastName, email: customer.email,
      phone: customer.phone, status: customer.status, orders: customer.orderCount,
      total_spent: customer.totalSpent, joined_at: customer.createdAt,
    })));
  }
  return NextResponse.json({ error: "Unknown export resource" }, { status: 404 });
}
