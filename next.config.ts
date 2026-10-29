import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* A stray package-lock.json in the home directory makes Turbopack infer
     /Users/bee as the workspace root, which would pull the whole home folder
     into the module graph. Pin it to this project. */
  turbopack: { root: path.resolve(__dirname) },

  experimental: {
    // Use the TypeScript compiler API with the project's TypeScript 5.x.
    // Next's CLI checker currently fails to parse its --showConfig output in
    // this environment even though `tsc --noEmit` passes.
    useTypeScriptCli: false,
    // Product gallery / media uploads often exceed the 10MB proxy default.
    // Truncated bodies surface as "Failed to parse body as FormData".
    proxyClientMaxBodySize: "32mb",
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Product and editorial imagery from Supabase (+ production CDN).
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "garthheckman.com" },
      { protocol: "https", hostname: "www.garthheckman.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },

  async rewrites() {
    const adminBackendUrl = String(process.env.ADMIN_BACKEND_URL || process.env.BACKEND_URL || "").trim().replace(/\/$/, "");
    const adminZone = adminBackendUrl
      ? [
          // The backend owns the admin HTML/RSC routes. Keeping this as an
          // external rewrite masks the backend origin in the browser.
          { source: "/admin", destination: `${adminBackendUrl}/admin` },
          { source: "/admin/:path*", destination: `${adminBackendUrl}/admin/:path*` },
        ]
      : [];

    // Admin UI is proxied from the backend, but browser fetch("/api/...") hits
    // this frontend origin. Local route handlers win first; anything else
    // (contact-submissions, orders, store settings, …) goes to the backend.
    const adminApiProxy = adminBackendUrl
      ? [{ source: "/api/:path*", destination: `${adminBackendUrl}/api/:path*` }]
      : [];

    return {
      beforeFiles: adminZone,
      afterFiles: [
        { source: "/api/store/:path*", destination: "/api/staff/:path*" },
        ...adminApiProxy,
      ],
    };
  },

  async redirects() {
    const legacy = [
      "login",
      "dashboard",
      "products",
      "categories",
      "orders",
      "customers",
      "media",
      "settings",
      "printify",
      "contact-submissions",
      "profile",
    ];

    /** Old Wix / prior site paths → current App Router pages (301). */
    const oldSite: Array<{ source: string; destination: string }> = [
      // Marketing / nav pages
      { source: "/event-list", destination: "/simply-church" },
      { source: "/inquiry-services-page", destination: "/contact" },
      { source: "/start-here", destination: "/work" },
      { source: "/single-project", destination: "/work" },
      { source: "/brotherhood", destination: "/simply-church" },
      { source: "/shop", destination: "/store" },
      { source: "/the-movement", destination: "/work" },
      { source: "/train-with-garth", destination: "/coaching" },

      // Simply Church event calendar (all dated event-detail URLs)
      { source: "/event-details", destination: "/simply-church" },
      { source: "/event-details/:path*", destination: "/simply-church" },

      // Store / catalog
      { source: "/category/all-products", destination: "/store" },
      { source: "/category/:path*", destination: "/store" },

      // Product pages (old /product-page/:slug → current /product/:slug)
      { source: "/product-page/wtfu-by-garth-heckman", destination: "/product/wtfu-book" },
      { source: "/product-page/365-days-of-strength", destination: "/product/365-quotes" },
      { source: "/product-page/365-cancer-fighter-journal", destination: "/product/365-day-journal" },
      { source: "/product-page/cancer-terminology-made-simple", destination: "/product/cancer-terminology" },
      {
        source: "/product-page/the-faith-based-cancer-survival-mindset-manual",
        destination: "/product/faith-based-cancer-survival-mindset-manual",
      },
      {
        source: "/product-page/nourishing-your-body-through-cancer",
        destination: "/product/nourishing-your-body-through-cancer",
      },
      // Bundle had no 1:1 product — land on cancer resources / store
      { source: "/product-page/faith-based-cancer-bundle", destination: "/cancer" },
      { source: "/product-page/:slug", destination: "/store" },
    ];

    return [
      ...oldSite.map((r) => ({ ...r, permanent: true })),
      { source: "/categories", destination: "/store", permanent: false },
      { source: "/categories/:path*", destination: "/store", permanent: false },
      ...legacy.map((segment) => ({
        source: `/${segment}`,
        destination: `/admin/${segment}`,
        permanent: false,
      })),
      ...legacy.map((segment) => ({
        source: `/${segment}/:path*`,
        destination: `/admin/${segment}/:path*`,
        permanent: false,
      })),
    ];
  },

  async headers() {
    const publicRobots =
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
    const privateRobots = "noindex, nofollow";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Robots-Tag", value: publicRobots },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
      // Private / transactional routes override the public X-Robots-Tag.
      ...["/account/:path*", "/checkout", "/checkout/:path*", "/cart", "/downloads", "/order-confirmation", "/thank-you", "/admin/:path*"].map(
        (source) => ({
          source,
          headers: [{ key: "X-Robots-Tag", value: privateRobots }],
        }),
      ),
    ];
  },
};

export default nextConfig;
