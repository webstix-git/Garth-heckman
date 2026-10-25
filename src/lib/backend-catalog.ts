import "server-only";

import { CURRENCY, type Fulfillment, type Product, type ProductType } from "@/lib/catalog";

type BackendOptionValue = { label: string; value: string; hex?: string | null };

export type BackendCatalogProduct = {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  price: number;
  compareAt?: number | null;
  pricing?: {
    mode?: string;
    min?: number | null;
    suggested?: number | null;
    max?: number | null;
    presets?: number[];
    presetLabels?: string[];
  } | null;
  type?: string | null;
  fulfillment?: string | null;
  requiresShipping?: boolean;
  trackInventory?: boolean;
  inventoryQty?: number | null;
  allowBackorder?: boolean;
  available?: boolean;
  subtitle?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  isFeatured?: boolean;
  badge?: { label: string; variant?: string | null } | null;
  ctaLabel?: string | null;
  pwywGets?: string[] | null;
  image?: string | null;
  images?: string[];
  categories?: Array<{ id: string; name: string; slug: string }>;
  categorySlugs?: string[];
  collections?: string[];
  tags?: string[];
  options?: Array<{ name: string; type?: string | null; values: BackendOptionValue[] }>;
  variants?: Array<{
    id: string;
    title?: string | null;
    sku?: string | null;
    price: number;
    compareAt?: number | null;
    options?: Record<string, string>;
    inventoryQty?: number | null;
    available?: boolean;
    image?: string | null;
  }>;
  digital?: {
    files?: Array<{ name: string; size?: number | null }>;
    downloadLimit?: number | null;
    expiresAfterDays?: number | null;
  } | null;
  sections?: Array<{ heading?: string | null; body?: string | null }>;
  details?: Array<{ label: string; value: string }>;
  related?: string[];
  seo?: { title?: string | null; description?: string | null; noindex?: boolean } | null;
};

export type BackendCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentSlug: string | null;
  productCount: number;
};

function cents(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return Math.round(Number(value) * 100);
}

function productType(row: BackendCatalogProduct): ProductType {
  if (row.type === "digital") return "digital";
  if ((row.variants?.length ?? 0) > 0) return "variable";
  return "simple";
}

function fulfillment(row: BackendCatalogProduct): Fulfillment {
  if (row.fulfillment === "printify" || row.fulfillment === "download") return row.fulfillment;
  return row.type === "digital" ? "download" : "self";
}

function stock(available: boolean | undefined, quantity: number | null | undefined) {
  if (available === false) return 0;
  return quantity != null ? Math.max(0, quantity) : 0;
}

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/** Maps a backend storefront product (dollars) into the storefront Product shape (cents). */
export function mapBackendProduct(row: BackendCatalogProduct): Product {
  const type = productType(row);
  const pwyw = row.pricing?.mode === "pwyw";
  const compareAt = cents(row.compareAt);
  const images = (
    row.images?.length
      ? row.images
      : row.image
        ? [row.image]
        : []
  ).filter(Boolean);
  const description = row.description?.trim() || "";
  const shortDescription = row.shortDescription?.trim() || "";
  const sections = (row.sections ?? [])
    .map((section) => ({ heading: String(section.heading ?? "").trim(), body: String(section.body ?? "").trim() }))
    .filter((section) => section.heading || section.body);

  return {
    id: row.id,
    sku: row.sku || "",
    slug: row.slug,
    status: "active",
    type,
    fulfillment: fulfillment(row),
    title: row.name,
    subtitle: row.subtitle?.trim() || "",
    categories: row.categorySlugs?.length ? row.categorySlugs : (row.categories ?? []).map((category) => category.slug),
    collections: row.collections ?? [],
    tags: row.tags ?? [],
    badge: row.badge?.label ? { label: row.badge.label, variant: row.badge.variant || "" } : null,
    price: {
      currency: CURRENCY,
      amount: cents(row.price),
      suggested: pwyw ? cents(row.pricing?.suggested) : null,
      min: pwyw ? cents(row.pricing?.min) : null,
      max: pwyw ? cents(row.pricing?.max) : null,
      presets: pwyw ? (row.pricing?.presets ?? []).map((value) => Math.round(value * 100)) : [],
      presetLabels: pwyw ? row.pricing?.presetLabels ?? [] : [],
      compareAt,
      listPrice: compareAt,
    },
    media: images.map((src, index) => ({
      kind: "image",
      variant: "default",
      ratio: "1-1",
      label: index === 0 ? row.name : `${row.name} image ${index + 1}`,
      note: "",
      src,
    })),
    descriptionShort: shortDescription || plainText(description).slice(0, 180),
    descriptionLong: description ? [description] : [],
    details: row.details ?? [],
    options: (row.options ?? []).map((option) => ({
      name: option.name,
      type: option.type || "button",
      values: option.values.map((value) => ({ label: value.label, value: value.value, ...(value.hex ? { hex: value.hex } : {}) })),
    })),
    variants: (row.variants ?? []).map((variant) => ({
      id: variant.id,
      sku: variant.sku || "",
      options: variant.options ?? {},
      price: cents(variant.price) ?? 0,
      compareAt: cents(variant.compareAt),
      inventory: stock(variant.available, row.trackInventory ? variant.inventoryQty : null),
      ...(variant.image ? { image: variant.image } : {}),
      status: "active",
    })),
    inventory: {
      tracked: Boolean(row.trackInventory),
      quantity: row.trackInventory ? row.inventoryQty ?? 0 : null,
      allowBackorder: Boolean(row.allowBackorder),
    },
    shipping: { required: row.requiresShipping !== false && type !== "digital" },
    digital: row.digital?.files?.length
      ? {
          files: row.digital.files.map((file) => ({
            name: file.name,
            sizeMb: file.size != null ? Math.round((file.size / (1024 * 1024)) * 10) / 10 : null,
          })),
          ...(row.digital.downloadLimit != null ? { downloadLimit: row.digital.downloadLimit } : {}),
          ...(row.digital.expiresAfterDays != null ? { expiryDays: row.digital.expiresAfterDays } : {}),
        }
      : null,
    related: row.related ?? [],
    seo: {
      title: row.seo?.title || row.name,
      description: row.seo?.description || shortDescription || plainText(description).slice(0, 160),
      noindex: Boolean(row.seo?.noindex),
    },
    ...(sections.length ? { contentSections: sections } : {}),
    ...(row.pwywGets?.length ? { pwywGets: row.pwywGets } : {}),
    ...(row.ctaLabel ? { ctaLabel: row.ctaLabel } : {}),
  };
}

/** Server-only backend connection. The store key never ships to the browser. */
export function getBackendCatalogConfig() {
  const backendUrl = String(process.env.BACKEND_URL || "").trim().replace(/\/$/, "");
  const storeKey = String(process.env.STORE_API_KEY || "").trim();
  return { backendUrl, storeKey, configured: Boolean(backendUrl && storeKey) };
}

export class BackendError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

/** Calls a backend storefront endpoint with the store key attached. */
export async function backendFetch<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown; clientIp?: string | null; headers?: Record<string, string> }): Promise<T> {
  const { backendUrl, storeKey, configured } = getBackendCatalogConfig();
  if (!configured) throw new BackendError("The store backend is not configured.", 503);
  const response = await fetch(`${backendUrl}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      ...init?.headers,
      "X-Store-Key": storeKey,
      ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(init?.clientIp ? { "X-Forwarded-For": init.clientIp } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!response.ok) throw new BackendError(payload.error || `Store request failed (${response.status})`, response.status, payload.code);
  return payload;
}

export async function fetchBackendCatalog(): Promise<Product[]> {
  const payload = await backendFetch<{ products?: BackendCatalogProduct[] }>("/api/storefront/catalog?limit=200");
  return (payload.products ?? []).map(mapBackendProduct);
}

export async function fetchBackendProductBySlug(slug: string): Promise<Product | null> {
  try {
    const payload = await backendFetch<{ product?: BackendCatalogProduct }>(`/api/storefront/products/${encodeURIComponent(slug)}`);
    return payload.product ? mapBackendProduct(payload.product) : null;
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchBackendCategories(): Promise<BackendCategory[]> {
  const payload = await backendFetch<{ categories?: BackendCategory[] }>("/api/storefront/categories");
  return payload.categories ?? [];
}
