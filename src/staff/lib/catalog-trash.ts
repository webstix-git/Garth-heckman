import "server-only";

import { TRASH_RETENTION_DAYS } from "@/lib/trash-retention";
import { getStoreId } from "@/lib/store-id";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export { TRASH_RETENTION_DAYS };

const STORE_ID = getStoreId();
const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
export type TrashTable = "products" | "categories" | "blog_posts";

const trashColumnCache = new Map<TrashTable, boolean>();

export function trashPurgeAt(deletedAt: string): Date {
  return new Date(new Date(deletedAt).getTime() + TRASH_RETENTION_MS);
}

export function trashDaysRemaining(deletedAt: string): number {
  const ms = trashPurgeAt(deletedAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/** True when `deleted_at` exists (APPLY_CATALOG_TRASH.sql has been run). */
export async function hasTrashColumn(table: TrashTable): Promise<boolean> {
  const cached = trashColumnCache.get(table);
  if (cached !== undefined) return cached;
  if (!isSupabaseConfigured()) {
    trashColumnCache.set(table, false);
    return false;
  }
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from(table).select("deleted_at").limit(1);
  const supported = !error;
  trashColumnCache.set(table, supported);
  return supported;
}

type TrashFilterable = {
  is(column: string, value: null): TrashFilterable;
  not(column: string, operator: "is", value: null): TrashFilterable;
};

export function applyTrashFilter<T extends TrashFilterable>(
  query: T,
  trash: boolean,
  supported: boolean,
): T {
  if (!supported) return query as T;
  return (trash
    ? query.not("deleted_at", "is", null)
    : query.is("deleted_at", null)) as T;
}

let lastPurgeAt = 0;
const PURGE_INTERVAL_MS = 60 * 60 * 1000;

export async function purgeExpiredCatalogTrash(force = false): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const productsTrash = await hasTrashColumn("products");
  const categoriesTrash = await hasTrashColumn("categories");
  const blogTrash = await hasTrashColumn("blog_posts");
  if (!productsTrash && !categoriesTrash && !blogTrash) return;

  const now = Date.now();
  if (!force && now - lastPurgeAt < PURGE_INTERVAL_MS) return;
  lastPurgeAt = now;
  const supabase = createSupabaseAdmin();
  const cutoff = new Date(Date.now() - TRASH_RETENTION_MS).toISOString();

  if (productsTrash) {
    await supabase
      .from("products")
      .delete()
      .eq("store_id", STORE_ID)
      .not("deleted_at", "is", null)
      .lt("deleted_at", cutoff);
  }

  if (categoriesTrash) {
    await supabase
      .from("categories")
      .delete()
      .eq("store_id", STORE_ID)
      .not("deleted_at", "is", null)
      .lt("deleted_at", cutoff);
  }

  if (blogTrash) {
    await supabase
      .from("blog_posts")
      .delete()
      .eq("store_id", STORE_ID)
      .not("deleted_at", "is", null)
      .lt("deleted_at", cutoff);
  }
}
