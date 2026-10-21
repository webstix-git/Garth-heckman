import { NextResponse } from "next/server";
import { getOrdersDataSource, listOrders } from "@/services/orders-server";
import { getProductsDataSource, listProducts } from "@/services/products-server";
import { isSupabaseConfigured, isSupabaseAdminConfigured } from "@/lib/supabase";
import { fetchOrdersFromSupabase } from "@/lib/orders-supabase";

export async function GET() {
  await Promise.all([listOrders({ pageSize: 1 }), listProducts({ pageSize: 1 })]);

  const ordersSource = getOrdersDataSource();
  const productsSource = getProductsDataSource();
  const dbProbe = isSupabaseConfigured()
    ? await fetchOrdersFromSupabase()
    : { ok: false, orders: [], error: "not configured" };

  return NextResponse.json({
    ok: true,
    database: {
      configured: isSupabaseConfigured(),
      adminKey: isSupabaseAdminConfigured(),
      ordersOk: dbProbe.ok,
      ordersCount: dbProbe.ok ? dbProbe.orders.length : null,
      error: dbProbe.ok ? null : dbProbe.error,
    },
    dataSources: {
      orders: ordersSource,
      products: productsSource,
    },
    storefrontUrl: process.env.STOREFRONT_URL || "http://localhost:3000",
  });
}
