import "server-only";

import { fetchOrdersFromSupabase, updateOrderStatusInSupabase, deleteOrderInSupabase, deleteOrdersInSupabase } from "@/lib/orders-supabase";
import { isSupabaseConfigured } from "@/lib/supabase";
import { matchesSearch, paginate, sortByKey } from "@/services/delay";
import type {
  Order,
  OrderStatus,
  PaginatedResult,
  PaymentStatus,
} from "@/types";

let source: "database" | "empty" = "empty";
let lastError: string | null = null;

async function loadOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) {
    source = "empty";
    lastError = "Database is not configured";
    return [];
  }

  const result = await fetchOrdersFromSupabase();
  if (!result.ok) {
    source = "empty";
    lastError = result.error || "Orders query failed";
    return [];
  }

  source = "database";
  lastError = null;
  return result.orders;
}

export function getOrdersDataSource() {
  return { source, lastError };
}

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

export async function listOrders(
  params: OrderListParams = {},
): Promise<PaginatedResult<Order>> {
  const {
    search,
    paymentStatus = "all",
    fulfillmentStatus = "all",
    from,
    to,
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortDir = "desc",
  } = params;

  const orders = await loadOrders();

  let rows = orders.filter((o) => {
    const hay = `${o.number} ${o.customerName} ${o.customerEmail}`;
    if (!matchesSearch(hay, search)) return false;
    if (paymentStatus !== "all" && o.paymentStatus !== paymentStatus) return false;
    if (fulfillmentStatus !== "all" && o.fulfillmentStatus !== fulfillmentStatus)
      return false;
    if (from && o.createdAt < from) return false;
    if (to && o.createdAt > `${to}T23:59:59.999Z`) return false;
    return true;
  });

  rows = sortByKey(rows, sortBy, sortDir);
  return paginate(rows, page, pageSize);
}

export async function getOrder(id: string): Promise<Order | null> {
  const orders = await loadOrders();
  return orders.find((o) => o.id === id) ?? null;
}

export async function listOrdersByCustomer(customerId: string): Promise<Order[]> {
  const orders = await loadOrders();
  return orders
    .filter((o) => o.customerId === customerId || o.customerEmail === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateOrderStatus(
  id: string,
  fulfillmentStatus: OrderStatus,
): Promise<Order> {
  const updated = await updateOrderStatusInSupabase(id, fulfillmentStatus);
  if (!updated.ok) {
    throw new Error(updated.error || "Failed to update order status");
  }
  const order = await getOrder(id);
  if (!order) throw new Error("Order not found");
  return { ...order, fulfillmentStatus };
}

export async function deleteOrder(id: string): Promise<void> {
  const existing = await getOrder(id);
  if (!existing) throw new Error("Order not found");
  const result = await deleteOrderInSupabase(id);
  if (!result.ok) {
    throw new Error(result.error || "Failed to delete order");
  }
}

export async function deleteOrders(ids: string[]): Promise<number> {
  const result = await deleteOrdersInSupabase(ids);
  if (!result.ok) {
    throw new Error(result.error || "Failed to delete orders");
  }
  return result.count;
}

export async function getOrdersSnapshot() {
  return loadOrders();
}
