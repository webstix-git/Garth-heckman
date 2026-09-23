/**
 * Maps storefront catalog ids to Printify shop products.
 *
 * Storefront structure (slug, options, variant ids) stays in catalog-source.js.
 * Title, description, media, and prices are loaded live from Printify
 * (prices = Printify selling × 1.20 via enrich-printify.ts).
 *
 * Tee colours offered on the site: White only (Printify name + hex).
 * Mug has no colour picker; mapped variants use Printify’s configured colours.
 */
export const PRINTIFY_SHOP_ID = "28272515";

export type PrintifyProductMap = {
  printifyProductId: string;
  printifyVariantId?: number;
  variants?: Record<string, number>;
};

export const PRINTIFY_MAP: Record<string, PrintifyProductMap> = {
  p_wtfu_journal: {
    printifyProductId: "6a81c32700177bb8ff0d06c4",
    printifyVariantId: 65223,
  },
  p_wtfu_tank: {
    printifyProductId: "6ab2a06fe4786b291d0532fc",
    printifyVariantId: 119785, // White / L — only enabled variant in Printify today
  },
  p_leather_bracelet: {
    printifyProductId: "6ab2a0d2abbcc6610304e118",
    printifyVariantId: 253999, // 8.5" / Stainless Steel
  },
  p_wtfu_tee: {
    printifyProductId: "6a81c07e42e8d58d9209fbfc",
    variants: {
      v_tee_white_s: 33791,
      v_tee_white_m: 33792,
      v_tee_white_l: 33793,
      v_tee_white_xl: 33794,
      v_tee_white_2xl: 33795,
      v_tee_white_3xl: 64722,
    },
  },
  p_wtfu_mug: {
    printifyProductId: "6a81bf8042e8d58d9209f92e",
    variants: {
      // 11oz only — Printify variant 105883 (15oz Black) is disabled
      v_mug_11: 72180,
    },
  },
};

export type PrintifyLineItem = {
  product_id: string;
  variant_id: number;
  quantity: number;
};

export function printifyLineItem(
  productId: string,
  variantId: string | null | undefined,
  quantity: number,
): PrintifyLineItem | null {
  const map = PRINTIFY_MAP[productId];
  if (!map) return null;
  const printifyVariantId = variantId ? map.variants?.[variantId] : map.printifyVariantId;
  if (printifyVariantId == null) return null;
  return {
    product_id: map.printifyProductId,
    variant_id: printifyVariantId,
    quantity,
  };
}
