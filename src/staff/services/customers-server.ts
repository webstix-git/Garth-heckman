import "server-only";

import { listCustomersFromDb } from "@/lib/catalog-supabase";
import { matchesSearch, paginate, sortByKey } from "@/services/delay";
import type { Customer, CustomerStatus, PaginatedResult } from "@/types";

export interface CustomerListParams {
  search?: string;
  status?: CustomerStatus | "all";
  page?: number;
  pageSize?: number;
  sortBy?: keyof Customer;
  sortDir?: "asc" | "desc";
}

async function loadCustomers(): Promise<Customer[]> {
  const result = await listCustomersFromDb();
  return result.ok ? result.customers : [];
}

export async function listCustomers(
  params: CustomerListParams = {},
): Promise<PaginatedResult<Customer>> {
  const {
    search,
    status = "all",
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortDir = "desc",
  } = params;

  let rows = (await loadCustomers()).filter((c) => {
    const hay = `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`;
    if (!matchesSearch(hay, search)) return false;
    if (status !== "all" && c.status !== status) return false;
    return true;
  });

  rows = sortByKey(rows, sortBy, sortDir);
  return paginate(rows, page, pageSize);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const customers = await loadCustomers();
  return customers.find((c) => c.id === id) ?? null;
}
