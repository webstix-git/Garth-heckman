import { NextResponse } from "next/server";
import { fetchStoreSettings } from "@/lib/settings-supabase";
import { paypalClientId, paypalConfigured } from "@/lib/paypal";

export const runtime = "nodejs";

/** Public PayPal settings for the checkout buttons. Only the client id is public; the secret stays on the server. */
export async function GET() {
  if (!paypalConfigured()) return NextResponse.json({ configured: false });
  const site = await fetchStoreSettings().catch(() => null);
  return NextResponse.json(
    {
      configured: true,
      clientId: paypalClientId(),
      currency: "USD",
      paypalEnabled: true,
      venmoEnabled: site?.settings.payments?.venmoEnabled ?? true,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
