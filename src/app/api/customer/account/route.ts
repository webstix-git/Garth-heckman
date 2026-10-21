import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/backend-catalog";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRequestStoreId } from "@/lib/tenant-store";

export const runtime = "nodejs";

type DownloadLink = { orderId: string; paid: boolean; token: string | null };

/** Signed download links come from the backend, which re-checks the customer's session itself. */
async function orderDownloadLinks(session: Awaited<ReturnType<typeof createClient>>) {
  const links = new Map<string, DownloadLink>();
  try {
    const { data } = await session.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) return links;
    const payload = await backendFetch<{ orders?: DownloadLink[] }>("/api/storefront/customer/downloads", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    for (const link of payload.orders ?? []) links.set(link.orderId, link);
  } catch (error) {
    console.error("[customer:account] download links unavailable", error);
  }
  return links;
}

export async function GET() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Customer accounts are not configured." }, { status: 503 });

  const admin = createAdminClient();
  const storeId = await getRequestStoreId();
  const { data: link } = await admin
    .from("customer_auth_links")
    .select("customer_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!link?.customer_id) return NextResponse.json({ error: "Customer account was not found." }, { status: 404 });

  const [{ data: customer }, { data: orderRows, error: ordersError }] = await Promise.all([
    admin.from("customers").select("first_name, last_name, email").eq("id", link.customer_id).eq("store_id", storeId).maybeSingle(),
    admin.from("orders").select("id, order_number, placed_at, payment_status, fulfillment_status, grand_total_cents").eq("customer_id", link.customer_id).eq("store_id", storeId).order("placed_at", { ascending: false }),
  ]);
  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });

  const orderIds = (orderRows || []).map((order) => order.id);
  const { data: itemRows } = orderIds.length
    ? await admin.from("order_items").select("order_id, product_name_snapshot, sku_snapshot, variant_name_snapshot, quantity, unit_price_cents, requires_shipping, metadata").in("order_id", orderIds)
    : { data: [] };
  const itemsByOrder = new Map<string, unknown[]>();
  for (const item of itemRows || []) {
    const items = itemsByOrder.get(item.order_id) || [];
    items.push(item);
    itemsByOrder.set(item.order_id, items);
  }
  const downloads = orderIds.length ? await orderDownloadLinks(session) : new Map<string, DownloadLink>();

  return NextResponse.json({
    data: {
      customer: customer || { first_name: "", last_name: "", email: user.email || "" },
      orders: (orderRows || []).map((order) => {
        const items = itemsByOrder.get(order.id) || [];
        const requiresShipping = items.some(
          (item) => Boolean((item as { requires_shipping?: boolean }).requires_shipping),
        );
        const download = downloads.get(order.id);
        return {
          ...order,
          fulfillment_status: requiresShipping ? order.fulfillment_status : "completed",
          items,
          downloads: download
            ? { url: download.token ? `/downloads?token=${encodeURIComponent(download.token)}` : null, locked: !download.paid }
            : null,
        };
      }),
    },
  });
}
