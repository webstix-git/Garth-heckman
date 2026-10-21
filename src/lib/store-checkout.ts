import "server-only";

export type CartLineInput = { productId?: unknown; variantId?: unknown; qty?: unknown; pwywCents?: unknown };

export type CheckoutInput = {
  items?: CartLineInput[];
  couponCode?: unknown;
  contact?: { fname?: unknown; lname?: unknown; email?: unknown };
  address?: { line1?: unknown; line2?: unknown; city?: unknown; state?: unknown; zip?: unknown; country?: unknown } | null;
  paymentMethod?: unknown;
};

const MAX_LINES = 50;
const text = (value: unknown, max = 200) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Cart lines in the backend's shape. Prices are never sent; the backend prices everything. */
export function cartItemsForBackend(items: CartLineInput[] | undefined) {
  return (Array.isArray(items) ? items : []).slice(0, MAX_LINES).map((item) => ({
    productId: text(item.productId, 64),
    variantId: text(item.variantId, 64) || null,
    quantity: Math.min(99, Math.max(1, Math.floor(Number(item.qty) || 1))),
    ...(item.pwywCents != null && Number.isFinite(Number(item.pwywCents)) ? { pwywCents: Math.round(Number(item.pwywCents)) } : {}),
  }));
}

/** The backend checkout body for a storefront checkout form. */
export function checkoutBody(input: CheckoutInput) {
  const name = `${text(input.contact?.fname, 80)} ${text(input.contact?.lname, 80)}`.trim();
  const address = input.address
    ? {
        line1: text(input.address.line1),
        line2: text(input.address.line2),
        city: text(input.address.city, 100),
        region: text(input.address.state, 100),
        postalCode: text(input.address.zip, 20),
        country: text(input.address.country, 60) || "United States",
      }
    : undefined;
  return {
    email: text(input.contact?.email, 254),
    name,
    guest: true,
    address,
    items: cartItemsForBackend(input.items),
    couponCode: text(input.couponCode, 64),
    paymentMethod: input.paymentMethod === "cash_on_delivery" ? "cash_on_delivery" : "paypal",
  };
}
