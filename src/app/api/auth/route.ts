import { NextRequest, NextResponse } from "next/server";

import { hasDatabaseAdminAccess, toAdminUserFromSupabase } from "@/lib/admin-auth";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type AuthBody = {
  email?: string;
  password?: string;
  admin?: boolean;
  action?: "reset";
  /** Customer forgot-password redirects to /account/reset-password */
  customer?: boolean;
};

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || !(await hasDatabaseAdminAccess(data.user, supabase))) {
    return NextResponse.json({ data: null }, { status: 401 });
  }

  return NextResponse.json({ data: { user: toAdminUserFromSupabase(data.user) } });
}

export async function POST(request: NextRequest) {
  let body: AuthBody;
  try {
    body = (await request.json()) as AuthBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password || "";
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = await createClient();
  if (body.action === "reset") {
    const limited = rateLimit(`fe-password-reset:${clientIp(request)}`, 5, 15 * 60 * 1000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);
    const origin = request.nextUrl.origin;
    const redirectTo = body.customer
      ? `${origin}/account/reset-password`
      : `${origin}/admin/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    // Always succeed outwardly so we don't reveal whether the email exists.
    if (error) console.error("[auth:reset]", error.message);
    return NextResponse.json({ data: null });
  }

  if (!password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json({ error: message(error, "Invalid email or password") }, { status: 401 });
  }

  if (body.admin && !(await hasDatabaseAdminAccess(data.user, supabase))) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "This account is not authorized for store admin." }, { status: 403 });
  }

  return NextResponse.json({ data: { user: toAdminUserFromSupabase(data.user) } });
}

export async function DELETE() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: null });
}
