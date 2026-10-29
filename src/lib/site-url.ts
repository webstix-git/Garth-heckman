function isLocalOrigin(origin: string) {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
  } catch {
    return /localhost|127\.0\.0\.1/i.test(origin);
  }
}

function normalizeOrigin(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
}

/** Canonical public origin for metadata, sitemap, auth redirects, and absolute asset URLs (no trailing slash). */
export function getSiteUrl(): string {
  const candidates = [
    (process.env.NEXT_PUBLIC_SITE_URL || "").trim(),
    (process.env.STOREFRONT_URL || "").trim(),
    (process.env.VERCEL_PROJECT_PRODUCTION_URL || "").trim(),
    (process.env.VERCEL_URL || "").trim(),
    "https://www.garthheckman.com",
  ]
    .filter(Boolean)
    .map((value) => normalizeOrigin(value));

  return candidates.find((origin) => !isLocalOrigin(origin)) || "https://www.garthheckman.com";
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
