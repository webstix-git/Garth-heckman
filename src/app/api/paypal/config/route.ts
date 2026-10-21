import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-catalog";
import { fetchStoreSettings } from "@/lib/settings-supabase";

export const runtime = "nodejs";

/** Public PayPal settings from the store backend. Only the client id is public; the secret stays on the backend. */
export async function GET() {
  try {
    const [{ paypal }, site] = await Promise.all([
      backendFetch<{ paypal?: { enabled?: boolean; clientId?: string; currency?: string } }>("/api/storefront/payments"),
      fetchStoreSettings().catch(() => null),
    ]);
    if (!paypal?.enabled || !paypal.clientId) return NextResponse.json({ configured: false });
    return NextResponse.json(
      {
        configured: true,
        clientId: paypal.clientId,
        currency: paypal.currency || "USD",
        paypalEnabled: true,
        venmoEnabled: site?.settings.payments?.venmoEnabled ?? true,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ configured: false });
  }
}
