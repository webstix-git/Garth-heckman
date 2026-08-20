/**
 * Server-only Printify API client.
 * Token stays in PRINTIFY_API_TOKEN. Do not import this file from client components.
 */
import "server-only";
import { PRINTIFY_SHOP_ID as MAPPED_SHOP_ID } from "@/data/printify-map";

const BASE = "https://api.printify.com/v1";

function token() {
  const value = process.env.PRINTIFY_API_TOKEN;
  if (!value) throw new Error("PRINTIFY_API_TOKEN is not set");
  return value;
}

export function printifyShopId() {
  return process.env.PRINTIFY_SHOP_ID || MAPPED_SHOP_ID;
}

export async function printifyFetch<T>(pathname: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/${pathname.replace(/^\//, "")}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      "User-Agent": "garth-heckman-web/0.1",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Printify ${res.status} ${pathname}: ${JSON.stringify(body)}`);
  }
  return body as T;
}

export type PrintifyShop = {
  id: number;
  title: string;
  sales_channel: string;
};

export function listPrintifyShops() {
  return printifyFetch<PrintifyShop[]>("shops.json");
}

export type PrintifyProductSummary = {
  id: string;
  title: string;
  visible: boolean;
  variants?: Array<{ id: number; title: string; is_enabled: boolean }>;
};

export function listPrintifyProducts(shopId = printifyShopId()) {
  return printifyFetch<{ data: PrintifyProductSummary[] }>(
    `shops/${shopId}/products.json?limit=50`,
  );
}

export type PrintifyProductDetail = {
  id: string;
  title: string;
  variants: Array<{
    id: number;
    sku: string;
    title: string;
    price: number;
    is_enabled: boolean;
    is_available: boolean;
  }>;
};

export function getPrintifyProduct(productId: string, shopId = printifyShopId()) {
  return printifyFetch<PrintifyProductDetail>(`shops/${shopId}/products/${productId}.json`);
}

/** Turn on mapped variants so a draft order can include them. Does not send to production. */
export async function enablePrintifyVariants(productId: string, variantIds: number[]) {
  const wanted = new Set(variantIds);
  if (!wanted.size) return;
  const product = await getPrintifyProduct(productId);
  const missing = [...wanted].filter((id) => !product.variants.some((v) => v.id === id && v.is_enabled));
  if (!missing.length) return;
  await printifyFetch(`shops/${printifyShopId()}/products/${productId}.json`, {
    method: "PUT",
    body: JSON.stringify({
      variants: product.variants.map((v) => ({
        id: v.id,
        price: v.price,
        is_enabled: wanted.has(v.id) ? true : v.is_enabled,
      })),
    }),
  });
}

export type PrintifyAddress = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  address1: string;
  address2: string;
  city: string;
  zip: string;
};

const STATE_CODES: Record<string, string> = {
  Minnesota: "MN",
  Wisconsin: "WI",
  Illinois: "IL",
  Iowa: "IA",
};

export function toPrintifyCountry(country: string) {
  return country.trim().toLowerCase() === "canada" ? "CA" : "US";
}

export function toPrintifyRegion(state: string) {
  return STATE_CODES[state] || "MN";
}

export type PrintifyDraftOrder = { id: string };

export function createPrintifyDraftOrder(input: {
  externalId: string;
  label: string;
  lineItems: Array<{ product_id: string; variant_id: number; quantity: number }>;
  address: PrintifyAddress;
}) {
  return printifyFetch<PrintifyDraftOrder>(`shops/${printifyShopId()}/orders.json`, {
    method: "POST",
    body: JSON.stringify({
      external_id: input.externalId,
      label: input.label,
      line_items: input.lineItems,
      shipping_method: 1,
      is_printify_express: false,
      send_shipping_notification: false,
      address_to: input.address,
    }),
  });
}
