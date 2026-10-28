import "server-only";

import type { Product, ProductInput, ProductStatus, ProductType } from "@/types";
import {
  normalizeProductType,
  productFulfillment,
  productRequiresShipping,
  productTracksInventory,
  defaultProductInventory,
  stockStatusFromDbRow,
  allowBackorderFromDbRow,
} from "@/types";
import { applyTrashFilter, hasTrashColumn, purgeExpiredCatalogTrash } from "@/lib/catalog-trash";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

import { getStoreId } from "@/lib/store-id";
import { getCurrentAdminStoreId } from "@/lib/current-admin-store";
import {
  applyStorefrontPricing,
  resolveAdminCategorySlug,
} from "@/lib/catalog-bridge";
import {
  loadProductVariantMatrix,
  syncProductVariantMatrix,
} from "@/lib/product-variants-supabase";
import {
  contentSectionsFromProductRecord,
  detailsRowsFromDetailsBody,
} from "@/lib/product-content-sections";

export const GARTH_STORE_ID = getStoreId();

type DbProduct = {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  product_type: string;
  status: string;
  description: string | null;
  short_description: string | null;
  sku: string | null;
  price_cents: number | null;
  pwyw_min_cents: number | null;
  pwyw_suggested_cents: number | null;
  is_featured: boolean;
  fulfillment?: string | null;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
  seo_title: string | null;
  seo_description: string | null;
  track_inventory?: boolean | null;
  inventory_qty?: number | null;
  allow_backorder?: boolean | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

function centsToDollars(cents: number | null | undefined) {
  if (cents == null) return 0;
  return Math.round(cents) / 100;
}

function dollarsToCents(dollars: number | null | undefined) {
  if (dollars == null || Number.isNaN(dollars)) return null;
  return Math.round(dollars * 100);
}

function mapStatusToAdmin(status: string): ProductStatus {
  if (status === "draft" || status === "coming-soon") return "draft";
  if (status === "archived") return "archived";
  return "active";
}

function mapStatusToDb(status: ProductStatus): string {
  if (status === "draft") return "draft";
  if (status === "archived") return "archived";
  return "active";
}

function mapTypeToAdmin(row: DbProduct): ProductType {
  const metaType = row.metadata?.admin_type;
  if (typeof metaType === "string") {
    return normalizeProductType(metaType);
  }
  return normalizeProductType(row.product_type);
}

function mapProduct(row: DbProduct, categoryIdOverride?: string): Product {
  const type = mapTypeToAdmin(row);
  const donation =
    row.pwyw_suggested_cents != null ||
    row.pwyw_min_cents != null ||
    row.product_type === "pwyw";
  const price = donation
    ? centsToDollars(row.pwyw_suggested_cents ?? row.pwyw_min_cents ?? row.price_cents)
    : centsToDollars(row.price_cents);

  const images = Array.isArray(row.metadata?.images)
    ? (row.metadata!.images as string[]).filter((s) => typeof s === "string")
    : [];

  const externalUrl =
    typeof row.metadata?.externalUrl === "string" ? row.metadata.externalUrl : undefined;

  const contentSections = contentSectionsFromProductRecord({
    description: row.description,
    type,
    metadata: row.metadata,
  });

  const attributes = Array.isArray(row.metadata?.attributes)
    ? (row.metadata!.attributes as Product["attributes"])
    : undefined;
  const sizes = Array.isArray(row.metadata?.sizes)
    ? (row.metadata!.sizes as string[]).filter((s) => typeof s === "string")
    : undefined;
  const colors = Array.isArray(row.metadata?.colors)
    ? (row.metadata!.colors as string[]).filter((s) => typeof s === "string")
    : undefined;
  const variants = Array.isArray(row.metadata?.variants)
    ? (row.metadata!.variants as Product["variants"])
    : undefined;

  const metaCategoryId =
    typeof row.metadata?.categoryId === "string" ? row.metadata.categoryId : "uncategorized";

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type,
    description: row.description || "",
    shortDescription: row.short_description || "",
    price,
    sku: row.sku || "",
    status: mapStatusToAdmin(row.status),
    categoryId: categoryIdOverride || metaCategoryId,
    featured: Boolean(row.is_featured),
    images,
    seo: {
      title: row.seo_title || row.name,
      description: row.seo_description || row.short_description || "",
      noindex: Boolean(row.metadata?.seoNoindex),
      nofollow: Boolean(row.metadata?.seoNofollow),
    },
    contentSections,
    attributes,
    sizes,
    colors,
    variants,
    hasVariants:
      Boolean(row.metadata?.hasVariants) ||
      Boolean(attributes?.some((attribute) => attribute.values.length)) ||
      Boolean(variants?.length),
    payWhatYouWant: donation
      ? {
          enabled: true,
          suggestedAmount: centsToDollars(row.pwyw_suggested_cents ?? row.price_cents),
          minimumAmount: centsToDollars(row.pwyw_min_cents),
        }
      : undefined,
    externalUrl,
    inventory: defaultProductInventory(type, {
      barcode: readBarcode(row.metadata),
      trackInventory: row.track_inventory ?? productTracksInventory(type),
      quantity: row.inventory_qty ?? null,
      stockStatus: stockStatusFromDbRow(row),
      allowBackorder: allowBackorderFromDbRow(row),
      soldIndividually: Boolean(row.metadata?.soldIndividually),
    }),
    publishedAt: row.published_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

function readBarcode(metadata?: Record<string, unknown> | null): string {
  if (typeof metadata?.barcode === "string") return metadata.barcode;
  if (typeof metadata?.gtin === "string") return metadata.gtin;
  return "";
}

async function withVariantMatrix(product: Product, storeId = GARTH_STORE_ID): Promise<Product> {
  if (!product.hasVariants) return product;
  const matrix = await loadProductVariantMatrix(product.id, storeId);
  if (!matrix.attributes.length && !matrix.variants.length) {
    // Fall back to metadata-only drafts until first relational sync.
    return product;
  }
  return {
    ...product,
    attributes: matrix.attributes.length ? matrix.attributes : product.attributes,
    variants: matrix.variants.length ? matrix.variants : product.variants,
    sizes: matrix.attributes.find((a) => a.name.toLowerCase() === "size")?.values ?? product.sizes,
    colors:
      matrix.attributes.find((a) => a.name.toLowerCase() === "color")?.values ?? product.colors,
  };
}

async function persistVariantMatrix(
  productId: string,
  input: ProductInput | Partial<ProductInput>,
  type: ProductType,
): Promise<{ ok: boolean; error?: string }> {
  // A partial update unrelated to variants must leave the existing matrix alone.
  if (
    input.hasVariants === undefined &&
    input.attributes === undefined &&
    input.variants === undefined
  ) {
    return { ok: true };
  }

  const hasVariants =
    input.hasVariants ??
    Boolean(input.attributes?.some((attribute) => attribute.values.length) || input.variants?.length);

  if (!hasVariants) {
    return syncProductVariantMatrix({
      productId,
      type,
      hasVariants: false,
      baseSku: input.sku || "",
      basePrice: input.price ?? 0,
      attributes: [],
      variants: [],
    });
  }
  if (input.attributes === undefined && input.variants === undefined) {
    return { ok: true };
  }
  return syncProductVariantMatrix({
    productId,
    type,
    hasVariants: true,
    baseSku: input.sku || "",
    basePrice: input.price ?? 0,
    attributes: input.attributes,
    variants: input.variants,
  });
}

type CategoryRow = { id: string; slug: string };

async function loadCategoryLookup(supabase: ReturnType<typeof createSupabaseAdmin>, storeId: string): Promise<{
  byId: Map<string, CategoryRow>;
  bySlug: Map<string, CategoryRow>;
}> {
  const trashSupported = await hasTrashColumn("categories");
  let query = supabase
    .from("categories")
    .select("id, slug")
    .eq("store_id", storeId);
  query = applyTrashFilter(query, false, trashSupported);
  const { data } = await query;
  const byId = new Map<string, CategoryRow>();
  const bySlug = new Map<string, CategoryRow>();
  for (const row of (data || []) as CategoryRow[]) {
    byId.set(row.id, row);
    bySlug.set(row.slug, row);
  }
  return { byId, bySlug };
}

function resolveCategoryIdForProduct(
  product: Product,
  joinCategoryId: string | undefined,
  byId: Map<string, CategoryRow>,
  bySlug: Map<string, CategoryRow>,
): string {
  if (product.categoryId && byId.has(product.categoryId)) {
    return product.categoryId;
  }
  if (product.categoryId && bySlug.has(product.categoryId)) {
    return bySlug.get(product.categoryId)!.id;
  }
  if (joinCategoryId && byId.has(joinCategoryId)) {
    return joinCategoryId;
  }
  const slug = resolveAdminCategorySlug(product);
  return bySlug.get(slug)?.id || product.categoryId || "uncategorized";
}

/** Persist resolved categoryId into metadata + product_categories when missing/wrong. */
async function persistResolvedCategories(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  rows: DbProduct[],
  resolved: Map<string, string>,
): Promise<void> {
  for (const row of rows) {
    const categoryId = resolved.get(row.id);
    if (!categoryId || categoryId === "uncategorized") continue;
    const current =
      typeof row.metadata?.categoryId === "string" ? row.metadata.categoryId : null;
    if (current === categoryId) {
      // Still ensure join row exists
      await supabase.from("product_categories").upsert(
        { product_id: row.id, category_id: categoryId, position: 0 },
        { onConflict: "product_id,category_id" },
      );
      continue;
    }
    await supabase
      .from("products")
      .update({
        metadata: { ...(row.metadata || {}), categoryId },
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("store_id", GARTH_STORE_ID);
    await supabase.from("product_categories").delete().eq("product_id", row.id);
    await supabase.from("product_categories").insert({
      product_id: row.id,
      category_id: categoryId,
      position: 0,
    });
  }
}

function toDbPayload(input: ProductInput | Partial<ProductInput>, existing?: DbProduct) {
  const type = normalizeProductType(input.type ?? mapTypeToAdmin(existing!));
  const status = (input.status ?? mapStatusToAdmin(existing?.status || "draft")) as ProductStatus;
  const name = input.name ?? existing?.name ?? "Untitled";
  const slug = input.slug ?? existing?.slug ?? `product-${Date.now()}`;
  const price = input.price ?? centsToDollars(existing?.price_cents);
  const pwyw = input.payWhatYouWant;
  const images = input.images ?? (Array.isArray(existing?.metadata?.images) ? existing!.metadata!.images : []);
  const externalUrl =
    input.externalUrl ??
    (typeof existing?.metadata?.externalUrl === "string" ? existing.metadata.externalUrl : undefined);
  const contentSections =
    input.contentSections ??
    (Array.isArray(existing?.metadata?.contentSections)
      ? existing!.metadata!.contentSections
      : undefined);

  const attributes = (
    input.attributes ??
    (Array.isArray(existing?.metadata?.attributes) ? existing!.metadata!.attributes : undefined)
  ) as Product["attributes"] | undefined;
  const sizes = (
    input.sizes ??
    (Array.isArray(existing?.metadata?.sizes) ? existing!.metadata!.sizes : undefined)
  ) as string[] | undefined;
  const colors = (
    input.colors ??
    (Array.isArray(existing?.metadata?.colors) ? existing!.metadata!.colors : undefined)
  ) as string[] | undefined;
  const variants = (
    input.variants ??
    (Array.isArray(existing?.metadata?.variants) ? existing!.metadata!.variants : undefined)
  ) as Product["variants"] | undefined;

  const inventoryInput = input.inventory;
  const inventory = defaultProductInventory(type, {
    barcode:
      inventoryInput?.barcode ??
      readBarcode(existing?.metadata),
    trackInventory:
      inventoryInput?.trackInventory ??
      existing?.track_inventory ??
      productTracksInventory(type),
    quantity:
      inventoryInput?.quantity !== undefined
        ? inventoryInput.quantity
        : (existing?.inventory_qty ?? null),
    stockStatus:
      inventoryInput?.stockStatus ??
      stockStatusFromDbRow(existing || {}),
    allowBackorder:
      inventoryInput?.allowBackorder ??
      allowBackorderFromDbRow(existing || {}),
    soldIndividually:
      inventoryInput?.soldIndividually ??
      Boolean(existing?.metadata?.soldIndividually),
  });

  const normalizedSections = Array.isArray(contentSections)
    ? contentSections
        .map((section) => ({
          heading: String(section?.heading || "").trim(),
          body: String(section?.body || "").trim(),
        }))
        .filter((section) => section.heading || section.body)
        .slice(0, 5)
    : [];
  const detailsSection = normalizedSections.find(
    (section) => section.heading.toLowerCase() === "details",
  );
  const detailsFromEditor = detailsSection
    ? detailsRowsFromDetailsBody(detailsSection.body)
    : [];
  const existingDetails = Array.isArray(existing?.metadata?.details)
    ? (existing!.metadata!.details as Array<{ label?: string; value?: string }>)
        .map((row) => ({
          label: String(row?.label || "").trim(),
          value: String(row?.value || "").trim(),
        }))
        .filter((row) => row.label && row.value && row.label.toLowerCase() !== "sku")
    : [];

  const metadata = {
    ...(existing?.metadata || {}),
    admin_type: type,
    hasVariants: Boolean(
      input.hasVariants ??
        existing?.metadata?.hasVariants ??
        (Array.isArray(attributes) && attributes.some((attribute) => attribute.values.length)) ??
        (Array.isArray(variants) && variants.length),
    ),
    categoryId: input.categoryId ?? existing?.metadata?.categoryId ?? "uncategorized",
    images,
    contentSections: normalizedSections,
    // Keep Render admin + storefront auto-build in sync with the same copy.
    productPageSections: normalizedSections.map((section) => ({
      title: section.heading,
      content: section.body,
    })),
    details: detailsFromEditor.length ? detailsFromEditor : existingDetails,
    attributes: Array.isArray(attributes)
      ? attributes
          .map((attr) => ({
            name: String(attr?.name || "").trim(),
            values: Array.isArray(attr?.values)
              ? attr.values.map((v) => String(v).trim()).filter(Boolean)
              : [],
          }))
          .filter((attr) => attr.name || attr.values.length)
      : [],
    sizes: Array.isArray(sizes) ? sizes.map((s) => String(s).trim()).filter(Boolean) : [],
    colors: Array.isArray(colors) ? colors.map((s) => String(s).trim()).filter(Boolean) : [],
    variants: Array.isArray(variants) ? variants : [],
    ...(externalUrl ? { externalUrl } : { externalUrl: undefined }),
    barcode: inventory.barcode?.trim() || undefined,
    stockStatus: inventory.stockStatus,
    allowBackorder: inventory.allowBackorder,
    soldIndividually: inventory.soldIndividually,
    seoNoindex: Boolean(input.seo?.noindex ?? existing?.metadata?.seoNoindex),
    seoNofollow: Boolean(input.seo?.nofollow ?? existing?.metadata?.seoNofollow),
  };

  const priceCents = dollarsToCents(price);
  const pwywEnabled = Boolean(pwyw?.enabled);
  const trackInventory = inventory.trackInventory;
  const allowBackorder = inventory.allowBackorder;
  let inventoryQty = inventory.quantity;
  if (inventory.stockStatus === "out_of_stock" && trackInventory) {
    inventoryQty = 0;
  }

  return {
    store_id: GARTH_STORE_ID,
    name,
    slug,
    product_type: type,
    status: mapStatusToDb(status),
    description: input.description ?? existing?.description ?? "",
    short_description: input.shortDescription ?? existing?.short_description ?? "",
    sku: input.sku ?? existing?.sku ?? null,
    price_cents: priceCents,
    pwyw_min_cents: pwywEnabled ? dollarsToCents(pwyw?.minimumAmount ?? price) : null,
    pwyw_suggested_cents: pwywEnabled
      ? dollarsToCents(pwyw?.suggestedAmount ?? price)
      : null,
    is_featured: input.featured ?? existing?.is_featured ?? false,
    requires_shipping: productRequiresShipping(type),
    fulfillment: existing?.fulfillment === "printify" ? "printify" : productFulfillment(type),
    track_inventory: trackInventory,
    inventory_qty: trackInventory ? inventoryQty : null,
    allow_backorder: allowBackorder,
    published_at:
      status === "active"
        ? existing?.published_at || new Date().toISOString()
        : existing?.published_at ?? null,
    metadata,
    seo_title: input.seo?.title ?? existing?.seo_title ?? name,
    seo_description: input.seo?.description ?? existing?.seo_description ?? "",
    updated_at: new Date().toISOString(),
  };
}

function mapSortColumn(sortBy: keyof Product): string {
  switch (sortBy) {
    case "name":
      return "name";
    case "sku":
      return "sku";
    case "status":
      return "status";
    case "updatedAt":
      return "updated_at";
    case "price":
      return "price_cents";
    case "createdAt":
    default:
      return "created_at";
  }
}

function escapeIlike(value: string) {
  return value.replace(/[%_,]/g, "\\$&");
}

async function loadJoinsForProducts(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  productIds: string[],
): Promise<Map<string, string>> {
  const joinByProduct = new Map<string, string>();
  if (!productIds.length) return joinByProduct;
  const { data } = await supabase
    .from("product_categories")
    .select("product_id, category_id")
    .in("product_id", productIds);
  for (const join of data || []) {
    if (!joinByProduct.has(join.product_id)) {
      joinByProduct.set(join.product_id, join.category_id);
    }
  }
  return joinByProduct;
}

function mapRowsToListProducts(
  rows: DbProduct[],
  joinByProduct: Map<string, string>,
  byId: Map<string, CategoryRow>,
  bySlug: Map<string, CategoryRow>,
): Product[] {
  return rows.map((row) => {
    const base = mapProduct(row);
    const categoryId = resolveCategoryIdForProduct(
      base,
      joinByProduct.get(row.id),
      byId,
      bySlug,
    );
    return applyStorefrontPricing(mapProduct(row, categoryId));
  });
}

async function loadDigitalFilesForProduct(
  productId: string,
  storeId: string,
): Promise<Array<{ name: string; sizeMb: number | null }>> {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("digital_assets")
    .select("file_label,storage_path")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .order("created_at");
  return (data ?? []).map((row) => {
    const name =
      String(row.file_label || "").trim() ||
      String(row.storage_path || "").split("/").pop() ||
      "Download";
    return { name, sizeMb: null };
  });
}

async function hydrateProductRow(row: DbProduct, storeId: string): Promise<Product> {
  const supabase = createSupabaseAdmin();
  const [{ byId, bySlug }, joinByProduct, digitalFiles] = await Promise.all([
    loadCategoryLookup(supabase, storeId),
    loadJoinsForProducts(supabase, [row.id]),
    loadDigitalFilesForProduct(row.id, storeId),
  ]);
  const categoryId = resolveCategoryIdForProduct(
    mapProduct(row),
    joinByProduct.get(row.id),
    byId,
    bySlug,
  );
  const mapped = mapProduct(row, categoryId);
  const product = applyStorefrontPricing({
    ...mapped,
    // Rebuild with file names so Download & access matches the storefront.
    contentSections: contentSectionsFromProductRecord({
      description: row.description,
      type: mapped.type,
      metadata: row.metadata,
      digitalFiles,
    }),
  });
  return withVariantMatrix(product, storeId);
}

export type ProductListQuery = {
  trash?: boolean;
  search?: string;
  status?: ProductStatus | "all";
  type?: ProductType | "all";
  categoryId?: string | "all";
  page?: number;
  pageSize?: number;
  sortBy?: keyof Product;
  sortDir?: "asc" | "desc";
  fulfillment?: "all" | "printify" | "non_printify";
};

export async function countProductsFromSupabase(options?: {
  trash?: boolean;
}): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const storeId = await getCurrentAdminStoreId();
  const supabase = createSupabaseAdmin();
  const trash = Boolean(options?.trash);
  const trashSupported = await hasTrashColumn("products");
  if (trash && !trashSupported) return 0;
  let query = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId);
  query = applyTrashFilter(query, trash, trashSupported);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

export async function fetchProductSlugIndexFromSupabase(): Promise<Map<string, string>> {
  if (!isSupabaseConfigured()) return new Map();
  const storeId = await getCurrentAdminStoreId();
  const supabase = createSupabaseAdmin();
  const trashSupported = await hasTrashColumn("products");
  let query = supabase
    .from("products")
    .select("id, slug")
    .eq("store_id", storeId);
  query = applyTrashFilter(query, false, trashSupported);
  const { data } = await query;
  return new Map((data || []).map((row) => [row.id as string, row.slug as string]));
}

export async function resolveProductByLookup(
  lookup: string,
  options?: { trash?: boolean },
): Promise<{ id: string; slug: string; deletedAt: string | null } | null> {
  if (!isSupabaseConfigured()) return null;
  const storeId = await getCurrentAdminStoreId();
  const supabase = createSupabaseAdmin();
  const trash = Boolean(options?.trash);
  const trashSupported = await hasTrashColumn("products");
  if (trash && !trashSupported) return null;
  const base = () => {
    const query = supabase
      .from("products")
      .select(trashSupported ? "id, slug, deleted_at" : "id, slug")
      .eq("store_id", storeId);
    return applyTrashFilter(query, trash, trashSupported);
  };
  const { data: bySlug } = await base().eq("slug", lookup).maybeSingle();
  const row = (bySlug ?? (await base().eq("id", lookup).maybeSingle()).data) as unknown as
    | { id: string; slug: string; deleted_at?: string | null }
    | null;
  if (!row) return null;
  return {
    id: row.id as string,
    slug: row.slug as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

export async function fetchProductByLookupFromSupabase(
  lookup: string,
): Promise<{ ok: boolean; product?: Product; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("products");
    let activeQuery = supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId);
    activeQuery = applyTrashFilter(activeQuery, false, trashSupported);
    const { data: bySlug, error: slugError } = await activeQuery.eq("slug", lookup).maybeSingle();
    if (slugError) return { ok: false, error: slugError.message };
    let row = bySlug as DbProduct | null;
    if (!row) {
      let idQuery = supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId);
      idQuery = applyTrashFilter(idQuery, false, trashSupported);
      const { data: byId, error: idError } = await idQuery.eq("id", lookup).maybeSingle();
      if (idError) return { ok: false, error: idError.message };
      row = byId as DbProduct | null;
    }
    if (!row) {
      return { ok: true, product: undefined };
    }
    const product = await hydrateProductRow(row, storeId);
    const resolved = new Map<string, string>([[row.id, product.categoryId]]);
    await persistResolvedCategories(supabase, [row], resolved);
    return { ok: true, product };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Product fetch failed",
    };
  }
}

export async function fetchProductsListPageFromSupabase(
  params: ProductListQuery = {},
): Promise<{
  ok: boolean;
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, items: [], total: 0, page: 1, pageSize: 10, error: "Database is not configured" };
  }
  try {
    const storeId = await getCurrentAdminStoreId();
    if (params.trash) {
      await purgeExpiredCatalogTrash();
    }
    const supabase = createSupabaseAdmin();
    const trash = Boolean(params.trash);
    const trashSupported = await hasTrashColumn("products");
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, Math.min(params.pageSize ?? 10, 100));
    if (trash && !trashSupported) {
      return { ok: true, items: [], total: 0, page, pageSize };
    }
    const sortBy = params.sortBy ?? "createdAt";
    const sortDir = params.sortDir ?? "desc";
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let categoryProductIds: string[] | null = null;
    if (params.categoryId && params.categoryId !== "all") {
      const { data: joins } = await supabase
        .from("product_categories")
        .select("product_id")
        .eq("category_id", params.categoryId);
      categoryProductIds = (joins || []).map((row) => row.product_id as string);
      if (!categoryProductIds.length) {
        return { ok: true, items: [], total: 0, page, pageSize };
      }
    }

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("store_id", storeId);
    query = applyTrashFilter(query, trash, trashSupported);

    if (params.status && params.status !== "all") {
      query = query.eq("status", mapStatusToDb(params.status));
    }
    if (params.type && params.type !== "all") {
      query = query.eq("product_type", params.type);
    }
    if (categoryProductIds) {
      query = query.in("id", categoryProductIds);
    }
    if (params.fulfillment === "printify") {
      query = query.eq("fulfillment", "printify");
    } else if (params.fulfillment === "non_printify") {
      query = query.or("fulfillment.is.null,fulfillment.neq.printify");
    }
    if (params.search?.trim()) {
      const term = escapeIlike(params.search.trim());
      query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,slug.ilike.%${term}%`);
    }

    query = query
      .order(mapSortColumn(sortBy), { ascending: sortDir === "asc" })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) {
      return { ok: false, items: [], total: 0, page, pageSize, error: error.message };
    }

    const rows = (data || []) as DbProduct[];
    const productIds = rows.map((row) => row.id);
    const [{ byId, bySlug }, joinByProduct] = await Promise.all([
      loadCategoryLookup(supabase, storeId),
      loadJoinsForProducts(supabase, productIds),
    ]);

    let items = mapRowsToListProducts(rows, joinByProduct, byId, bySlug);
    if (params.type && params.type !== "all") {
      items = items.filter((product) => product.type === params.type);
    }

    return {
      ok: true,
      items,
      total: count ?? items.length,
      page,
      pageSize,
    };
  } catch (err) {
    return {
      ok: false,
      items: [],
      total: 0,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      error: err instanceof Error ? err.message : "Products fetch failed",
    };
  }
}

export async function fetchCategoryProductCountsFromSupabase(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!isSupabaseConfigured()) return counts;
  const storeId = await getCurrentAdminStoreId();
  const supabase = createSupabaseAdmin();
  const trashSupported = await hasTrashColumn("products");
  const { data } = trashSupported
    ? await supabase
        .from("product_categories")
        .select("category_id, products!inner(id)")
        .eq("products.store_id", storeId)
        .is("products.deleted_at", null)
    : await supabase.from("product_categories").select("category_id, products!inner(id, store_id)").eq("products.store_id", storeId);
  for (const row of data || []) {
    const categoryId = row.category_id as string;
    counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
  }
  return counts;
}

export async function fetchProductsFromSupabase(options?: {
  trash?: boolean;
}): Promise<{
  ok: boolean;
  products: Product[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, products: [], error: "Database is not configured" };
  }
  try {
    const storeId = await getCurrentAdminStoreId();
    if (options?.trash) {
      await purgeExpiredCatalogTrash();
    }
    const supabase = createSupabaseAdmin();
    const trash = Boolean(options?.trash);
    const trashSupported = await hasTrashColumn("products");
    let query = supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("updated_at", { ascending: false });
    query = applyTrashFilter(query, trash, trashSupported);
    const { data, error } = await query;

    if (error) return { ok: false, products: [], error: error.message };

    const rows = (data || []) as DbProduct[];
    const productIds = rows.map((r) => r.id);
    const [{ byId, bySlug }, joinByProduct] = await Promise.all([
      loadCategoryLookup(supabase, storeId),
      loadJoinsForProducts(supabase, productIds),
    ]);

    const fromDb = mapRowsToListProducts(rows, joinByProduct, byId, bySlug);

    return { ok: true, products: fromDb };
  } catch (err) {
    return {
      ok: false,
      products: [],
      error: err instanceof Error ? err.message : "Products fetch failed",
    };
  }
}

async function syncProductCategoryJoin(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  productId: string,
  categoryId: string | undefined,
): Promise<void> {
  if (!categoryId || categoryId === "uncategorized") return;
  await supabase.from("product_categories").delete().eq("product_id", productId);
  await supabase.from("product_categories").insert({
    product_id: productId,
    category_id: categoryId,
    position: 0,
  });
}

export async function createProductInSupabase(
  input: ProductInput,
): Promise<{ ok: boolean; product?: Product; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const supabase = createSupabaseAdmin();
    const payload = toDbPayload(input);
    const { data, error } = await supabase.from("products").insert(payload).select("*").single();
    if (error || !data) return { ok: false, error: error?.message || "Insert failed" };
    const row = data as DbProduct;
    const categoryId =
      typeof row.metadata?.categoryId === "string" ? row.metadata.categoryId : undefined;
    await syncProductCategoryJoin(supabase, row.id, categoryId);
    const type = normalizeProductType(
      (row.metadata?.admin_type as string) || row.product_type,
    );
    const matrixResult = await persistVariantMatrix(row.id, input, type);
    if (!matrixResult.ok) {
      return { ok: false, error: matrixResult.error || "Variant sync failed" };
    }
    const product = await withVariantMatrix(applyStorefrontPricing(mapProduct(row)));
    return { ok: true, product };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Insert failed" };
  }
}

export async function updateProductInSupabase(
  id: string,
  input: Partial<ProductInput>,
): Promise<{ ok: boolean; product?: Product; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const supabase = createSupabaseAdmin();
    const { data: existing, error: getError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("store_id", GARTH_STORE_ID)
      .maybeSingle();

    if (getError || !existing) {
      return { ok: false, error: getError?.message || "Product not found" };
    }

    const payload = toDbPayload(input, existing as DbProduct);
    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .eq("store_id", GARTH_STORE_ID)
      .select("*")
      .single();

    if (error || !data) return { ok: false, error: error?.message || "Update failed" };
    const row = data as DbProduct;
    const categoryId =
      typeof row.metadata?.categoryId === "string" ? row.metadata.categoryId : undefined;
    if (input.categoryId !== undefined) {
      await syncProductCategoryJoin(supabase, row.id, categoryId);
    }
    const type = normalizeProductType(
      (row.metadata?.admin_type as string) || row.product_type,
    );
    const matrixResult = await persistVariantMatrix(
      row.id,
      {
        ...input,
        sku: input.sku ?? row.sku ?? "",
        price: input.price ?? centsToDollars(row.price_cents),
      },
      type,
    );
    if (!matrixResult.ok) {
      return { ok: false, error: matrixResult.error || "Variant sync failed" };
    }
    const product = await withVariantMatrix(applyStorefrontPricing(mapProduct(row)));
    return { ok: true, product };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function trashProductInSupabase(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("products");
    const now = new Date().toISOString();
    if (trashSupported) {
      const { error } = await supabase
        .from("products")
        .update({
          deleted_at: now,
          status: "archived",
          updated_at: now,
        })
        .eq("id", id)
        .eq("store_id", GARTH_STORE_ID)
        .is("deleted_at", null);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }
    const { error } = await supabase
      .from("products")
      .update({
        status: "archived",
        updated_at: now,
      })
      .eq("id", id)
      .eq("store_id", GARTH_STORE_ID);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Trash failed" };
  }
}

export async function restoreProductInSupabase(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("products");
    const now = new Date().toISOString();
    if (!trashSupported) {
      return { ok: false, error: "Trash is not enabled on this database yet" };
    }
    const { error } = await supabase
      .from("products")
      .update({
        deleted_at: null,
        updated_at: now,
      })
      .eq("id", id)
      .eq("store_id", GARTH_STORE_ID)
      .not("deleted_at", "is", null);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Restore failed" };
  }
}

export async function deleteProductInSupabase(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("products");
    let query = supabase.from("products").delete().eq("id", id).eq("store_id", GARTH_STORE_ID);
    if (trashSupported) {
      query = query.not("deleted_at", "is", null);
    }
    const { error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed" };
  }
}

export async function fetchCustomersCountFromSupabase(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const storeId = await getCurrentAdminStoreId();
  const supabase = createSupabaseAdmin();
  const { count, error } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId);
  if (error) return 0;
  return count ?? 0;
}

export async function fetchCustomersFromSupabase() {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, customers: [], error: "Database is not configured" };
  }
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    if (error) return { ok: false as const, customers: [], error: error.message };
    return { ok: true as const, customers: data || [] };
  } catch (err) {
    return {
      ok: false as const,
      customers: [],
      error: err instanceof Error ? err.message : "Customers fetch failed",
    };
  }
}
