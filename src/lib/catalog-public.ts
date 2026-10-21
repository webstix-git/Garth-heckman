import "server-only";

import type { Product } from "@/lib/catalog";
import {
  fetchBackendCatalog,
  fetchBackendCategories,
  fetchBackendProductBySlug,
  type BackendCategory,
} from "@/lib/backend-catalog";

/** Published products from the store backend. Empty (never sample data) when the backend is unreachable. */
export async function listStorefrontProducts(): Promise<Product[]> {
  try {
    return await fetchBackendCatalog();
  } catch (error) {
    console.error("[catalog-public] backend catalog failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function listStorefrontCategories(): Promise<BackendCategory[]> {
  try {
    return await fetchBackendCategories();
  } catch (error) {
    console.error("[catalog-public] backend categories failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getStorefrontProduct(slug: string): Promise<Product | null> {
  try {
    return await fetchBackendProductBySlug(slug);
  } catch (error) {
    console.error("[catalog-public] backend product lookup failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
