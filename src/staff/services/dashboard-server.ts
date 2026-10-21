import "server-only";

import { eachDayOfInterval, format, parseISO } from "date-fns";

import { ORDER_STATUSES } from "@/types";
import { countMediaAssets, listMediaAssets } from "@/lib/media-supabase";
import { fetchCustomersCountFromSupabase } from "@/lib/products-supabase";
import { countBlogPosts } from "@/services/blog-server";
import { getOrdersSnapshot as getOrdersFromServer } from "@/services/orders-server";
import { countProducts } from "@/services/products-server";
import { fetchProductSlugIndexFromSupabase } from "@/lib/products-supabase";
import { SALES_MAX_DATE } from "@/lib/sales-dates";
import type {
  ContactSubmission,
  DashboardStats,
  MediaAsset,
  Order,
  OrderStatusCount,
  SalesOverview,
  SalesRange,
  TopProduct,
} from "@/types";

function onOrBefore(iso: string, asOf: string) {
  return iso.slice(0, 10) <= asOf;
}

async function loadOrders(): Promise<Order[]> {
  try {
    return await getOrdersFromServer();
  } catch {
    return [];
  }
}

export async function getDashboardStats(asOf = SALES_MAX_DATE): Promise<DashboardStats> {
  const [productCount, orders, customers, mediaCount, blogPosts] = await Promise.all([
    countProducts(),
    loadOrders(),
    fetchCustomersCountFromSupabase(),
    countMediaAssets(),
    countBlogPosts(),
  ]);

  const filtered = orders.filter((order) => onOrBefore(order.createdAt, asOf));
  const revenue = filtered
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  return {
    products: productCount,
    orders: filtered.length,
    customers,
    blogPosts,
    contactSubmissions: 0,
    media: mediaCount.ok ? mediaCount.count : 0,
    revenue,
  };
}

export async function getRecentMedia(limit = 8): Promise<MediaAsset[]> {
  const result = await listMediaAssets({ limit });
  return result.ok ? result.items : [];
}

export async function getSalesOverview(range: SalesRange): Promise<SalesOverview> {
  const orders = (await loadOrders()).filter((order) => {
    const day = order.createdAt.slice(0, 10);
    return day >= range.from && day <= range.to;
  });

  const days = eachDayOfInterval({
    start: parseISO(`${range.from}T12:00:00`),
    end: parseISO(`${range.to}T12:00:00`),
  });

  const byDay = new Map<string, { orders: number; revenue: number }>();
  for (const day of days) {
    byDay.set(format(day, "yyyy-MM-dd"), { orders: 0, revenue: 0 });
  }

  for (const order of orders) {
    const day = order.createdAt.slice(0, 10);
    const bucket = byDay.get(day);
    if (!bucket) continue;
    bucket.orders += 1;
    if (order.paymentStatus === "paid") bucket.revenue += order.total;
  }

  const points = [...byDay.entries()].map(([date, stats]) => ({
    date,
    orders: stats.orders,
    revenue: Math.round(stats.revenue * 100) / 100,
  }));

  const totals = points.reduce(
    (acc, point) => {
      acc.orders += point.orders;
      acc.revenue += point.revenue;
      return acc;
    },
    { orders: 0, revenue: 0 },
  );

  return {
    range,
    points,
    totals: {
      revenue: Math.round(totals.revenue * 100) / 100,
      orders: totals.orders,
      averageOrder: totals.orders ? Math.round((totals.revenue / totals.orders) * 100) / 100 : 0,
    },
  };
}

export async function getOrderStatusOverview(asOf = SALES_MAX_DATE): Promise<OrderStatusCount[]> {
  const orders = (await loadOrders()).filter((order) => onOrBefore(order.createdAt, asOf));
  const counts = new Map<string, number>();
  for (const order of orders) {
    counts.set(order.fulfillmentStatus, (counts.get(order.fulfillmentStatus) ?? 0) + 1);
  }
  return ORDER_STATUSES.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
}

export async function getRecentOrders(limit = 5, asOf = SALES_MAX_DATE): Promise<Order[]> {
  return [...(await loadOrders())]
    .filter((order) => onOrBefore(order.createdAt, asOf))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getRecentSubmissions(
  _limit = 5,
  _asOf = SALES_MAX_DATE,
): Promise<ContactSubmission[]> {
  // No contact_submissions table in Phase A yet.
  return [];
}

export async function getTopProducts(range: SalesRange): Promise<TopProduct[]> {
  const [ordersSource, slugById] = await Promise.all([
    loadOrders(),
    fetchProductSlugIndexFromSupabase(),
  ]);
  const orders = ordersSource.filter((order) => {
    const day = order.createdAt.slice(0, 10);
    return day >= range.from && day <= range.to && order.paymentStatus === "paid";
  });
  const totals = new Map<string, TopProduct>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = totals.get(item.productId) ?? {
        id: item.productId,
        slug: item.productSlug || slugById.get(item.productId),
        name: item.productName,
        image: item.image ?? "",
        sold: 0,
        revenue: 0,
      };
      if (!current.slug) {
        current.slug = item.productSlug || slugById.get(item.productId);
      }
      current.sold += item.quantity;
      current.revenue += item.quantity * item.unitPrice;
      totals.set(item.productId, current);
    }
  }

  return [...totals.values()]
    .sort((a, b) => b.sold - a.sold || b.revenue - a.revenue)
    .slice(0, 5);
}
