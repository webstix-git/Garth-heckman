"use client";

import { createClient } from "@/lib/supabase/client";
import {
  isAdminUser,
  toAdminUserFromSupabase,
} from "@/lib/admin-auth";
import type { AuthSession } from "@/types";
import { changePassword, getProfile, updateProfile } from "@/services/auth-actions";

export { changePassword, getProfile, updateProfile };

export async function login(
  email: string,
  password: string,
  _remember = true,
): Promise<AuthSession> {
  void _remember;
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    throw new Error(error?.message || "Invalid email or password");
  }

  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();
    throw new Error("This account is not authorized for store admin.");
  }

  // Seed Auth user_metadata from the real account when empty (first login).
  const meta = data.user.user_metadata ?? {};
  const userEmail = data.user.email ?? "";
  const local = userEmail.includes("@") ? userEmail.split("@")[0] : userEmail;
  if (!meta.username && userEmail) {
    await supabase.auth.updateUser({
      data: {
        ...meta,
        username: local,
        name: local,
        full_name: local,
        role: meta.role || "admin",
      },
    });
    const refreshed = await supabase.auth.getUser();
    if (refreshed.data.user) {
      return { user: toAdminUserFromSupabase(refreshed.data.user) };
    }
  }

  return { user: toAdminUserFromSupabase(data.user) };
}

export async function logout(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) return null;
  return { user: toAdminUserFromSupabase(user) };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = createClient();
  const origin =
    typeof window !== "undefined" ? window.location.origin : process.env.STOREFRONT_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${origin}/admin/login`,
  });
  if (error) throw new Error(error.message);
}
