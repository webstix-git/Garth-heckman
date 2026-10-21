import "server-only";

import { listStorefrontProducts } from "@/lib/catalog-public";
import type { Product } from "@/lib/catalog";
import { fetchStoreSettings } from "@/lib/settings-supabase";
import { isPayWhatYouWantPrice } from "@/lib/pay-what-you-want";

/**
 * The product for a spotlight slot: the one picked in site settings when it is still for sale,
 * otherwise the first pay-what-you-want product in the backend's "featured" collection.
 */
async function spotlight(pickedId: string | null | undefined, list?: Product[]): Promise<Product | null> {
  const products = list ?? (await listStorefrontProducts());
  const picked = pickedId ? products.find((p) => p.id === pickedId) : undefined;
  if (picked) return picked;
  const featured = products.filter((p) => p.collections.includes("featured"));
  return featured.find((p) => isPayWhatYouWantPrice(p.price)) ?? featured[0] ?? null;
}

export async function getHomeSpotlightProduct(products?: Product[]): Promise<Product | null> {
  const { settings } = await fetchStoreSettings().catch(() => ({ settings: null }));
  return spotlight(settings?.storefront?.homeSpotlightProductId, products);
}

export async function getStoreSpotlightProduct(products?: Product[]): Promise<Product | null> {
  const { settings } = await fetchStoreSettings().catch(() => ({ settings: null }));
  return spotlight(settings?.storefront?.storeSpotlightProductId, products);
}
