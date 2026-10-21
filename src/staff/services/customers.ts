"use client";

import type { Customer, CustomerStatus, PaginatedResult } from "@/types";

export interface CustomerListParams {
  search?: string;
  status?: CustomerStatus | "all";
  page?: number;
  pageSize?: number;
  sortBy?: keyof Customer;
  sortDir?: "asc" | "desc";
}

function toQuery(params: CustomerListParams) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.status && params.status !== "all") q.set("status", params.status);
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.sortBy) q.set("sortBy", String(params.sortBy));
  if (params.sortDir) q.set("sortDir", params.sortDir);
  return q.toString();
}

export async function listCustomers(
  params: CustomerListParams = {},
): Promise<PaginatedResult<Customer>> {
  const res = await fetch(`/api/store/customers?${toQuery(params)}`);
  if (!res.ok) throw new Error("Failed to load customers");
  const json = (await res.json()) as { data: PaginatedResult<Customer> };
  return json.data;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const res = await fetch(`/api/store/customers/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load customer");
  const json = (await res.json()) as { data: Customer };
  return json.data;
}
