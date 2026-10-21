"use client";

import type { BlogPost, BlogPostInput, BlogPostStatus, PaginatedResult } from "@/types";

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

function toQuery(params: BlogListParams) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.status && params.status !== "all") q.set("status", params.status);
  if (params.category && params.category !== "all") q.set("category", params.category);
  if (params.tag && params.tag !== "all") q.set("tag", params.tag);
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.sortBy) q.set("sortBy", String(params.sortBy));
  if (params.sortDir) q.set("sortDir", params.sortDir);
  if (params.trash) q.set("trash", "1");
  return q.toString();
}

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || fallback);
  }
  return res.json() as Promise<T>;
}

export async function listPosts(
  params: BlogListParams = {},
): Promise<PaginatedResult<BlogPost>> {
  const res = await fetch(`/api/store/blog?${toQuery(params)}`, { cache: "no-store" });
  const json = await readJson<{ data: PaginatedResult<BlogPost> }>(res, "Failed to load posts");
  return json.data;
}

export async function getPost(id: string): Promise<BlogPost | null> {
  const res = await fetch(`/api/store/blog/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  const json = await readJson<{ data: BlogPost }>(res, "Failed to load post");
  return json.data;
}

export async function createPost(input: BlogPostInput): Promise<BlogPost> {
  const res = await fetch("/api/store/blog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await readJson<{ data: BlogPost }>(res, "Failed to create post");
  return json.data;
}

export async function updatePost(
  id: string,
  input: Partial<BlogPostInput>,
): Promise<BlogPost> {
  const res = await fetch(`/api/store/blog/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await readJson<{ data: BlogPost }>(res, "Failed to update post");
  return json.data;
}

export async function setPostStatus(
  id: string,
  status: BlogPostStatus,
): Promise<BlogPost> {
  const res = await fetch(`/api/store/blog/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const json = await readJson<{ data: BlogPost }>(res, "Failed to update status");
  return json.data;
}

export async function deletePost(id: string): Promise<void> {
  return trashPost(id);
}

export async function trashPost(id: string): Promise<void> {
  const res = await fetch(`/api/store/blog/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to move post to trash");
  }
}

export async function restorePost(id: string): Promise<void> {
  const res = await fetch(`/api/store/blog/${encodeURIComponent(id)}/restore`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to restore post");
  }
}

export async function permanentlyDeletePost(id: string): Promise<void> {
  const res = await fetch(`/api/store/blog/${encodeURIComponent(id)}?permanent=1`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to delete post");
  }
}

export async function countTrashPosts(): Promise<number> {
  const result = await listPosts({ trash: true, pageSize: 1, page: 1 });
  return result.total;
}

export async function duplicatePost(id: string): Promise<BlogPost> {
  const res = await fetch(`/api/store/blog/${encodeURIComponent(id)}/duplicate`, {
    method: "POST",
  });
  const json = await readJson<{ data: BlogPost }>(res, "Failed to duplicate post");
  return json.data;
}
