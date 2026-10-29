import type { MetadataRoute } from "next";

import { listPublishedPosts } from "@/lib/blog-public";
import { listStorefrontProducts } from "@/lib/catalog-public";
import { SHORTS_POST_TYPE } from "@/lib/custom-posts";
import { listCustomPosts } from "@/lib/custom-posts-server";
import { PAGE_SEO } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";

/** HTML sitemap is for humans — keep it out of the XML sitemap. */
const XML_SITEMAP_EXCLUDE = new Set(["/sitemap"]);

const STATIC_PATHS = Object.keys(PAGE_SEO).filter(
  (path) => !XML_SITEMAP_EXCLUDE.has(path),
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/store" || path === "/speaking" ? 0.9 : 0.7,
  }));

  const [posts, products, shorts] = await Promise.all([
    listPublishedPosts().catch(() => []),
    listStorefrontProducts().catch(() => []),
    listCustomPosts(SHORTS_POST_TYPE).catch(() => null),
  ]);

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => {
    const parsed = Date.parse(post.date);
    return {
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: Number.isFinite(parsed) ? new Date(parsed) : now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    };
  });

  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => !p.seo?.noindex)
    .map((product) => ({
      url: absoluteUrl(`/product/${product.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const shortEntries: MetadataRoute.Sitemap = (shorts?.posts || []).map((item) => {
    const parsed = item.publishedAt ? Date.parse(item.publishedAt) : NaN;
    return {
      url: absoluteUrl(`/shorts/${item.slug}`),
      lastModified: Number.isFinite(parsed) ? new Date(parsed) : now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    };
  });

  return [...staticEntries, ...blogEntries, ...productEntries, ...shortEntries];
}
