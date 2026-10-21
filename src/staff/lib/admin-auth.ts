import type { User } from "@supabase/supabase-js";

import type { AdminUser } from "@/types";

/** Comma-separated allowlist. Defaults to AUTH_ADMIN_EMAIL. */
export function getAdminEmailAllowlist(): string[] {
  const raw =
    process.env.AUTH_ADMIN_EMAILS ||
    process.env.AUTH_ADMIN_EMAIL ||
    "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user?.email) return false;
  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  if (role === "admin" || role === "Administrator") return true;
  const allow = getAdminEmailAllowlist();
  if (allow.length === 0) return false;
  return allow.includes(user.email.toLowerCase());
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
 * Uses email + user_metadata / app_metadata only.
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
