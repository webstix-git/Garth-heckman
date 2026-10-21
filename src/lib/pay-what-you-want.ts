/**
 * Donation-style pricing (suggested + presets). Not a product type —
 * digital downloads (and others) can use this pricing shape.
 */
export function isPayWhatYouWantPrice(price: {
  suggested?: number | null;
  min?: number | null;
  presets?: number[];
} | null | undefined): boolean {
  if (!price) return false;
  if ((price.presets?.length ?? 0) > 0) return true;
  return price.suggested != null && price.min != null;
}
