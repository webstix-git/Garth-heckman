import { isPayWhatYouWantPrice } from "@/lib/pay-what-you-want";

/** Storefront currency (matches DB / checkout). */
export const CURRENCY = "USD";

export type ProductType = "simple" | "variable" | "digital";
export type Fulfillment = "self" | "printify" | "download";
export type ProductStatus = "active" | "coming-soon" | "archived";

export type ShotVariant = "light" | "pale" | "default" | "dark" | "warm" | "ember" | "cool";

export type ProductMedia = {
  kind: string;
  variant: ShotVariant | string;
  ratio: string;
  label: string;
  note: string;
  src?: string;
};

export type ProductOptionValue = {
  label: string;
  value: string;
  hex?: string;
};

export type ProductOption = {
  name: string;
  type: "swatch" | "button" | string;
  values: ProductOptionValue[];
};

export type ProductVariant = {
  id: string;
  sku: string;
  options: Record<string, string>;
  /** Integer cents. */
  price: number;
  inventory: number;
  /** Compare-at price in integer cents. */
  compareAt?: number | null;
  weightOz?: number;
  image?: string;
  status?: string;
  /** Printify variant id used when submitting a POD order. */
  printifyVariantId?: number;
};

export type ProductPrice = {
  currency: string;
  /** Integer cents. Null means unpriced / coming soon. */
  amount: number | null;
  suggested: number | null;
  min: number | null;
  max: number | null;
  presets: number[];
  presetLabels?: string[];
  compareAt: number | null;
  listPrice: number | null;
};

export type Product = {
  id: string;
  sku: string;
  slug: string;
  status: ProductStatus;
  type: ProductType;
  fulfillment: Fulfillment;
  title: string;
  subtitle: string;
  categories: string[];
  collections: string[];
  tags: string[];
  badge: { label: string; variant: string } | null;
  price: ProductPrice;
  media: ProductMedia[];
  descriptionShort: string;
  descriptionLong: string[];
  details: Array<{ label: string; value: string }>;
  options: ProductOption[];
  variants: ProductVariant[];
  inventory: {
    tracked: boolean;
    quantity: number | null;
    allowBackorder: boolean;
  };
  shipping: {
    required: boolean;
    weightOz?: number;
    originNote?: string;
  };
  digital: {
    files: Array<{ name: string; sizeMb: number | null }>;
    downloadLimit?: number;
    expiryDays?: number;
  } | null;
  related: string[];
  seo: { title: string; description: string; noindex?: boolean; nofollow?: boolean };
  /** Optional accordion sections (heading + body). Max 5 from admin. */
  contentSections?: Array<{ heading: string; body: string }>;
  pwywGets?: string[];
  ctaLabel?: string;
  /** Printify product id used when submitting a POD order. */
  printifyProductId?: string;
  /** Printify variant id for simple POD products with no option matrix. */
  printifyVariantId?: number;
};

/** @deprecated No static catalog — always empty. Prefer listStorefrontProducts(). */
export const PRODUCTS: Product[] = [];

/** @deprecated No static taxonomy — categories come from the database. */
export const TAXONOMY = { categories: [] as Array<{ slug: string; name: string; children?: Array<{ slug: string; name: string }> }> };

/** Products hydrated on the client from `/api/catalog` (DB-backed). */
let cmsProducts: Product[] = [];
let cmsCategories: Array<{ id: string; name: string; slug: string; description?: string }> = [];

export const Catalog = {
  /** Replace the in-memory catalog with the API/DB product list. */
  hydrateCms(products: Product[]) {
    cmsProducts = products.filter((p) => p.status !== "archived");
  },
  hydrateCategories(
    categories: Array<{ id: string; name: string; slug: string; description?: string }>,
  ) {
    cmsCategories = categories;
  },
  cmsCount() {
    return cmsProducts.length;
  },
  all() {
    return cmsProducts.filter((p) => p.status !== "archived");
  },
  byId(id: string) {
    return cmsProducts.find((p) => p.id === id);
  },
  bySlug(slug: string) {
    return cmsProducts.find((p) => p.slug === slug);
  },
  byCategory(slug: string) {
    return this.all().filter((p) => p.categories.includes(slug));
  },
  byCollection(slug: string) {
    return this.all().filter((p) => p.collections.includes(slug));
  },
  related(p: Product) {
    return (p.related || [])
      .map((ref) => this.byId(ref) ?? this.bySlug(ref))
      .filter((x): x is Product => Boolean(x) && x !== p);
  },
  categoryName(slug: string) {
    const fromDb = cmsCategories.find((c) => c.slug === slug);
    if (fromDb) return fromDb.name;
    return slug
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  },
  categories() {
    return cmsCategories;
  },
  primaryCategoryLabel(p: Product) {
    const last = p.categories[p.categories.length - 1];
    return this.categoryName(last);
  },
  variantFor(p: Product, selection: Record<string, string>) {
    if (!p.variants || !p.variants.length) return null;
    return (
      p.variants.find((v) =>
        Object.entries(v.options).every(([k, val]) => selection[k] === val),
      ) || null
    );
  },
  needsShipping(p: Product) {
    return !!(p.shipping && p.shipping.required);
  },
  search(q: string) {
    const t = q.trim().toLowerCase();
    if (!t) return this.all();
    return this.all().filter((p) =>
      [p.title, p.subtitle, p.descriptionShort, ...(p.tags || []), ...p.categories]
        .join(" ")
        .toLowerCase()
        .includes(t),
    );
  },
  /** Display price in cents: variant price for variable products, else product amount. */
  unitCents(p: Product, variant?: ProductVariant | null) {
    if (isPayWhatYouWantPrice(p.price)) return p.price.suggested ?? p.price.amount ?? 0;
    if (variant) return variant.price;
    return p.price.amount ?? 0;
  },
  printifyRef(p: Product, variant?: ProductVariant | null) {
    const printifyProductId = p.printifyProductId;
    const printifyVariantId = variant?.printifyVariantId ?? p.printifyVariantId;
    if (!printifyProductId || printifyVariantId == null) return null;
    return { printifyProductId, printifyVariantId };
  },
};
