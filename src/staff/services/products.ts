"use client";

import type {
  PaginatedResult,
  Product,
  ProductInput,
  ProductStatus,
  ProductType,
} from "@/types";

export interface ProductListParams {
  search?: string;
  status?: ProductStatus | "all";
  type?: ProductType | "all";
  categoryId?: string | "all";
  page?: number;
  pageSize?: number;
  sortBy?: keyof Product;
  sortDir?: "asc" | "desc";
  trash?: boolean;
  fulfillment?: "all" | "printify" | "non_printify";
}

function toQuery(params: ProductListParams) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.status && params.status !== "all") q.set("status", params.status);
  if (params.type && params.type !== "all") q.set("type", params.type);
  if (params.categoryId && params.categoryId !== "all") q.set("categoryId", params.categoryId);
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.sortBy) q.set("sortBy", String(params.sortBy));
  if (params.sortDir) q.set("sortDir", params.sortDir);
  if (params.trash) q.set("trash", "1");
  if (params.fulfillment && params.fulfillment !== "all") q.set("fulfillment", params.fulfillment);
  return q.toString();
}

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || fallback);
  }
  return res.json() as Promise<T>;
}

export async function listProducts(
  params: ProductListParams = {},
): Promise<PaginatedResult<Product>> {
  const res = await fetch(`/api/store/products?${toQuery(params)}`);
  const json = await readJson<{ data: PaginatedResult<Product> }>(res, "Failed to load products");
  return json.data;
}

export async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`/api/store/products/${id}`);
  if (res.status === 404) return null;
  const json = await readJson<{ data: Product }>(res, "Failed to load product");
  return json.data;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const res = await fetch(`/api/store/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await readJson<{ data: Product }>(res, "Failed to create product");
  return json.data;
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  const res = await fetch(`/api/store/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await readJson<{ data: Product }>(res, "Failed to update product");
  return json.data;
}

export async function duplicateProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/store/products/${id}/duplicate`, { method: "POST" });
  const json = await readJson<{ data: Product }>(res, "Failed to duplicate product");
  return json.data;
}

export async function trashProduct(id: string): Promise<void> {
  const res = await fetch(`/api/store/products/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to move product to trash");
  }
}

export async function restoreProduct(id: string): Promise<void> {
  const res = await fetch(`/api/store/products/${id}/restore`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to restore product");
  }
}

export async function permanentlyDeleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/store/products/${id}?permanent=1`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to delete product");
  }
}

/** Move to trash (not permanent delete). */
export async function deleteProduct(id: string): Promise<void> {
  return trashProduct(id);
}

export async function trashProducts(ids: string[]): Promise<number> {
  const res = await fetch(`/api/store/products`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  const json = await readJson<{ data: { count: number } }>(res, "Failed to move products to trash");
  return json.data.count;
}

export async function deleteProducts(ids: string[]): Promise<number> {
  return trashProducts(ids);
}

export async function setProductsStatus(ids: string[], status: ProductStatus) {
  const res = await fetch(`/api/store/products/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, status }),
  });
  const json = await readJson<{ data: { count: number } }>(res, "Failed to update status");
  return json.data.count;
}

export async function bulkUpdateProductStatus(ids: string[], status: ProductStatus) {
  return setProductsStatus(ids, status);
}

export function getProductsDataSource() {
  return { source: "database" as const, lastError: null as string | null };
}

export async function countTrashProducts(): Promise<number> {
  const result = await listProducts({ trash: true, pageSize: 1, page: 1 });
  return result.total;
}

export async function getProductsSnapshot() {
  const page = await listProducts({ page: 1, pageSize: 500 });
  return page.items;
}
