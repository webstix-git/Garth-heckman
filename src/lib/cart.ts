import { Catalog, type Product, type ProductVariant } from "@/lib/catalog";
import { isPayWhatYouWantPrice } from "@/lib/pay-what-you-want";

export const CART_KEY = "gh_cart_v4";
export const PROMO_KEY = "gh_promo_v2";

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  variantId: string | null;
  qty: number;
  /** Pay-what-you-want claim in cents. Server must re-check against the floor. */
  pwywCents?: number;
};

/** A coupon the backend accepted. The discount itself is always worked out by the backend. */
export type Promo = {
  code: string;
  kind: "percent" | "shipping" | "amount";
  label: string;
};

export function cartKeyFor(item: Pick<CartItem, "productId" | "variantId" | "pwywCents">) {
  return [item.productId, item.variantId || "-", item.pwywCents ?? "-"].join("|");
}

const EMPTY_CART: CartItem[] = [];
let cartRaw: string | null = null;
let cartSnap: CartItem[] = EMPTY_CART;
let promoRaw: string | null = null;
let promoSnap: Promo | null = null;

export function emptyCartSnapshot(): CartItem[] {
  return EMPTY_CART;
}

export function emptyPromoSnapshot(): Promo | null {
  return null;
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART;
  const raw = localStorage.getItem(CART_KEY) || "[]";
  if (raw === cartRaw) return cartSnap;
  try {
    cartSnap = JSON.parse(raw) as CartItem[];
  } catch {
    cartSnap = EMPTY_CART;
  }
  cartRaw = raw;
  return cartSnap;
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  cartRaw = null;
  window.dispatchEvent(new CustomEvent("cart:change", { detail: items }));
}

export function readPromo(): Promo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROMO_KEY) || "null";
  if (raw === promoRaw) return promoSnap;
  try {
    promoSnap = JSON.parse(raw) as Promo | null;
  } catch {
    promoSnap = null;
  }
  promoRaw = raw;
  return promoSnap;
}

export function writePromo(promo: Promo | null) {
  if (promo) localStorage.setItem(PROMO_KEY, JSON.stringify(promo));
  else localStorage.removeItem(PROMO_KEY);
  promoRaw = null;
  window.dispatchEvent(new CustomEvent("cart:change"));
}

export type HydratedLine = CartItem & {
  product: Product;
  variant: ProductVariant | null;
  title: string;
  subtitle: string;
  sku: string;
  type: Product["type"];
  fulfillment: Product["fulfillment"];
  optionsLabel: string;
  unitCents: number;
  shipping: boolean;
  media: Product["media"][number] | null;
};

export function optionsLabel(p: Product, v: ProductVariant | null) {
  if (!v) return "";
  return Object.keys(v.options)
    .map((k) => {
      const opt = (p.options || []).find((x) => x.name === k);
      const val = opt && opt.values.find((x) => x.value === v.options[k]);
      return val ? val.label : v.options[k];
    })
    .join(" / ");
}

function catalogProduct(id: string, products?: Product[]) {
  return products ? products.find((product) => product.id === id) : Catalog.byId(id);
}

export function hydrate(item: CartItem, products?: Product[]): HydratedLine | null {
  const product = catalogProduct(item.productId, products);
  if (!product) return null;
  const variant = item.variantId
    ? product.variants.find((v) => v.id === item.variantId) || null
    : null;
  const unitCents =
    isPayWhatYouWantPrice(product.price)
      ? item.pwywCents ?? product.price.suggested ?? product.price.min ?? 0
      : Catalog.unitCents(product, variant);
  return {
    ...item,
    product,
    variant,
    title: product.title,
    subtitle: product.subtitle,
    sku: variant ? variant.sku : product.sku,
    type: product.type,
    fulfillment: product.fulfillment,
    optionsLabel: optionsLabel(product, variant),
    unitCents,
    shipping: !!product.shipping?.required,
    media: product.media[0] || null,
  };
}

export function hydrateAll(items: CartItem[], products?: Product[]) {
  return items.map((item) => hydrate(item, products)).filter((x): x is HydratedLine => Boolean(x));
}

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.qty, 0);
}

export function subtotalCents(lines: HydratedLine[]) {
  return lines.reduce((n, i) => n + i.unitCents * i.qty, 0);
}

export function hasPhysical(lines: HydratedLine[]) {
  return lines.some((i) => i.shipping);
}

export function hasDigital(lines: HydratedLine[]) {
  return lines.some((i) => !i.shipping);
}

/** Totals priced by the store backend for the current cart. */
export type CartQuote = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  freeShippingRemainingCents?: number | null;
  taxCents: number;
  taxLabel?: string;
  taxIncluded?: boolean;
  totalCents: number;
  requiresShipping: boolean;
  coupon: Promo | null;
  couponError: { code: string; message: string } | null;
  paypal?: boolean;
  cashOnDelivery?: boolean;
};

export function quoteRequestKey(items: CartItem[], promo: Promo | null) {
  return JSON.stringify([items.map((i) => [i.productId, i.variantId, i.qty, i.pwywCents ?? null]), promo?.code ?? ""]);
}

export async function fetchQuote(items: CartItem[], couponCode: string | null): Promise<CartQuote> {
  const response = await fetch("/api/cart/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty, pwywCents: i.pwywCents })),
      couponCode,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as CartQuote & { error?: string };
  if (!response.ok) throw new Error(body.error || "Unable to price your cart right now.");
  return body;
}

export type CartIssue = {
  key: string;
  level: "gone" | "qty" | "pwyw";
  msg: string;
  max?: number;
  min?: number;
};

export function validateCart(items: CartItem[], products?: Product[]): CartIssue[] {
  const out: CartIssue[] = [];
  items.forEach((i) => {
    const p = catalogProduct(i.productId, products);
    if (!p) {
      out.push({ key: i.key, level: "gone", msg: "This item is no longer available and will be removed." });
      return;
    }
    if (p.status === "coming-soon") {
      out.push({ key: i.key, level: "gone", msg: "This item is not on sale yet." });
    }
    if (i.variantId && p.variants.length) {
      const v = p.variants.find((x) => x.id === i.variantId);
      if (!v) out.push({ key: i.key, level: "gone", msg: "That option is no longer available." });
      else if (v.inventory === 0 && !p.inventory?.allowBackorder)
        out.push({ key: i.key, level: "gone", msg: "That option has sold out." });
      else if (v.inventory > 0 && i.qty > v.inventory)
        out.push({
          key: i.key,
          level: "qty",
          max: v.inventory,
          msg: `Only ${v.inventory} left. Quantity reduced.`,
        });
    } else if (
      p.inventory?.tracked &&
      p.inventory.quantity != null &&
      p.inventory.quantity <= 0 &&
      !p.inventory.allowBackorder
    ) {
      out.push({ key: i.key, level: "gone", msg: "This item has sold out." });
    } else if (
      p.inventory?.tracked &&
      p.inventory.quantity != null &&
      p.inventory.quantity > 0 &&
      i.qty > p.inventory.quantity
    ) {
      out.push({
        key: i.key,
        level: "qty",
        max: p.inventory.quantity,
        msg: `Only ${p.inventory.quantity} left. Quantity reduced.`,
      });
    }
    if (i.pwywCents != null && p.price.min != null && i.pwywCents < p.price.min) {
      out.push({
        key: i.key,
        level: "pwyw",
        min: p.price.min,
        msg: `Minimum contribution is $${Math.round(p.price.min / 100)}.`,
      });
    }
  });
  return out;
}
