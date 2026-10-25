import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { AdminUser } from "@/types";

/** Platform-level roles are stored in Supabase app_metadata, not user-editable metadata. */
export function isAdminUser(user: User | null | undefined): boolean {
  const role = user?.app_metadata?.role;
  return role === "admin" || role === "Administrator" || role === "super_admin";
}

/**
 * Store-level admin access comes from the database membership row for this user.
 * The caller supplies either the session client (RLS-protected) or the server
 * admin client for server-side authorization checks.
 */
export async function hasDatabaseAdminAccess(
  user: User | null | undefined,
  client: SupabaseClient,
): Promise<boolean> {
  if (!user) return false;
  if (isAdminUser(user)) return true;

  const { data, error } = await client
    .from("store_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  return !error && Boolean(data?.length);
}

function metaString(meta: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

/**
 * Map an auth user → admin UI model.
 * Uses the authenticated Supabase user for display data only.
 */
export function toAdminUserFromSupabase(user: User): AdminUser {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email ?? "";
  const emailLocal = email.includes("@") ? email.split("@")[0] : email;

  const username =
    metaString(meta, "username", "preferred_username", "user_name") ||
    emailLocal ||
    "admin";

  const role =
    (typeof user.app_metadata?.role === "string" && user.app_metadata.role) ||
    metaString(meta, "role") ||
    "Administrator";

  const avatar =
    metaString(meta, "avatar_url", "picture", "image", "avatar") ||
    "";

  return {
    id: user.id,
    // `name` mirrors username for headers / welcome text.
    name: username,
    username,
    email,
    role,
    phone: metaString(meta, "phone", "phone_number") || user.phone || undefined,
    avatar,
  };
}

export type AdminAuthSession = {
  user: AdminUser;
};
