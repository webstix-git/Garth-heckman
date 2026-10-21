/**
 * Platform store id — short 4-digit code (not a UUID).
 * Override with NEXT_PUBLIC_STORE_ID when running multiple stores.
 */
export const DEFAULT_STORE_ID = "0001";

export function getStoreId(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_STORE_ID || process.env.GARTH_STORE_ID || "").trim();
  return fromEnv || DEFAULT_STORE_ID;
}

/** Legacy UUID used before short store codes — still accepted when rewriting paths. */
export const LEGACY_GARTH_STORE_UUID = "b0000000-0000-4000-8000-000000000001";
