import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { isAdminUser } from "@/lib/admin-auth";

const SELECTED_STORE_COOKIE = "admin-selected-store";

/**
 * Server-side admin tenant boundary. This is intentionally derived from the
 * authenticated user and store_memberships, never from a browser store_id.
 */
export async function getCurrentAdminStoreId(): Promise<string> {
  const session = await createClient();
  const { data: { user }, error: userError } = await session.auth.getUser();
  if (userError || !user) throw new Error("Admin authentication is required.");

  const admin = createSupabaseAdmin();
  const selectedStoreId = (await cookies()).get(SELECTED_STORE_COOKIE)?.value;
  const selectedQuery = admin
    .from("store_memberships")
    .select("store_id, status")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (selectedStoreId) {
    const { data: selected, error: selectedError } = await selectedQuery
      .eq("store_id", selectedStoreId)
      .maybeSingle();
    if (selectedError) throw new Error(selectedError.message);
    if (selected) return selected.store_id;
    if (user.app_metadata?.role === "super_admin" && isAdminUser(user)) {
      const { data: store } = await admin.from("stores").select("id").eq("id", selectedStoreId).eq("status", "active").maybeSingle();
      if (store) return store.id;
    }
    throw new Error("Selected store is not available to this admin.");
  }

  const { data, error } = await admin
    .from("store_memberships")
    .select("store_id, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(2);

  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("This admin user is not assigned to a store.");
  if (data.length > 1) throw new Error("Select an active store before continuing.");
  return data[0].store_id;
}
