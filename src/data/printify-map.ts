/**
 * Maps storefront catalog ids to Printify shop products.
 *
 * Storefront titles, prices, options and copy stay in catalog-source.js.
 * This file only records the Printify ids needed to submit an order.
 *
 * Colour aliases (storefront label → Printify colour):
 *   White is Printify's primary colour for the tee.
 *   Bone  → Ash
 *   Slate → Dark Heather
 * Mug has no colour in the UI; orders use Printify Black.
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
  p_wtfu_tee: {
    printifyProductId: "6a81c07e42e8d58d9209fbfc",
    variants: {
      v_tee_white_s: 33791,
      v_tee_white_m: 33792,
      v_tee_white_l: 33793,
      v_tee_white_xl: 33794,
      v_tee_white_2xl: 33795,
      v_tee_white_3xl: 64722,
      v_tee_black_s: 33796,
      v_tee_black_m: 33797,
      v_tee_black_l: 33798,
      v_tee_black_xl: 33799,
      v_tee_black_2xl: 33800,
      v_tee_black_3xl: 64723,
      v_tee_bone_s: 42641,
      v_tee_bone_m: 42642,
      v_tee_bone_l: 42643,
      v_tee_bone_xl: 42644,
      v_tee_bone_2xl: 42645,
      v_tee_bone_3xl: 64705,
      v_tee_slate_s: 42691,
      v_tee_slate_m: 42692,
      v_tee_slate_l: 42693,
      v_tee_slate_xl: 42694,
      v_tee_slate_2xl: 42695,
      v_tee_slate_3xl: 64709,
    },
  },
  p_wtfu_mug: {
    printifyProductId: "6a81bf8042e8d58d9209f92e",
    variants: {
      v_mug_11: 72180,
      v_mug_15: 105883,
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
