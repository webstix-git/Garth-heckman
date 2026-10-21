import "server-only";

import type { Address, Category, CategoryInput, Customer, CustomerStatus } from "@/types";
import { applyTrashFilter, hasTrashColumn, purgeExpiredCatalogTrash } from "@/lib/catalog-trash";
import {
  fetchCategoryProductCountsFromSupabase,
  fetchCustomersFromSupabase,
} from "@/lib/products-supabase";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentAdminStoreId } from "@/lib/current-admin-store";

type DbCustomer = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

type DbAddress = {
  id: string;
  customer_id: string;
  first_name: string | null;
  last_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
};

type DbCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  deleted_at?: string | null;
};

function mapCustomerStatus(status: string): CustomerStatus {
  return status === "active" ? "active" : "inactive";
}

function mapAddress(row: DbAddress): Address {
  return {
    name: [row.first_name, row.last_name].filter(Boolean).join(" ") || "Customer",
    line1: row.address_line_1 || "",
    line2: row.address_line_2 || undefined,
    city: row.city || "",
    state: row.state || "",
    postalCode: row.postal_code || "",
    country: row.country || "United States",
    phone: row.phone || undefined,
  };
}

export async function listCustomersFromDb(): Promise<{
  ok: boolean;
  customers: Customer[];
  error?: string;
}> {
  const result = await fetchCustomersFromSupabase();
  if (!result.ok) return { ok: false, customers: [], error: result.error };

  const rows = result.customers as DbCustomer[];
  if (!rows.length) return { ok: true, customers: [] };

  const supabase = createSupabaseAdmin();
  const storeId = await getCurrentAdminStoreId();
  const ids = rows.map((r) => r.id);
  const { data: addrRows } = await supabase
    .from("customer_addresses")
    .select("*")
    .in("customer_id", ids);

  const addrsByCustomer = new Map<string, Address[]>();
  for (const addr of (addrRows || []) as DbAddress[]) {
    const list = addrsByCustomer.get(addr.customer_id) || [];
    list.push(mapAddress(addr));
    addrsByCustomer.set(addr.customer_id, list);
  }

  // Aggregate spend/count from orders by email when available
  const { data: orderRows } = await supabase
    .from("orders")
    .select("customer_email, grand_total_cents, payment_status")
    .eq("store_id", storeId);

  const byEmail = new Map<string, { count: number; spent: number }>();
  for (const order of orderRows || []) {
    const email = String((order as { customer_email?: string }).customer_email || "").toLowerCase();
    if (!email) continue;
    const current = byEmail.get(email) || { count: 0, spent: 0 };
    current.count += 1;
    const paid = (order as { payment_status?: string }).payment_status;
    if (paid === "paid" || paid === "captured" || paid === "none") {
      current.spent += Number((order as { grand_total_cents?: number }).grand_total_cents || 0) / 100;
    }
    byEmail.set(email, current);
  }

  return {
    ok: true,
    customers: rows.map((row) => {
      const stats = byEmail.get((row.email || "").toLowerCase()) || { count: 0, spent: 0 };
      return {
        id: row.id,
        firstName: row.first_name || "",
        lastName: row.last_name || "",
        email: row.email || "",
        phone: row.phone || "",
        status: mapCustomerStatus(row.status),
        orderCount: stats.count,
        totalSpent: Math.round(stats.spent * 100) / 100,
        addresses: addrsByCustomer.get(row.id) || [],
        notes: row.notes || undefined,
        createdAt: row.created_at,
      };
    }),
  };
}

export async function listCategoriesFromDb(options?: {
  trash?: boolean;
}): Promise<{
  ok: boolean;
  categories: Category[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, categories: [], error: "Database is not configured" };
  }
  try {
    const storeId = await getCurrentAdminStoreId();
    if (options?.trash) {
      await purgeExpiredCatalogTrash();
    }
    const supabase = createSupabaseAdmin();
    const trash = Boolean(options?.trash);
    const trashSupported = await hasTrashColumn("categories");
    if (trash && !trashSupported) {
      return { ok: true, categories: [] };
    }
    let query = supabase
      .from("categories")
      .select("*")
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true });
    query = applyTrashFilter(query, trash, trashSupported);
    const [{ data, error }, productCounts] = await Promise.all([
      query,
      trash ? Promise.resolve(new Map<string, number>()) : fetchCategoryProductCountsFromSupabase(),
    ]);
    if (error) return { ok: false, categories: [], error: error.message };

    const mediaIds = ((data || []) as DbCategory[])
      .map((row) =>
        typeof row.metadata?.imageMediaId === "string" ? row.metadata.imageMediaId : ""
      )
      .filter(Boolean);
    const liveById = new Map<string, string>();
    if (mediaIds.length) {
      const mediaQuery = supabase
        .from("media")
        .select("id, public_url, deleted_at")
        .in("id", mediaIds)
        .is("deleted_at", null);
      let mediaResult = await mediaQuery;
      if (mediaResult.error?.message?.includes("media.deleted_at does not exist")) {
        const legacy = await supabase.from("media").select("id, public_url, metadata").in("id", mediaIds);
        mediaResult = {
          data: (legacy.data ?? [])
            .filter((item) => !(item.metadata && typeof item.metadata === "object" && "trashedAt" in item.metadata))
            .map((item) => ({ id: item.id, public_url: item.public_url, deleted_at: null })),
          error: legacy.error,
        } as unknown as typeof mediaResult;
      }
      for (const item of mediaResult.data ?? []) {
        if (item.public_url) liveById.set(item.id, item.public_url);
      }
    }

    const categories = ((data || []) as DbCategory[]).map((row) => {
      const imageMediaId =
        typeof row.metadata?.imageMediaId === "string" ? row.metadata.imageMediaId : undefined;
      const liveImage = imageMediaId ? liveById.get(imageMediaId) : undefined;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || "",
        image:
          liveImage ||
          (typeof row.metadata?.image === "string" && !imageMediaId
            ? row.metadata.image
            : "") ||
          "",
        imageMediaId,
        active: row.status === "active",
        productCount: productCounts.get(row.id) ?? 0,
        createdAt: row.created_at,
        deletedAt: row.deleted_at ?? null,
      };
    });
    return { ok: true, categories };
  } catch (err) {
    return {
      ok: false,
      categories: [],
      error: err instanceof Error ? err.message : "Categories fetch failed",
    };
  }
}

export async function createCategoryInDb(
  input: CategoryInput,
): Promise<{ ok: boolean; category?: Category; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Database is not configured" };
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("categories")
      .insert({
        store_id: storeId,
        name: input.name,
        slug: input.slug,
        description: input.description || "",
        status: input.active ? "active" : "hidden",
        metadata: {
          image: input.image || "",
          imageMediaId: input.imageMediaId || null,
        },
      })
      .select("*")
      .single();
    if (error || !data) return { ok: false, error: error?.message || "Insert failed" };
    const row = data as DbCategory;
    return {
      ok: true,
      category: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || "",
        image: input.image || "",
        imageMediaId: input.imageMediaId || undefined,
        active: row.status === "active",
        productCount: 0,
        createdAt: row.created_at,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Insert failed" };
  }
}

export async function updateCategoryInDb(
  id: string,
  input: Partial<CategoryInput>,
): Promise<{ ok: boolean; category?: Category; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Database is not configured" };
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const { data: existing, error: getError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
      .maybeSingle();
    if (getError || !existing) return { ok: false, error: getError?.message || "Not found" };

    const rowExisting = existing as DbCategory;
    const payload = {
      name: input.name ?? rowExisting.name,
      slug: input.slug ?? rowExisting.slug,
      description: input.description ?? rowExisting.description,
      status:
        input.active == null
          ? rowExisting.status
          : input.active
            ? "active"
            : "hidden",
      metadata: {
        ...(rowExisting.metadata || {}),
        image: input.image ?? rowExisting.metadata?.image ?? "",
        imageMediaId:
          input.imageMediaId !== undefined
            ? input.imageMediaId || null
            : rowExisting.metadata?.imageMediaId ?? null,
      },
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id)
      .eq("store_id", storeId)
      .select("*")
      .single();
    if (error || !data) return { ok: false, error: error?.message || "Update failed" };

    const listed = await listCategoriesFromDb();
    const category = listed.categories.find((c) => c.id === id);
    return category
      ? { ok: true, category }
      : { ok: false, error: "Updated but could not reload category" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function trashCategoryInDb(id: string) {
  if (!isSupabaseConfigured()) return { ok: false, error: "Database is not configured" };
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("categories");
    const now = new Date().toISOString();
    if (trashSupported) {
      const { error } = await supabase
        .from("categories")
        .update({
          deleted_at: now,
          status: "archived",
          updated_at: now,
        })
        .eq("id", id)
        .eq("store_id", storeId)
        .is("deleted_at", null);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }
    const { error } = await supabase
      .from("categories")
      .update({
        status: "archived",
        updated_at: now,
      })
      .eq("id", id)
      .eq("store_id", storeId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Trash failed" };
  }
}

export async function restoreCategoryInDb(id: string) {
  if (!isSupabaseConfigured()) return { ok: false, error: "Database is not configured" };
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("categories");
    const now = new Date().toISOString();
    if (!trashSupported) {
      return { ok: false, error: "Trash is not enabled on this database yet" };
    }
    const { error } = await supabase
      .from("categories")
      .update({
        deleted_at: null,
        status: "active",
        updated_at: now,
      })
      .eq("id", id)
      .eq("store_id", storeId)
      .not("deleted_at", "is", null);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Restore failed" };
  }
}

export async function deleteCategoryInDb(id: string) {
  if (!isSupabaseConfigured()) return { ok: false, error: "Database is not configured" };
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("categories");
    let query = supabase.from("categories").delete().eq("id", id).eq("store_id", storeId);
    if (trashSupported) {
      query = query.not("deleted_at", "is", null);
    }
    const { error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed" };
  }
}

export async function countCategoriesTrashFromDb(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const trashSupported = await hasTrashColumn("categories");
  if (!trashSupported) return 0;
  const supabase = createSupabaseAdmin();
  const storeId = await getCurrentAdminStoreId();
  let query = supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId);
  query = applyTrashFilter(query, true, trashSupported);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}
