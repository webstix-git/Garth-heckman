import "server-only";

import { fetchBackendBlog, fetchBackendBlogPost } from "@/lib/backend-blog";
import type { BlogPost } from "@/lib/blog";

export type SiteBlogPost = BlogPost & { content: string };

export async function listPublishedPosts(): Promise<SiteBlogPost[]> {
  try {
    const { posts } = await fetchBackendBlog();
    return posts as SiteBlogPost[];
  } catch (error) {
    console.error("[blog-public] backend blog failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getPublishedPost(slug: string): Promise<SiteBlogPost | null> {
  try {
    const post = await fetchBackendBlogPost(slug);
    return post ? (post as SiteBlogPost) : null;
  } catch (error) {
    console.error("[blog-public] backend post lookup failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function otherPublishedPosts(slug: string): Promise<SiteBlogPost[]> {
  const posts = await listPublishedPosts();
  return posts.filter((post) => post.slug !== slug);
}
