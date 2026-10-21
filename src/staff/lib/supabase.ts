import "server-only";

import { createClient } from "@supabase/supabase-js";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function isSupabaseAdminConfigured() {
  return Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  );
}

export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Database publishable env is not set");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required for admin access");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
