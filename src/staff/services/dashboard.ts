"use client";

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

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${url}`);
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}

export async function getDashboardStats(asOf: string): Promise<DashboardStats> {
  return getJson(`/api/store/dashboard?view=stats&asOf=${encodeURIComponent(asOf)}`);
}

export async function getSalesOverview(range: SalesRange): Promise<SalesOverview> {
  const q = new URLSearchParams({
    view: "sales",
    from: range.from,
    to: range.to,
  });
  return getJson(`/api/store/dashboard?${q}`);
}

export async function getOrderStatusOverview(asOf: string): Promise<OrderStatusCount[]> {
  return getJson(`/api/store/dashboard?view=statuses&asOf=${encodeURIComponent(asOf)}`);
}

export async function getRecentOrders(limit = 5, asOf: string): Promise<Order[]> {
  const q = new URLSearchParams({
    view: "recent-orders",
    asOf,
    limit: String(limit),
  });
  return getJson(`/api/store/dashboard?${q}`);
}

export async function getRecentSubmissions(limit = 5, asOf: string): Promise<ContactSubmission[]> {
  const q = new URLSearchParams({
    view: "recent-contacts",
    asOf,
    limit: String(limit),
  });
  return getJson(`/api/store/dashboard?${q}`);
}

export async function getRecentMedia(limit = 8): Promise<MediaAsset[]> {
  const q = new URLSearchParams({
    view: "recent-media",
    limit: String(limit),
  });
  return getJson(`/api/store/dashboard?${q}`);
}

export async function getTopProducts(range: SalesRange): Promise<TopProduct[]> {
  const q = new URLSearchParams({
    view: "top-products",
    from: range.from,
    to: range.to,
  });
  return getJson(`/api/store/dashboard?${q}`);
}
