import { Catalog, type Product, type ProductVariant } from "@/lib/catalog";

export const CART_KEY = "gh_cart_v4";
export const PROMO_KEY = "gh_promo_v1";
export const ORDER_KEY = "gh_order_v4";
export const ORDERS_KEY = "gh_orders_v4";

export const SHIPPING_CENTS = 695;
export const FREE_SHIPPING_AT = 7500;
export const TAX_BPS = 688; // 6.88%

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  variantId: string | null;
  qty: number;
  /** Pay-what-you-want claim in cents. Server must re-check against the floor. */
  pwywCents?: number;
};

export type Promo = {
  code: string;
  kind: "percent" | "shipping" | "amount";
  value: number;
  label: string;
};

export const PROMOS: Record<string, Omit<Promo, "code">> = {
  WTFU10: { kind: "percent", value: 10, label: "10% off" },
  SHIPFREE: { kind: "shipping", value: 0, label: "Free shipping" },
  GARTH5: { kind: "amount", value: 500, label: "$5 off" },
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

export function hydrate(item: CartItem): HydratedLine | null {
  const product = Catalog.byId(item.productId);
  if (!product) return null;
  const variant = item.variantId
    ? product.variants.find((v) => v.id === item.variantId) || null
    : null;
  const unitCents =
    product.type === "pwyw"
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

export function hydrateAll(items: CartItem[]) {
  return items.map(hydrate).filter((x): x is HydratedLine => Boolean(x));
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

export function discountCents(subtotal: number, promo: Promo | null) {
  if (!promo) return 0;
  if (promo.kind === "percent") return Math.round((subtotal * promo.value) / 100);
  if (promo.kind === "amount") return Math.min(promo.value, subtotal);
  return 0;
}

export function shippingCents(lines: HydratedLine[], subtotal: number, promo: Promo | null) {
  if (!hasPhysical(lines)) return 0;
  if (promo && promo.kind === "shipping") return 0;
  return subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_CENTS;
}

export function taxCents(subtotal: number, discount: number) {
  return Math.round((Math.max(0, subtotal - discount) * TAX_BPS) / 10000);
}

export function totalCents(lines: HydratedLine[], promo: Promo | null) {
  const sub = subtotalCents(lines);
  const disc = discountCents(sub, promo);
  const ship = shippingCents(lines, sub, promo);
  const tax = taxCents(sub, disc);
  return Math.max(0, sub - disc) + ship + tax;
}

export type CartIssue = {
  key: string;
  level: "gone" | "qty" | "pwyw";
  msg: string;
  max?: number;
  min?: number;
};

export function validateCart(items: CartItem[]): CartIssue[] {
  const out: CartIssue[] = [];
  items.forEach((i) => {
    const p = Catalog.byId(i.productId);
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
      else if (v.inventory === 0) out.push({ key: i.key, level: "gone", msg: "That option has sold out." });
      else if (i.qty > v.inventory)
        out.push({
          key: i.key,
          level: "qty",
          max: v.inventory,
          msg: `Only ${v.inventory} left. Quantity reduced.`,
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

export type StoredOrder = {
  number: string;
  placedAt: string;
  email: string;
  name: string;
  shippingRequired: boolean;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  paymentMethod: string;
  items: Array<{
    productId: string;
    slug: string;
    title: string;
    sku: string;
    qty: number;
    optionsLabel: string;
    shipping: boolean;
    type: string;
    unitCents: number;
  }>;
  totals: { subtotal: number; shipping: number; tax: number; total: number };
  status: string;
  printifyOrderId?: string;
};

export const ORDER_CHANGE = "order:change";

const EMPTY_ORDERS: StoredOrder[] = [];
let orderRaw: string | null = null;
let orderSnap: StoredOrder | null = null;
let ordersRaw: string | null = null;
let ordersSnap: StoredOrder[] = EMPTY_ORDERS;

export function emptyOrderSnapshot(): StoredOrder | null {
  return null;
}

export function emptyOrdersSnapshot(): StoredOrder[] | null {
  return null;
}

export function readOrder(): StoredOrder | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ORDER_KEY) || "null";
  if (raw === orderRaw) return orderSnap;
  try {
    orderSnap = JSON.parse(raw) as StoredOrder | null;
  } catch {
    orderSnap = null;
  }
  orderRaw = raw;
  return orderSnap;
}

export function readOrders(): StoredOrder[] {
  if (typeof window === "undefined") return EMPTY_ORDERS;
  const raw = localStorage.getItem(ORDERS_KEY) || "[]";
  if (raw === ordersRaw) return ordersSnap;
  try {
    ordersSnap = JSON.parse(raw) as StoredOrder[];
  } catch {
    ordersSnap = EMPTY_ORDERS;
  }
  ordersRaw = raw;
  return ordersSnap;
}

export function writePlacedOrder(order: StoredOrder) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  const all = [order, ...readOrders().filter((o) => o.number !== order.number)];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
  orderRaw = null;
  ordersRaw = null;
  window.dispatchEvent(new CustomEvent(ORDER_CHANGE));
}

export function subscribeOrders(onChange: () => void) {
  window.addEventListener(ORDER_CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(ORDER_CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}
