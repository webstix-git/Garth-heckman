"use client";

import type {
  Order,
  OrderStatus,
  PaginatedResult,
  PaymentStatus,
} from "@/types";

export interface OrderListParams {
  search?: string;
  paymentStatus?: PaymentStatus | "all";
  fulfillmentStatus?: OrderStatus | "all";
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  sortBy?: keyof Order;
  sortDir?: "asc" | "desc";
}

function toQuery(params: OrderListParams) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.paymentStatus && params.paymentStatus !== "all") q.set("paymentStatus", params.paymentStatus);
  if (params.fulfillmentStatus && params.fulfillmentStatus !== "all") {
    q.set("fulfillmentStatus", params.fulfillmentStatus);
  }
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.sortBy) q.set("sortBy", String(params.sortBy));
  if (params.sortDir) q.set("sortDir", params.sortDir);
  return q.toString();
}

export async function listOrders(
  params: OrderListParams = {},
): Promise<PaginatedResult<Order>> {
  const res = await fetch(`/api/store/orders?${toQuery(params)}`);
  if (!res.ok) throw new Error("Failed to load orders");
  const json = (await res.json()) as { data: PaginatedResult<Order> };
  return json.data;
}

export async function getOrder(id: string): Promise<Order | null> {
  const res = await fetch(`/api/store/orders/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load order");
  const json = (await res.json()) as { data: Order };
  return json.data;
}

export async function listOrdersByCustomer(customerId: string): Promise<Order[]> {
  const res = await fetch(
    `/api/store/orders?customerId=${encodeURIComponent(customerId)}&pageSize=100`,
  );
  if (!res.ok) throw new Error("Failed to load customer orders");
  const json = (await res.json()) as { data: PaginatedResult<Order> };
  return json.data.items;
}

export async function updateOrderStatus(
  id: string,
  fulfillmentStatus: OrderStatus,
): Promise<Order> {
  const res = await fetch(`/api/store/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fulfillmentStatus }),
  });
  if (!res.ok) throw new Error("Failed to update order");
  const json = (await res.json()) as { data: Order };
  return json.data;
}

export async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`/api/store/orders/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error || "Failed to delete order");
  }
}

export async function deleteOrders(ids: string[]): Promise<number> {
  const res = await fetch(`/api/store/orders`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error || "Failed to delete orders");
  }
  const json = (await res.json()) as { data: { count: number } };
  return json.data.count;
}

export function getOrdersSnapshot() {
  return [] as Order[];
}

export function getOrdersDataSource() {
  return { source: "api" as const, lastError: null as string | null };
}

export type { PaymentStatus };
