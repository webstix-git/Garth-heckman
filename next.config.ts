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
    // Product and editorial imagery will come from Supabase storage.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
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

    return {
      beforeFiles: adminZone,
      afterFiles: [{ source: "/api/store/:path*", destination: "/api/staff/:path*" }],
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
    return [
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
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
