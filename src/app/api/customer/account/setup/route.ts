import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getRequestStoreId } from "@/lib/tenant-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Customer accounts are not configured." }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { token?: string; password?: string } | null;
  const token = body?.token?.trim() || "";
  const password = body?.password || "";
  if (!token || password.length < 8) {
    return NextResponse.json({ error: "Use a valid setup link and a password of at least 8 characters." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const storeId = await getRequestStoreId();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: setup, error: setupError } = await supabase
    .from("customer_account_setup_tokens")
    .select("id, customer_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .eq("store_id", storeId)
    .maybeSingle();

  if (setupError || !setup || setup.used_at || new Date(setup.expires_at) <= new Date()) {
    return NextResponse.json({ error: "This account setup link is invalid or has expired." }, { status: 400 });
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, email, first_name, last_name")
    .eq("id", setup.customer_id)
    .eq("store_id", storeId)
    .maybeSingle();
  if (customerError || !customer?.email) {
    return NextResponse.json({ error: "Customer record was not found." }, { status: 404 });
  }

  const { data: existingLink } = await supabase
    .from("customer_auth_links")
    .select("id")
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (existingLink) {
    return NextResponse.json({ error: "This customer account is already active. Please sign in." }, { status: 409 });
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: customer.email,
    password,
    email_confirm: true,
    user_metadata: {
      customer_id: customer.id,
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      role: "customer",
    },
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || "Could not create account." }, { status: 400 });
  }

  const { error: linkError } = await supabase.from("customer_auth_links").insert({
    customer_id: customer.id,
    auth_user_id: created.user.id,
  });
  if (linkError) {
    await supabase.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  await supabase
    .from("customer_account_setup_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", setup.id);

  return NextResponse.json({ ok: true, email: customer.email });
}
