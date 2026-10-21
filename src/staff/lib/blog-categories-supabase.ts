import "server-only";

import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentAdminStoreId } from "@/lib/current-admin-store";
import { GARTH_STORE_ID } from "@/lib/tenant-store";
import type { BlogCategoryInput, BlogCategoryWithCount } from "@/services/blog-categories";

type Row = { id: string; store_id: string; name: string; slug: string; description: string | null; created_at: string; deleted_at: string | null };

function map(row: Row, postCount = 0): BlogCategoryWithCount {
  return { id: row.id, name: row.name, slug: row.slug, description: row.description || "", createdAt: row.created_at, deletedAt: row.deleted_at, postCount };
}

async function rows(trash = false, storeIdOverride?: string) {
  if (!isSupabaseConfigured()) throw new Error("Database is not configured");
  const storeId = storeIdOverride || (await getCurrentAdminStoreId());
  const supabase = createSupabaseAdmin();
  let query = supabase.from("blog_categories").select("*").eq("store_id", storeId).order("created_at", { ascending: false });
  query = trash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const { data: posts } = await supabase.from("blog_posts").select("category, category_id").eq("store_id", storeId);
  const counts = new Map<string, number>();
  for (const post of posts || []) {
    const key = String(post.category_id || post.category || "");
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return (data as Row[] || []).map((row) => map(row, counts.get(row.id) || counts.get(row.name) || 0));
}

export const listBlogCategoriesFromDb = (trash = false) => rows(trash);
export async function listPublicBlogCategoriesFromDb() {
  return rows(false, GARTH_STORE_ID);
}
export async function countBlogCategoryTrashFromDb() { return (await rows(true)).length; }
export async function getBlogCategoryFromDb(id: string) { return (await rows()).find((row) => row.id === id) || null; }

export async function createBlogCategoryInDb(input: BlogCategoryInput) {
  const storeId = await getCurrentAdminStoreId();
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("blog_categories").insert({ store_id: storeId, name: input.name.trim(), slug: input.slug.trim(), description: input.description.trim() }).select("*").single();
  if (error || !data) throw new Error(error?.message || "Failed to create category");
  return map(data as Row);
}

export async function updateBlogCategoryInDb(id: string, input: Partial<BlogCategoryInput>) {
  const storeId = await getCurrentAdminStoreId();
  const supabase = createSupabaseAdmin();
  const current = await getBlogCategoryFromDb(id);
  if (!current) throw new Error("Category not found");
  const { data, error } = await supabase.from("blog_categories").update({ name: input.name?.trim() || current.name, slug: input.slug?.trim() || current.slug, description: input.description ?? current.description, updated_at: new Date().toISOString() }).eq("id", id).eq("store_id", storeId).select("*").single();
  if (error || !data) throw new Error(error?.message || "Failed to update category");
  if (input.name && input.name.trim() !== current.name) await supabase.from("blog_posts").update({ category: input.name.trim() }).eq("store_id", storeId).eq("category", current.name);
  return map(data as Row);
}

export async function trashBlogCategoryInDb(id: string, restore = false, permanent = false) {
  const storeId = await getCurrentAdminStoreId();
  const supabase = createSupabaseAdmin();
  const current = await getBlogCategoryFromDb(id) || (await rows(true)).find((row) => row.id === id);
  if (!current) throw new Error("Category not found");
  if (permanent) {
    const fallback = (await rows()).find((row) => row.id !== id)?.name || "Uncategorized";
    await supabase.from("blog_posts").update({ category: fallback }).eq("store_id", storeId).eq("category", current.name);
    const { error } = await supabase.from("blog_categories").delete().eq("id", id).eq("store_id", storeId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("blog_categories").update({ deleted_at: restore ? null : new Date().toISOString() }).eq("id", id).eq("store_id", storeId);
    if (error) throw new Error(error.message);
  }
}
