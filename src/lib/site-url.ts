/** Canonical public origin for metadata, sitemap, and absolute asset URLs (no trailing slash). */
export function getSiteUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.STOREFRONT_URL || "").trim();
  if (configured) {
    const withProtocol = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
    return withProtocol.replace(/\/$/, "");
  }
  const vercel = (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "").trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//i, "").replace(/\/$/, "")}`;
  return "https://garthheckman.com";
}

/**
 * Absolute URL for canonicals / OG.
 * Homepage uses a trailing slash; all other paths do not (self-referencing canonical).
 */
export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean.replace(/\/$/, "")}`;
}
