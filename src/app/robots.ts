import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/account",
          "/account/",
          "/checkout",
          "/cart",
          "/downloads",
          "/order-confirmation",
          "/thank-you",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    // Hostname only (no protocol). Optional; Yandex-era Host directive.
    host: site.replace(/^https?:\/\//i, ""),
  };
}
