import "server-only";

import {
  countBlogPostsFromDb,
  countBlogTrashFromDb,
  createBlogPostInDb,
  deleteBlogPostInDb,
  getBlogPostByIdFromDb,
  listBlogPostsFromDb,
  permanentlyDeleteBlogPostInDb,
  reassignBlogCategoryInDb,
  renameBlogCategoryInDb,
  restoreBlogPostInDb,
  updateBlogPostInDb,
} from "@/lib/blog-supabase";
import { buildPostSeo } from "@/lib/post-seo";
import { matchesSearch, paginate, sortByKey } from "@/services/delay";
import type { BlogPost, BlogPostInput, BlogPostStatus, PaginatedResult } from "@/types";
import { countBlogCategoryTrashFromDb, createBlogCategoryInDb, getBlogCategoryFromDb, listBlogCategoriesFromDb, trashBlogCategoryInDb, updateBlogCategoryInDb } from "@/lib/blog-categories-supabase";

export const listBlogCategories = (trash = false) => listBlogCategoriesFromDb(trash);
export const countTrashedBlogCategories = countBlogCategoryTrashFromDb;
export const getBlogCategory = getBlogCategoryFromDb;
export const createBlogCategory = createBlogCategoryInDb;
export const updateBlogCategory = updateBlogCategoryInDb;
export const trashBlogCategory = (id: string) => trashBlogCategoryInDb(id);
export const restoreBlogCategory = (id: string) => trashBlogCategoryInDb(id, true);
export const permanentlyDeleteBlogCategory = (id: string) => trashBlogCategoryInDb(id, false, true);

export interface BlogListParams {
  search?: string;
  status?: BlogPostStatus | "all";
  category?: string | "all";
  tag?: string | "all";
  page?: number;
  pageSize?: number;
  sortBy?: keyof BlogPost;
  sortDir?: "asc" | "desc";
  trash?: boolean;
}

async function loadPosts(options?: { trash?: boolean }): Promise<BlogPost[]> {
  const result = await listBlogPostsFromDb(options);
  if (!result.ok) {
    throw new Error(result.error || "Failed to load blog posts");
  }
  return result.posts;
}

export async function listPosts(
  params: BlogListParams = {},
): Promise<PaginatedResult<BlogPost>> {
  const {
    search,
    status = "all",
    category = "all",
    tag = "all",
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortDir = "desc",
    trash = false,
  } = params;

  const posts = await loadPosts({ trash });
  let rows = posts.filter((p) => {
    const hay = `${p.title} ${p.author} ${p.category} ${p.tags.join(" ")}`;
    if (!matchesSearch(hay, search)) return false;
    if (status !== "all" && p.status !== status) return false;
    if (category !== "all" && p.category !== category) return false;
    if (tag !== "all" && !p.tags.includes(tag)) return false;
    return true;
  });

  rows = sortByKey(rows, sortBy, sortDir);
  return paginate(rows, page, pageSize);
}

export async function getPost(id: string): Promise<BlogPost | null> {
  const result = await getBlogPostByIdFromDb(id);
  if (!result.ok || !result.post) return null;
  return result.post;
}

export async function createPost(input: BlogPostInput): Promise<BlogPost> {
  const generated = buildPostSeo(input);
  const payload: BlogPostInput = {
    ...input,
    seo: {
      title: input.seo.title.trim() || generated.title,
      description: input.seo.description.trim() || generated.description,
      noindex: Boolean(input.seo.noindex),
      nofollow: Boolean(input.seo.nofollow),
    },
  };
  const result = await createBlogPostInDb(payload);
  if (!result.ok || !result.post) {
    throw new Error(result.error || "Failed to create post");
  }
  return result.post;
}

export async function updatePost(
  id: string,
  input: Partial<BlogPostInput>,
): Promise<BlogPost> {
  const result = await updateBlogPostInDb(id, input);
  if (!result.ok || !result.post) {
    throw new Error(result.error || "Failed to update post");
  }
  return result.post;
}

export async function setPostStatus(
  id: string,
  status: BlogPostStatus,
): Promise<BlogPost> {
  return updatePost(id, {
    status,
    publishedAt: status === "published" ? new Date().toISOString() : undefined,
  });
}

export async function deletePost(id: string): Promise<void> {
  const result = await deleteBlogPostInDb(id);
  if (!result.ok) {
    throw new Error(result.error || "Failed to move post to trash");
  }
}

export async function trashPost(id: string): Promise<void> {
  return deletePost(id);
}

export async function restorePost(id: string): Promise<void> {
  const result = await restoreBlogPostInDb(id);
  if (!result.ok) {
    throw new Error(result.error || "Failed to restore post");
  }
}

export async function permanentlyDeletePost(id: string): Promise<void> {
  const result = await permanentlyDeleteBlogPostInDb(id);
  if (!result.ok) {
    throw new Error(result.error || "Failed to delete post");
  }
}

export async function duplicatePost(id: string): Promise<BlogPost> {
  const post = await getPost(id);
  if (!post) throw new Error("Post not found");

  const stamp = Date.now().toString(36);
  return createPost({
    title: `${post.title} (Copy)`,
    slug: `${post.slug}-copy-${stamp}`,
    excerpt: post.excerpt,
    content: post.content,
    featuredImage: post.featuredImage,
    author: post.author,
    category: post.category,
    tags: [...post.tags],
    status: "draft",
    publishedAt: undefined,
    seo: {
      title: post.seo.title ? `${post.seo.title} (Copy)` : "",
      description: post.seo.description,
      noindex: Boolean(post.seo.noindex),
      nofollow: Boolean(post.seo.nofollow),
    },
  });
}

export async function renamePostCategory(from: string, to: string) {
  await renameBlogCategoryInDb(from, to);
}

export async function reassignPostCategory(from: string, to: string) {
  await reassignBlogCategoryInDb(from, to);
}

export async function getPostsSnapshot(): Promise<BlogPost[]> {
  return loadPosts();
}

export async function countBlogPosts(): Promise<number> {
  const result = await countBlogPostsFromDb();
  return result.ok ? result.count : 0;
}

export async function countBlogTrash(): Promise<number> {
  return countBlogTrashFromDb();
}
