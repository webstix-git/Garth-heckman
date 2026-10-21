"use client";

import type { Category, CategoryInput } from "@/types";

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || fallback);
  }
  return res.json() as Promise<T>;
}

export async function listCategories(
  search?: string,
  options?: { trash?: boolean },
): Promise<Category[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (options?.trash) params.set("trash", "1");
  const q = params.toString();
  const res = await fetch(`/api/store/categories${q ? `?${q}` : ""}`);
  const json = await readJson<{ data: Category[] }>(res, "Failed to load categories");
  return json.data;
}

export async function getCategory(id: string): Promise<Category | null> {
  const res = await fetch(`/api/store/categories/${id}`);
  if (res.status === 404) return null;
  const json = await readJson<{ data: Category }>(res, "Failed to load category");
  return json.data;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const res = await fetch(`/api/store/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await readJson<{ data: Category }>(res, "Failed to create category");
  return json.data;
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>,
): Promise<Category> {
  const res = await fetch(`/api/store/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await readJson<{ data: Category }>(res, "Failed to update category");
  return json.data;
}

export async function trashCategory(id: string): Promise<void> {
  const res = await fetch(`/api/store/categories/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to move category to trash");
  }
}

export async function restoreCategory(id: string): Promise<void> {
  const res = await fetch(`/api/store/categories/${id}/restore`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to restore category");
  }
}

export async function permanentlyDeleteCategory(id: string): Promise<void> {
  const res = await fetch(`/api/store/categories/${id}?permanent=1`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to delete category");
  }
}

/** Move to trash (not permanent delete). */
export async function deleteCategory(id: string): Promise<void> {
  return trashCategory(id);
}

export async function trashCategories(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => trashCategory(id)));
}

export async function deleteCategories(ids: string[]): Promise<void> {
  return trashCategories(ids);
}

export async function countTrashCategories(): Promise<number> {
  const res = await fetch("/api/store/categories?trashCount=1");
  const json = await readJson<{ data: { count: number } }>(res, "Failed to load trash count");
  return json.data.count;
}
