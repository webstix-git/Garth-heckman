import "server-only";

import type { Order, OrderItem, OrderStatus, PaymentStatus } from "@/types";
import { Catalog } from "@/lib/catalog";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentAdminStoreId } from "@/lib/current-admin-store";

type DbOrder = {
  id: string;
  order_number: string;
  placed_at: string;
  customer_email: string;
  customer_name: string;
  payment_method: string;
  order_status: string;
  payment_status: string;
  fulfillment_status: string;
  printify_order_id: string | null;
  subtotal_cents: number;
  shipping_total_cents: number;
  tax_total_cents: number;
  grand_total_cents: number;
  created_at: string;
};

type DbOrderItem = {
  id: string;
  order_id: string;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  sku_snapshot: string | null;
  quantity: number;
  unit_price_cents: number;
  requires_shipping: boolean;
  product_type: string | null;
  metadata: { productId?: string; slug?: string } | null;
};

type DbAddress = {
  order_id: string;
  address_type: string;
  first_name: string | null;
  last_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

type DbProductThumbnail = {
  slug: string;
  metadata: { images?: unknown } | null;
};

function productImage(metadata: DbProductThumbnail["metadata"]): string | undefined {
  const images = metadata?.images;
  if (!Array.isArray(images)) return undefined;
  return images.find((image): image is string => typeof image === "string" && image.length > 0);
}

function centsToDollars(cents: number) {
  return Math.round(cents) / 100;
}

function mapPaymentStatus(status: string): PaymentStatus {
  if (status === "none" || status === "paid" || status === "captured") return "paid";
  if (status === "failed") return "failed";
  if (status === "refunded" || status === "partially_refunded") return "refunded";
  return "pending";
}

function mapFulfillmentStatus(status: string): OrderStatus {
  if (status === "fulfilled") return "fulfilled";
  if (status === "cancelled") return "cancelled";
  if (status === "partially_fulfilled" || status === "unfulfilled") return "processing";
  if (status === "completed") return "completed";
  return "pending";
}

function emptyAddress(name: string) {
  return {
    name,
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  };
}

function mapOrder(
  row: DbOrder,
  items: DbOrderItem[],
  address: DbAddress | null,
  imageBySlug: Map<string, string>,
): Order {
  const requiresFulfillment = items.some((item) => item.requires_shipping);
  const shippingAddress = address
    ? {
        name: [address.first_name, address.last_name].filter(Boolean).join(" ") || row.customer_name,
        line1: address.address_line_1 || "",
        line2: address.address_line_2 || undefined,
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postal_code || "",
        country: address.country || "United States",
      }
    : emptyAddress(row.customer_name);

  const mappedItems: OrderItem[] = items.map((item) => ({
    id: item.id,
    productId: item.metadata?.productId || item.sku_snapshot || item.id,
    productSlug: item.metadata?.slug || undefined,
    productName: item.product_name_snapshot,
    sku: item.sku_snapshot || "",
    variantLabel: item.variant_name_snapshot || undefined,
    quantity: item.quantity,
    unitPrice: centsToDollars(item.unit_price_cents),
    image: item.metadata?.slug ? imageBySlug.get(item.metadata.slug) : undefined,
  }));

  return {
    id: row.id,
    number: row.order_number,
    customerId: row.customer_email,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    items: mappedItems,
    subtotal: centsToDollars(row.subtotal_cents),
    shipping: centsToDollars(row.shipping_total_cents),
    tax: centsToDollars(row.tax_total_cents),
    total: centsToDollars(row.grand_total_cents),
    paymentStatus: mapPaymentStatus(row.payment_status),
    // Digital-only orders do not enter a shipping fulfillment workflow.
    fulfillmentStatus: requiresFulfillment
      ? mapFulfillmentStatus(row.fulfillment_status)
      : "completed",
    paymentMethod: row.payment_method || "none",
    billingAddress: shippingAddress,
    shippingAddress,
    printifyOrderId: row.printify_order_id || undefined,
    timeline: [
      {
        id: `${row.id}-placed`,
        title: "Order placed",
        at: row.placed_at || row.created_at,
      },
    ],
    createdAt: row.placed_at || row.created_at,
  };
}

export async function fetchOrdersFromSupabase(): Promise<{
  ok: boolean;
  orders: Order[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, orders: [], error: "Database is not configured" };
  }

  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("placed_at", { ascending: false });

    if (error) {
      return { ok: false, orders: [], error: error.message };
    }

    const orderRows = (rows || []) as DbOrder[];
    if (!orderRows.length) {
      return { ok: true, orders: [] };
    }

    const ids = orderRows.map((r) => r.id);
    const [{ data: itemRows, error: itemsError }, { data: addrRows }] = await Promise.all([
      supabase.from("order_items").select("*").in("order_id", ids),
      supabase.from("order_addresses").select("*").in("order_id", ids).eq("address_type", "shipping"),
    ]);

    if (itemsError) {
      return { ok: false, orders: [], error: itemsError.message };
    }

    const byOrder = new Map<string, DbOrderItem[]>();
    for (const item of (itemRows || []) as DbOrderItem[]) {
      const list = byOrder.get(item.order_id) || [];
      list.push(item);
      byOrder.set(item.order_id, list);
    }

    const productSlugs = [...new Set(
      ((itemRows || []) as DbOrderItem[])
        .map((item) => item.metadata?.slug)
        .filter((slug): slug is string => Boolean(slug)),
    )];
    const imageBySlug = new Map<string, string>();
    if (productSlugs.length) {
      const { data: products } = await supabase
        .from("products")
        .select("slug, metadata")
        .eq("store_id", storeId)
        .in("slug", productSlugs);
      for (const product of (products || []) as DbProductThumbnail[]) {
        const image = productImage(product.metadata);
        if (image) imageBySlug.set(product.slug, image);
      }
      for (const slug of productSlugs) {
        if (imageBySlug.has(slug)) continue;
        const catalogProduct = Catalog.bySlug(slug);
        const image = catalogProduct?.media.find((media) => media.kind === "image")?.src;
        if (image) imageBySlug.set(slug, image);
      }
    }

    const addrByOrder = new Map<string, DbAddress>();
    for (const addr of (addrRows || []) as DbAddress[]) {
      addrByOrder.set(addr.order_id, addr);
    }

    return {
      ok: true,
      orders: orderRows.map((row) =>
        mapOrder(row, byOrder.get(row.id) || [], addrByOrder.get(row.id) || null, imageBySlug),
      ),
    };
  } catch (err) {
    return {
      ok: false,
      orders: [],
      error: err instanceof Error ? err.message : "Unknown database error",
    };
  }
}

export async function updateOrderStatusInSupabase(
  id: string,
  fulfillmentStatus: OrderStatus,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }

  const statusMap: Record<OrderStatus, string> = {
    pending: "unfulfilled",
    processing: "unfulfilled",
    fulfilled: "fulfilled",
    completed: "fulfilled",
    cancelled: "cancelled",
  };

  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from("orders")
      .update({
        fulfillment_status: statusMap[fulfillmentStatus] || fulfillmentStatus,
        order_status:
          fulfillmentStatus === "cancelled"
            ? "cancelled"
            : fulfillmentStatus === "fulfilled" || fulfillmentStatus === "completed"
              ? "completed"
              : "processing",
      })
      .eq("id", id)
      .eq("store_id", storeId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown database error",
    };
  }
}

export async function deleteOrderInSupabase(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }

  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("orders").delete().eq("id", id).eq("store_id", storeId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown database error",
    };
  }
}

export async function deleteOrdersInSupabase(
  ids: string[],
): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, count: 0, error: "Database is not configured" };
  }
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return { ok: true, count: 0 };

  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const { error, count } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .in("id", unique)
      .eq("store_id", storeId);
    if (error) return { ok: false, count: 0, error: error.message };
    return { ok: true, count: count ?? unique.length };
  } catch (err) {
    return {
      ok: false,
      count: 0,
      error: err instanceof Error ? err.message : "Unknown database error",
    };
  }
}
