import "server-only";

import type { BlogPost } from "@/lib/blog";
import { BackendError, backendFetch } from "@/lib/backend-catalog";

export type BackendBlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  posts: number;
};

export type BackendBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  image: string;
  publishedAt: string | null;
  tags: string[];
  category: { id: string; name: string; slug: string } | null;
};

const themes = ["warm", "dark", "cool", "light"] as const;

function estimateRead(text: string) {
  const words = text.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

/** Prefer a short first line so the pair reads as two balanced display lines. */
const TITLE_LINE_BREAKS: Record<string, [string, string]> = {
  "name the thing that will actually end it": [
    "Name the thing",
    "that will actually end it",
  ],
};

function splitTitle(title: string): [string, string] {
  const cleaned = title.trim();
  const preset = TITLE_LINE_BREAKS[cleaned.toLowerCase()];
  if (preset) return preset;
  const mid = Math.floor(cleaned.length / 2);
  const before = cleaned.lastIndexOf(" ", mid);
  const after = cleaned.indexOf(" ", mid);
  const split =
    before === -1 ? after : after === -1 ? before : mid - before <= after - mid ? before : after;
  if (split <= 0) return [cleaned, ""];
  return [cleaned.slice(0, split), cleaned.slice(split + 1)];
}

export function mapBackendBlogPost(row: BackendBlogPost, index = 0): BlogPost {
  const published = row.publishedAt ? new Date(row.publishedAt) : null;
  const validDate = published && !Number.isNaN(published.getTime()) ? published : null;
  const categoryName = row.category?.name || "Blog";
  const categorySlug = row.category?.slug || "blog";
  const excerpt = row.excerpt || "";
  return {
    slug: row.slug,
    tag: categorySlug,
    tagLabel: categoryName,
    read: estimateRead(row.content || excerpt),
    date: validDate
      ? validDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
      : "",
    dateLong: validDate
      ? validDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
      : "",
    v: themes[index % themes.length],
    t: row.title,
    h1: splitTitle(row.title),
    lede: excerpt,
    tldr: excerpt,
    d: excerpt,
    img: row.image || "",
    imgAlt: row.title,
    imgNote: categoryName,
    badges: row.tags?.length ? row.tags : row.category ? [categoryName] : [],
    quote: { text: "", cite: "" },
    cta: {
      kicker: "Keep going",
      t: "More from the blog",
      d: "Written the way Garth talks in the room.",
      href: "/blog",
      btn: "All posts",
    },
    content: row.content || "",
    seo: {
      title: row.title,
      description: excerpt,
    },
  };
}

export async function fetchBackendBlog(category?: string) {
  const params = new URLSearchParams({ limit: "100" });
  if (category?.trim()) params.set("category", category.trim());
  const payload = await backendFetch<{
    posts?: BackendBlogPost[];
    categories?: BackendBlogCategory[];
  }>(`/api/storefront/blog?${params.toString()}`);
  const posts = (payload.posts ?? []).map(mapBackendBlogPost);
  return { posts, categories: payload.categories ?? [] };
}

export async function fetchBackendBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const payload = await backendFetch<{ post?: BackendBlogPost }>(
      `/api/storefront/blog/${encodeURIComponent(slug)}`,
    );
    return payload.post ? mapBackendBlogPost(payload.post) : null;
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) return null;
    throw error;
  }
}
