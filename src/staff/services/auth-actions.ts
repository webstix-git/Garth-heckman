"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@/auth";
import { hasDatabaseAdminAccess, toAdminUserFromSupabase } from "@/lib/admin-auth";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { AdminUser } from "@/types";

/** Persist profile fields into auth user metadata (+ optional email). */
export async function updateProfile(
  patch: Partial<Omit<AdminUser, "id" | "role">>,
): Promise<AdminUser> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");

  const supabase = await createClient();
  const {
    data: { user: current },
    error: currentError,
  } = await supabase.auth.getUser();

  if (currentError || !current) {
    throw new Error(currentError?.message || "Not signed in");
  }

  const username =
    (patch.username ?? current.user_metadata?.username ?? "").toString().trim() ||
    (current.email || "").split("@")[0] ||
    "admin";

  const nextMeta = {
    ...(current.user_metadata ?? {}),
    // Display name follows username only (no separate full name / bio).
    username,
    name: username,
    full_name: username,
    phone: patch.phone ?? current.user_metadata?.phone,
    avatar_url: patch.avatar ?? current.user_metadata?.avatar_url,
    // Keep admin role so login still works after an email change.
    role: current.user_metadata?.role || current.app_metadata?.role || "admin",
  };
  delete (nextMeta as { bio?: unknown }).bio;

  const requestedEmail = patch.email?.trim().toLowerCase() || "";
  const currentEmail = (current.email || "").toLowerCase();
  const emailChanging = Boolean(requestedEmail && requestedEmail !== currentEmail);

  // Metadata only here — email changes go through the admin API so they apply
  // immediately (user updateUser leaves email pending until confirmation).
  const { data, error } = await supabase.auth.updateUser({ data: nextMeta });

  if (error || !data.user) {
    throw new Error(error?.message || "Unable to update profile");
  }

  let user = data.user;

  if (emailChanging) {
    if (!isSupabaseConfigured()) {
      throw new Error("Database is not configured — cannot update email");
    }

    const admin = createSupabaseAdmin();
    const { data: adminData, error: adminError } = await admin.auth.admin.updateUserById(
      current.id,
      {
        email: requestedEmail,
        email_confirm: true,
        user_metadata: nextMeta,
      },
    );

    if (adminError || !adminData.user) {
      throw new Error(
        adminError?.message ||
          "Could not update email. Check that the address is valid and not already in use.",
      );
    }

    user = adminData.user;

    // Refresh the signed-in session user so the UI reads the new email.
    const { data: refreshed, error: refreshError } = await supabase.auth.getUser();
    if (!refreshError && refreshed.user) {
      user = refreshed.user;
    }
  }

  if (!(await hasDatabaseAdminAccess(user, supabase))) {
    throw new Error(
      "Email updated, but this account is not assigned an active admin membership.",
    );
  }

  const mapped = toAdminUserFromSupabase(user);

  // Prefer the requested email if Auth still returns the previous one briefly.
  if (emailChanging && mapped.email.toLowerCase() !== requestedEmail) {
    return { ...mapped, email: requestedEmail };
  }

  return mapped;
}

export async function changePassword(next: string): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");
  if (next.length < 8) throw new Error("New password must be at least 8 characters");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) throw new Error(error.message);
}

/** Fresh profile from the signed-in auth user (server). */
export async function getProfile(): Promise<AdminUser> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !(await hasDatabaseAdminAccess(user, supabase))) {
    throw new Error(error?.message || "Not signed in");
  }

  return toAdminUserFromSupabase(user);
}
