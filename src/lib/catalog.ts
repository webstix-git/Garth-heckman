import {
  PRODUCTS as RAW_PRODUCTS,
  TAXONOMY as RAW_TAXONOMY,
  CURRENCY,
} from "@/data/catalog-source.js";
import { PRINTIFY_MAP } from "@/data/printify-map";
import { dollarsToCents } from "@/lib/money";

export { CURRENCY };

export type ProductType = "simple" | "variable" | "digital" | "pwyw";
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
  seo: { title: string; description: string };
  pwywGets?: string[];
  ctaLabel?: string;
  /** Printify product id used when submitting a POD order. */
  printifyProductId?: string;
  /** Printify variant id for simple POD products with no option matrix. */
  printifyVariantId?: number;
};

function cents(n: unknown): number | null {
  if (n == null || n === "") return null;
  return dollarsToCents(Number(n));
}

function toProduct(raw: Record<string, unknown>): Product {
  const price = (raw.price || {}) as Record<string, unknown>;
  const variants = Array.isArray(raw.variants) ? raw.variants : [];
  const shipping = (raw.shipping || {}) as Record<string, unknown>;
  const inventory = (raw.inventory || {}) as Record<string, unknown>;
  const digital = raw.digital as Product["digital"];
  const printify = PRINTIFY_MAP[String(raw.id)];

  return {
    id: String(raw.id),
    sku: String(raw.sku),
    slug: String(raw.slug),
    status: (raw.status as ProductStatus) || "active",
    type: raw.type as ProductType,
    fulfillment: raw.fulfillment as Fulfillment,
    title: String(raw.title),
    subtitle: String(raw.subtitle || ""),
    categories: (raw.categories as string[]) || [],
    collections: (raw.collections as string[]) || [],
    tags: (raw.tags as string[]) || [],
    badge: (raw.badge as Product["badge"]) || null,
    price: {
      currency: String(price.currency || CURRENCY),
      amount: cents(price.amount),
      suggested: cents(price.suggested),
      min: cents(price.min),
      max: cents(price.max),
      presets: Array.isArray(price.presets)
        ? price.presets.map((n) => dollarsToCents(Number(n)) ?? 0)
        : [],
      presetLabels: price.presetLabels as string[] | undefined,
      compareAt: cents(price.compareAt),
      listPrice: cents(price.listPrice),
    },
    media: (raw.media as ProductMedia[]) || [],
    descriptionShort: String(raw.descriptionShort || ""),
    descriptionLong: (raw.descriptionLong as string[]) || [],
    details: (raw.details as Product["details"]) || [],
    options: (raw.options as ProductOption[]) || [],
    variants: variants.map((v) => {
      const vr = v as Record<string, unknown>;
      const id = String(vr.id);
      return {
        id,
        sku: String(vr.sku),
        options: (vr.options as Record<string, string>) || {},
        price: dollarsToCents(Number(vr.price)) ?? 0,
        inventory: Number(vr.inventory ?? 0),
        printifyVariantId: printify?.variants?.[id],
      };
    }),
    inventory: {
      tracked: Boolean(inventory.tracked),
      quantity: inventory.quantity == null ? null : Number(inventory.quantity),
      allowBackorder: Boolean(inventory.allowBackorder),
    },
    shipping: {
      required: Boolean(shipping.required),
      weightOz: shipping.weightOz == null ? undefined : Number(shipping.weightOz),
      originNote: shipping.originNote == null ? undefined : String(shipping.originNote),
    },
    digital: digital || null,
    related: (raw.related as string[]) || [],
    seo: (raw.seo as Product["seo"]) || { title: String(raw.title), description: "" },
    pwywGets: raw.pwywGets as string[] | undefined,
    ctaLabel: raw.ctaLabel as string | undefined,
    printifyProductId: printify?.printifyProductId,
    printifyVariantId: printify?.printifyVariantId,
  };
}

export const TAXONOMY = RAW_TAXONOMY;
export const PRODUCTS: Product[] = RAW_PRODUCTS.map(toProduct);

export const Catalog = {
  all() {
    return PRODUCTS.filter((p) => p.status !== "archived");
  },
  byId(id: string) {
    return PRODUCTS.find((p) => p.id === id);
  },
  bySlug(slug: string) {
    return PRODUCTS.find((p) => p.slug === slug);
  },
  byCategory(slug: string) {
    return this.all().filter((p) => p.categories.includes(slug));
  },
  byCollection(slug: string) {
    return this.all().filter((p) => p.collections.includes(slug));
  },
  related(p: Product) {
    return (p.related || []).map((id) => this.byId(id)).filter((x): x is Product => Boolean(x));
  },
  categoryName(slug: string) {
    for (const c of TAXONOMY.categories) {
      if (c.slug === slug) return c.name;
      const kid = (c.children || []).find((k) => k.slug === slug);
      if (kid) return kid.name;
    }
    return slug;
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
    if (p.type === "pwyw") return p.price.suggested ?? p.price.amount ?? 0;
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
