/**
 * Legacy helpers kept for admin delete guards.
 * There is no static storefront catalog anymore — products come from the database.
 */

/** @deprecated Empty — static catalog removed. */
export const RESERVED_CATALOG_SLUGS = [] as const;

export type ReservedCatalogSlug = string;

/** Seeded core product UUIDs from historical Garth SQL seeds (optional delete protection). */
export const SEEDED_PRODUCT_IDS = [
  "f1000000-0000-4000-8000-000000000001",
  "f1000000-0000-4000-8000-000000000002",
  "f1000000-0000-4000-8000-000000000003",
  "f1000000-0000-4000-8000-000000000004",
  "f1000000-0000-4000-8000-000000000005",
  "f1000000-0000-4000-8000-000000000006",
  "f1000000-0000-4000-8000-000000000007",
] as const;

const SEEDED_ID_SET = new Set<string>(SEEDED_PRODUCT_IDS);

export function isReservedCatalogSlug(_slug: string): boolean {
  return false;
}

export function isSeededProductId(id: string): boolean {
  return SEEDED_ID_SET.has(id);
}

/** Protected from delete in admin: historical seed rows only. */
export function isProtectedCatalogProduct(product: { id: string; slug: string }): boolean {
  return isSeededProductId(product.id);
}
