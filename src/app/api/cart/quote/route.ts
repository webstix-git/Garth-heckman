import { NextResponse } from "next/server";
import { BackendError, backendFetch } from "@/lib/backend-catalog";
import { cartItemsForBackend, type CartLineInput } from "@/lib/store-checkout";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { paypalConfigured } from "@/lib/paypal";

export const runtime = "nodejs";

/** Server-priced cart totals (shipping, tax, coupon) from the store backend. */
export async function POST(request: Request) {
  const limited = rateLimit(`fe-quote:${clientIp(request)}`, 120, 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);
  const body = (await request.json().catch(() => ({}))) as { items?: CartLineInput[]; couponCode?: string | null };
  try {
    const quote = await backendFetch<Record<string, unknown>>("/api/storefront/cart/quote", {
      method: "POST",
      body: { items: cartItemsForBackend(body.items), couponCode: typeof body.couponCode === "string" ? body.couponCode : "" },
      clientIp: clientIp(request),
    });
    return NextResponse.json({ ...quote, paypal: paypalConfigured() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const message = error instanceof BackendError ? error.message : "Unable to price your cart right now.";
    return NextResponse.json({ error: message }, { status });
  }
}
