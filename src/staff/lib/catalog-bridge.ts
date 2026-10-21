import type { Product as StorefrontProduct } from "@/lib/catalog";
import { Catalog } from "@/lib/catalog";
import { isReservedCatalogSlug } from "@/lib/catalog-reserved";
import type { Product, ProductStatus, ProductType, ProductVariant } from "@/types";
import { normalizeProductType } from "@/types";
import { isPayWhatYouWantPrice } from "@/lib/pay-what-you-want";
import {
  contentSectionsFromStorefront,
  withFilledContentSections,
} from "@/lib/product-content-sections";

function centsToDollars(cents: number | null | undefined) {
  if (cents == null) return 0;
  return Math.round(cents) / 100;
}

function mapStatus(status: string): ProductStatus {
  if (status === "coming-soon") return "draft";
  if (status === "archived") return "archived";
  return "active";
}

function mapType(type: string): ProductType {
  return normalizeProductType(type);
}

/** Admin category slugs that match `categories.slug` in the DB. */
export type AdminCategorySlug = "books" | "digital" | "merch";

const STOREFRONT_CATEGORY_TO_ADMIN: Record<string, AdminCategorySlug> = {
  books: "books",
  "print-books": "books",
  audiobooks: "books",
  digital: "digital",
  guides: "digital",
  training: "digital",
  "cancer-resources": "digital",
  merch: "merch",
  apparel: "merch",
  drinkware: "merch",
  stationery: "merch",
};

/**
 * Map storefront taxonomy tags to the primary admin category slug.
 * Prefer Books > Merchandise > Digital when a product has multiple.
 */
export function adminCategorySlugFromStorefront(
  categories: string[] | undefined | null,
): AdminCategorySlug | null {
  if (!categories?.length) return null;
  const mapped = categories
    .map((c) => STOREFRONT_CATEGORY_TO_ADMIN[c])
    .filter((c): c is AdminCategorySlug => Boolean(c));
  if (mapped.includes("books")) return "books";
  if (mapped.includes("merch")) return "merch";
  if (mapped.includes("digital")) return "digital";
  return null;
}

/** Fallback when catalog categories are missing — based on admin product type. */
export function adminCategorySlugFromProductType(
  type: ProductType | string | undefined,
): AdminCategorySlug {
  const t = normalizeProductType(type || "digital");
  if (t === "physical" || t === "bundle") return "merch";
  return "digital";
}

/** Resolve the best admin category slug for a product (catalog first, then type). */
export function resolveAdminCategorySlug(product: {
  slug?: string;
  type?: ProductType | string;
  categoryId?: string;
}): AdminCategorySlug {
  const existing = product.categoryId;
  if (existing === "books" || existing === "digital" || existing === "merch") {
    return existing;
  }
  const live = product.slug ? Catalog.bySlug(product.slug) : undefined;
  const fromCatalog = adminCategorySlugFromStorefront(live?.categories);
  if (fromCatalog) return fromCatalog;
  return adminCategorySlugFromProductType(product.type);
}

function variantsFromStorefront(p: StorefrontProduct): ProductVariant[] | undefined {
  if (!p.variants?.length) return undefined;
  return p.variants.map((v) => {
    const options = { ...(v.options || {}) };
    // Admin form edits display labels; storefront uses machine values — keep both shapes usable.
    const size = options.Size || options.size;
    const color = options.Color || options.color;
    return {
      id: v.id,
      sku: v.sku,
      options: {
        ...(size ? { Size: size } : {}),
        ...(color ? { Color: color } : {}),
        ...options,
      },
      size,
      color,
      price: centsToDollars(v.price),
      compareAtPrice: v.compareAt != null ? centsToDollars(v.compareAt) : undefined,
      inventory: v.inventory,
      weightOz: v.weightOz,
      image: v.image,
      status: (v.status as ProductVariant["status"]) || "active",
    };
  });
}

function priceFromStorefront(p: StorefrontProduct): number {
  if (isPayWhatYouWantPrice(p.price)) {
    return centsToDollars(p.price.suggested ?? p.price.min ?? p.price.amount);
  }
  if (p.price.amount != null) return centsToDollars(p.price.amount);
  if (p.variants?.length) {
    return centsToDollars(Math.min(...p.variants.map((v) => v.price)));
  }
  return 0;
}

/** Map a live storefront catalog product into the admin Product shape. */
export function storefrontCatalogToAdmin(p: StorefrontProduct): Product {
  const type: ProductType = mapType(p.type);
  const variants = variantsFromStorefront(p);
  const images = (p.media || [])
    .map((m) => m.src)
    .filter((src): src is string => Boolean(src));
  const longDescription = (p.descriptionLong || [])
    .filter(Boolean)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<(p|ul|ol|div)\b/i.test(trimmed)) return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .filter(Boolean)
    .join("");

  return {
    id: p.id,
    name: p.title,
    slug: p.slug,
    type,
    hasVariants: Boolean(p.options?.length || p.variants?.length),
    description: longDescription || p.descriptionShort || "",
    shortDescription: p.descriptionShort || p.subtitle || "",
    price: priceFromStorefront(p),
    sku: p.sku,
    status: mapStatus(p.status),
    categoryId: adminCategorySlugFromStorefront(p.categories) || adminCategorySlugFromProductType(p.type),
    featured: (p.collections || []).includes("featured"),
    images,
    seo: {
      title: p.seo?.title || p.title,
      description: p.seo?.description || p.descriptionShort || "",
    },
    contentSections: contentSectionsFromStorefront(p),
    variants,
    sizes: variants?.map((v) => v.size).filter(Boolean) as string[] | undefined,
    colors: variants?.map((v) => v.color).filter(Boolean) as string[] | undefined,
    payWhatYouWant: isPayWhatYouWantPrice(p.price)
      ? {
          enabled: true,
          suggestedAmount: centsToDollars(p.price.suggested),
          minimumAmount: centsToDollars(p.price.min),
        }
      : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * For reserved storefront products, prefer live website catalog for copy,
 * media, and variants — but keep admin DB pricing / PWYW so price edits stick.
 */
export function applyStorefrontPricing(admin: Product): Product {
  if (!isReservedCatalogSlug(admin.slug)) {
    return withFilledContentSections(admin);
  }
  const live = Catalog.bySlug(admin.slug);
  if (!live) return withFilledContentSections(admin);

  const overlay = storefrontCatalogToAdmin(live);
  const merged: Product = {
    ...admin,
    name: overlay.name || admin.name,
    description: overlay.description || admin.description,
    shortDescription: overlay.shortDescription || admin.shortDescription,
    type: overlay.type || admin.type,
    sku: overlay.sku || admin.sku,
    images: overlay.images.length ? overlay.images : admin.images,
    variants: overlay.variants?.length ? overlay.variants : admin.variants,
    sizes: overlay.sizes?.length ? overlay.sizes : admin.sizes,
    colors: overlay.colors?.length ? overlay.colors : admin.colors,
    // Prefer DB price / PWYW when present; fall back to catalog
    price: admin.price > 0 ? admin.price : overlay.price,
    payWhatYouWant: admin.payWhatYouWant?.enabled
      ? admin.payWhatYouWant
      : overlay.payWhatYouWant,
    seo: {
      title: overlay.seo.title || admin.seo.title,
      description: overlay.seo.description || admin.seo.description,
      noindex: Boolean(admin.seo.noindex || overlay.seo.noindex),
      nofollow: Boolean(admin.seo.nofollow || overlay.seo.nofollow),
    },
    contentSections: admin.contentSections?.some((s) => s.heading.trim() || s.body.trim())
      ? admin.contentSections
      : overlay.contentSections,
  };
  return withFilledContentSections(merged, live);
}

/** Reserved catalog products that exist on the website but not yet in admin DB. */
export function missingStorefrontProducts(_existingSlugs: Set<string>): Product[] {
  return [];
}
