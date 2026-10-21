import "server-only";

import {
  countProductsFromSupabase,
  createProductInSupabase,
  deleteProductInSupabase,
  fetchProductByLookupFromSupabase,
  fetchProductsListPageFromSupabase,
  resolveProductByLookup,
  restoreProductInSupabase,
  trashProductInSupabase,
  updateProductInSupabase,
} from "@/lib/products-supabase";
import { isProtectedCatalogProduct } from "@/lib/catalog-reserved";
import { isSupabaseConfigured } from "@/lib/supabase";
import type {
  PaginatedResult,
  Product,
  ProductInput,
  ProductStatus,
  ProductType,
} from "@/types";

let source: "database" | "empty" = "empty";
let lastError: string | null = null;

function setDataSource(ok: boolean, error?: string) {
  if (!ok) {
    source = "empty";
    lastError = error || "Products query failed";
    return;
  }
  source = "database";
  lastError = null;
}

export function getProductsDataSource() {
  return { source, lastError };
}

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

export async function listProducts(
  params: ProductListParams = {},
): Promise<PaginatedResult<Product>> {
  const {
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortDir = "desc",
    trash = false,
    search,
    status = "all",
    type = "all",
    categoryId = "all",
    fulfillment = "all",
  } = params;

  if (!isSupabaseConfigured()) {
    setDataSource(false, "Database is not configured");
    return { items: [], total: 0, page, pageSize };
  }

  const result = await fetchProductsListPageFromSupabase({
    trash,
    search,
    status,
    type,
    categoryId,
    fulfillment,
    page,
    pageSize,
    sortBy,
    sortDir,
  });

  setDataSource(result.ok, result.error);
  if (!result.ok) {
    return { items: [], total: 0, page, pageSize };
  }

  return {
    items: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}

/** Resolve by storefront slug first, then by id (legacy admin URLs). */
export async function getProduct(lookup: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;
  const result = await fetchProductByLookupFromSupabase(lookup);
  if (!result.ok) return null;
  return result.product ?? null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const result = await createProductInSupabase(input);
  if (!result.ok || !result.product) {
    throw new Error(result.error || "Failed to create product");
  }
  return result.product;
}

export async function updateProduct(
  lookup: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  const existing = await resolveProductByLookup(lookup);
  if (!existing) throw new Error("Product not found");
  const result = await updateProductInSupabase(existing.id, input);
  if (!result.ok || !result.product) {
    throw new Error(result.error || "Failed to update product");
  }
  return result.product;
}

export async function duplicateProduct(lookup: string): Promise<Product> {
  const product = await getProduct(lookup);
  if (!product) throw new Error("Product not found");
  const { id: _id, createdAt: _c, updatedAt: _u, publishedAt: _p, ...rest } = product;
  return createProduct({
    ...rest,
    name: `${product.name} (Copy)`,
    slug: `${product.slug}-copy-${Date.now().toString(36)}`,
    status: "draft",
  });
}

export async function trashProduct(lookup: string): Promise<void> {
  const record = await resolveProductByLookup(lookup);
  if (!record) throw new Error("Product not found");
  if (record.deletedAt) return;
  if (isProtectedCatalogProduct(record)) {
    throw new Error("This catalog product is protected and cannot be deleted");
  }
  const result = await trashProductInSupabase(record.id);
  if (!result.ok) throw new Error(result.error || "Failed to move product to trash");
}

export async function restoreProduct(lookup: string): Promise<void> {
  const record = await resolveProductByLookup(lookup, { trash: true });
  if (!record?.deletedAt) throw new Error("Product not found in trash");
  const result = await restoreProductInSupabase(record.id);
  if (!result.ok) throw new Error(result.error || "Failed to restore product");
}

export async function permanentlyDeleteProduct(lookup: string): Promise<void> {
  const record = await resolveProductByLookup(lookup, { trash: true });
  if (!record?.deletedAt) throw new Error("Product must be in trash before permanent delete");
  if (isProtectedCatalogProduct(record)) {
    throw new Error("This catalog product is protected and cannot be deleted");
  }
  const result = await deleteProductInSupabase(record.id);
  if (!result.ok) throw new Error(result.error || "Failed to delete product");
}

/** @deprecated Use trashProduct — kept as alias for move-to-trash behavior. */
export async function deleteProduct(lookup: string): Promise<void> {
  return trashProduct(lookup);
}

export async function trashProducts(ids: string[]): Promise<number> {
  let count = 0;
  for (const id of ids) {
    try {
      await trashProduct(id);
      count += 1;
    } catch {
      // skip protected / missing
    }
  }
  return count;
}

export async function deleteProducts(ids: string[]): Promise<number> {
  return trashProducts(ids);
}

export async function bulkUpdateProductStatus(
  ids: string[],
  status: ProductStatus,
): Promise<number> {
  let count = 0;
  for (const id of ids) {
    try {
      await updateProduct(id, { status });
      count += 1;
    } catch {
      // skip failures
    }
  }
  return count;
}

export async function setProductsStatus(ids: string[], status: ProductStatus) {
  return bulkUpdateProductStatus(ids, status);
}

export async function getProductsSnapshot() {
  if (!isSupabaseConfigured()) return [];
  const result = await fetchProductsListPageFromSupabase({
    page: 1,
    pageSize: 500,
    sortBy: "updatedAt",
    sortDir: "desc",
  });
  return result.ok ? result.items : [];
}

export async function countProducts(options?: { trash?: boolean }) {
  return countProductsFromSupabase(options);
}
