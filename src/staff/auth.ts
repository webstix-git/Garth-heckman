import { createClient } from "@/lib/supabase/server";
import {
  isAdminUser,
  toAdminUserFromSupabase,
  type AdminAuthSession,
} from "@/lib/admin-auth";

/**
 * Server-side staff session via email/password auth.
 * Returns null when signed out or the user is not an allowlisted admin.
 */
export async function auth(): Promise<AdminAuthSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) return null;
  return { user: toAdminUserFromSupabase(user) };
}

/** Kept for older imports — sessions refresh via auth(). */
export async function unstable_update(): Promise<AdminAuthSession | null> {
  return auth();
}
