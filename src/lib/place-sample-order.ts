import { randomUUID } from "node:crypto";
import { Catalog } from "@/lib/catalog";
import {
  PROMOS,
  cartKeyFor,
  discountCents,
  hydrateAll,
  shippingCents,
  subtotalCents,
  taxCents,
  totalCents,
  validateCart,
  type CartItem,
  type Promo,
  type StoredOrder,
} from "@/lib/cart";
import { printifyLineItem } from "@/data/printify-map";
import {
  createPrintifyDraftOrder,
  enablePrintifyVariants,
  toPrintifyCountry,
  toPrintifyRegion,
} from "@/lib/printify";

export type SampleOrderClaim = {
  productId: string;
  variantId: string | null;
  qty: number;
  pwywCents?: number;
};

export type SampleOrderInput = {
  items: SampleOrderClaim[];
  promoCode?: string | null;
  contact: { fname: string; lname: string; email: string };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
};

function asCartItems(claims: SampleOrderClaim[]): CartItem[] {
  return claims.map((claim) => {
    const product = Catalog.byId(claim.productId);
    const qty = Math.max(1, Math.floor(Number(claim.qty) || 1));
    let pwywCents = claim.pwywCents;
    if (product?.type === "pwyw") {
      const min = product.price.min ?? 0;
      const max = product.price.max ?? min;
      const raw = claim.pwywCents ?? product.price.suggested ?? min;
      pwywCents = Math.min(max, Math.max(min, raw));
    }
    const item: Omit<CartItem, "key"> = {
      productId: claim.productId,
      slug: product?.slug || "",
      variantId: claim.variantId,
      qty,
      pwywCents,
    };
    return { ...item, key: cartKeyFor(item) };
  });
}

function promoFromCode(code?: string | null): Promo | null {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return null;
  const p = PROMOS[c];
  return p ? { code: c, ...p } : null;
}

export async function placeSampleOrder(input: SampleOrderInput): Promise<StoredOrder> {
  const items = asCartItems(input.items);
  if (!items.length) throw new Error("Cart is empty.");

  const blocking = validateCart(items).filter((issue) => issue.level === "gone" || issue.level === "pwyw");
  if (blocking.length) throw new Error(blocking[0].msg);

  const lines = hydrateAll(items);
  if (!lines.length) throw new Error("None of those items are in the catalogue.");

  const promo = promoFromCode(input.promoCode);
  const physical = lines.some((line) => line.shipping);
  if (physical && !input.address) throw new Error("A shipping address is required.");

  const email = String(input.contact.email || "").trim();
  const fname = String(input.contact.fname || "").trim();
  const lname = String(input.contact.lname || "").trim();
  if (!email || !fname || !lname) throw new Error("Name and email are required.");

  const printifyLines = lines
    .filter((line) => line.fulfillment === "printify")
    .map((line) => {
      const mapped = printifyLineItem(line.productId, line.variantId, line.qty);
      if (!mapped) throw new Error(`${line.title} is not mapped to a Printify variant.`);
      return mapped;
    });

  const number = "GH-" + String(Math.floor(100000 + Math.random() * 899999));
  let printifyOrderId: string | undefined;

  if (printifyLines.length) {
    if (!input.address) throw new Error("A shipping address is required for Printify items.");
    const byProduct = new Map<string, number[]>();
    for (const line of printifyLines) {
      const ids = byProduct.get(line.product_id) || [];
      ids.push(line.variant_id);
      byProduct.set(line.product_id, ids);
    }
    for (const [productId, variantIds] of byProduct) {
      await enablePrintifyVariants(productId, variantIds);
    }

    const draft = await createPrintifyDraftOrder({
      externalId: randomUUID(),
      label: number,
      lineItems: printifyLines,
      address: {
        first_name: fname,
        last_name: lname,
        email,
        phone: "0000000000",
        country: toPrintifyCountry(input.address.country),
        region: toPrintifyRegion(input.address.state),
        address1: input.address.line1,
        address2: input.address.line2 || "",
        city: input.address.city,
        zip: input.address.zip,
      },
    });
    printifyOrderId = draft.id;
  }

  const subtotal = subtotalCents(lines);
  const discount = discountCents(subtotal, promo);
  const shipping = shippingCents(lines, subtotal, promo);
  const tax = taxCents(subtotal, discount);
  const total = totalCents(lines, promo);

  return {
    number,
    placedAt: new Date().toISOString(),
    email,
    name: `${fname} ${lname}`.trim(),
    shippingRequired: physical,
    address:
      physical && input.address
        ? {
            line1: input.address.line1,
            line2: input.address.line2 || "",
            city: input.address.city,
            state: input.address.state,
            zip: input.address.zip,
            country: input.address.country,
          }
        : null,
    paymentMethod: "none",
    items: lines.map((line) => ({
      productId: line.productId,
      slug: line.slug,
      title: line.title,
      sku: line.sku,
      qty: line.qty,
      optionsLabel: line.optionsLabel,
      shipping: line.shipping,
      type: line.type,
      unitCents: line.unitCents,
    })),
    totals: { subtotal, shipping, tax, total },
    status: "sample",
    printifyOrderId,
  };
}
