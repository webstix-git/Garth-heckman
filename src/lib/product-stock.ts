import type { Product, ProductVariant } from "@/lib/catalog";

/** True when the customer can buy this product / selected variant. */
export function isPurchasable(p: Product, variant?: ProductVariant | null): boolean {
  if (p.status === "coming-soon") return false;

  const backorder = Boolean(p.inventory?.allowBackorder);

  if (p.variants?.length) {
    if (variant) {
      return variant.inventory > 0 || backorder;
    }
    return p.variants.some((v) => v.inventory > 0) || backorder;
  }

  if (p.inventory?.tracked && p.inventory.quantity != null) {
    return p.inventory.quantity > 0 || backorder;
  }

  // Track quantity OFF (or digital / untracked) → stock not applicable
  return true;
}

/** Whether an option value still has at least one sellable matching variant. */
export function isOptionValueAvailable(
  p: Product,
  optionName: string,
  optionValue: string,
  currentSelection: Record<string, string>,
): boolean {
  if (!p.variants?.length) return true;
  const backorder = Boolean(p.inventory?.allowBackorder);
  if (backorder) return true;
  const trial = { ...currentSelection, [optionName]: optionValue };
  return p.variants.some(
    (v) =>
      (!v.status || v.status === "active") &&
      Object.keys(trial).every((k) => !trial[k] || v.options[k] === trial[k]) &&
      v.inventory > 0,
  );
}

export function productStockBadge(p: Product): {
  ok: boolean;
  label: string | null;
  v: string;
} {
  if (p.status === "coming-soon") {
    return { ok: false, label: "Coming soon", v: "" };
  }

  // Printify is made to order — no warehouse stock labels on cards.
  if (p.fulfillment === "printify") {
    return { ok: true, label: null, v: "" };
  }

  const backorder = Boolean(p.inventory?.allowBackorder);

  if (p.variants?.length) {
    const left = p.variants.reduce((sum, v) => sum + Math.max(0, v.inventory), 0);
    if (left <= 0) {
      if (backorder) return { ok: true, label: "Backorder", v: "warn" };
      return { ok: false, label: "Sold out", v: "bad" };
    }
    if (left < 15) return { ok: true, label: "Low stock", v: "warn" };
    return { ok: true, label: null, v: "" };
  }

  if (p.inventory?.tracked && p.inventory.quantity != null) {
    const qty = p.inventory.quantity;
    if (qty <= 0) {
      if (backorder) return { ok: true, label: "Backorder", v: "warn" };
      return { ok: false, label: "Sold out", v: "bad" };
    }
    if (qty < 30) return { ok: true, label: `Only ${qty} left`, v: "warn" };
  }

  return { ok: true, label: null, v: "" };
}
