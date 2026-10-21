import "server-only";

import { BackendError, backendFetch } from "@/lib/backend-catalog";
import type { CustomPost, CustomPostList, CustomPostType } from "@/lib/custom-posts";

const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;

/** Published posts of one type. Null when the type doesn't exist or Custom Posts is switched off. */
export async function listCustomPosts(
  type: string,
  query: { limit?: number; offset?: number; category?: string; q?: string; sort?: string } = {},
): Promise<CustomPostList | null> {
  if (!SLUG.test(type)) return null;
  const params = new URLSearchParams({ limit: String(query.limit ?? 100) });
  if (query.offset) params.set("offset", String(query.offset));
  if (query.category) params.set("category", query.category);
  if (query.q) params.set("q", query.q);
  if (query.sort) params.set("sort", query.sort);
  try {
    return await backendFetch<CustomPostList>(`/api/storefront/custom-posts/${type}?${params}`);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) return null;
    console.error("[custom-posts]", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getCustomPost(type: string, slug: string): Promise<{ type: CustomPostType; post: CustomPost } | null> {
  if (!SLUG.test(type) || !SLUG.test(slug)) return null;
  try {
    return await backendFetch<{ type: CustomPostType; post: CustomPost }>(`/api/storefront/custom-posts/${type}/${slug}`);
  } catch (error) {
    if (!(error instanceof BackendError && error.status === 404)) console.error("[custom-posts]", error instanceof Error ? error.message : error);
    return null;
  }
}
