import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestStoreId } from "@/lib/tenant-store";
import { isAdminUser } from "@/lib/admin-auth";

export type AdminContext = {
  userId: string;
  email: string | null;
  storeId: string;
  role: string;
};

/**
 * One server-side authorization boundary for every staff API and service.
 * The tenant comes from the request host and membership, never from request JSON.
 */
export async function requireAdminContext(): Promise<AdminContext> {
  const session = await createClient();
  const { data, error } = await session.auth.getUser();
  if (error || !data.user || !isAdminUser(data.user)) {
    throw new Error("Admin authentication is required.");
  }

  const storeId = await getRequestStoreId();
  const admin = createAdminClient();
  const { data: membership, error: membershipError } = await admin
    .from("store_memberships")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", data.user.id)
    .eq("status", "active")
    .maybeSingle();

  const platformRole = data.user.app_metadata?.role;
  if (membershipError) throw new Error("Unable to verify store membership.");
  if (!membership && platformRole !== "super_admin") {
    throw new Error("You are not authorized for this store.");
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    storeId,
    role: platformRole === "super_admin" ? "super_admin" : membership?.role ?? "viewer",
  };
}

