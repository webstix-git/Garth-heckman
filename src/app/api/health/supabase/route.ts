import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Connectivity + schema check.
 * Note: Prefer a real SELECT (not head:true) — missing tables can return 204 with no error on HEAD.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message:
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();

    // Auth / project reachability
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          connected: false,
          message: authError.message,
        },
        { status: 500 },
      );
    }

    // Real SELECT — detects missing tables (PGRST205)
    const { data, error: ordersError } = await supabase.from("products").select("id, slug").limit(3);

    if (ordersError) {
      const missing =
        ordersError.code === "PGRST205" ||
        /Could not find the table/i.test(ordersError.message);

      return NextResponse.json(
        {
          ok: false,
          configured: true,
          connected: true,
          schemaReady: false,
          ordersReadable: false,
          ordersError: ordersError.message,
          ordersCode: ordersError.code,
          adminConfigured: isSupabaseAdminConfigured(),
          message: missing
            ? "Supabase project is reachable, but Phase A schema is missing. Run supabase/APPLY_PHASE_A.sql in the SQL Editor."
            : `Supabase reachable, but products query failed: ${ordersError.message}`,
          hint: missing
            ? "Dashboard → SQL Editor → paste APPLY_PHASE_A.sql → Run"
            : undefined,
        },
        { status: 503 },
      );
    }

    const { count: ordersCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true });

    let adminOk: boolean | null = null;
    if (isSupabaseAdminConfigured()) {
      try {
        const admin = createAdminClient();
        const { error: adminError } = await admin.from("orders").select("id").limit(1);
        adminOk = !adminError;
      } catch {
        adminOk = false;
      }
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      connected: true,
      schemaReady: true,
      productsSample: data?.map((p) => p.slug) ?? [],
      ordersCount: ordersCount ?? 0,
      ordersReadable: true,
      adminConfigured: isSupabaseAdminConfigured(),
      adminOk,
      message: "Supabase connected and Phase A schema is ready",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
