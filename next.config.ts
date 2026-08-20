import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* A stray package-lock.json in the home directory makes Turbopack infer
     /Users/bee as the workspace root, which would pull the whole home folder
     into the module graph. Pin it to this project. */
  turbopack: { root: path.resolve(__dirname) },

  images: {
    // Product and editorial imagery will come from Supabase storage.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
