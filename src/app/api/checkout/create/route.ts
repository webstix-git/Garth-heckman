import { NextResponse } from "next/server";
import { BackendError, backendFetch } from "@/lib/backend-catalog";
import { checkoutBody, type CheckoutInput } from "@/lib/store-checkout";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

type BackendCheckout = {
  ok: boolean;
  order: { order_number: string };
  orderToken: string;
  paymentRequired: boolean;
  paymentMethod: string;
};

/**
 * Places the order with the store backend (which prices it), then opens the matching PayPal order.
 * Free and cash-on-delivery orders are complete straight away.
 */
export async function POST(request: Request) {
  const limited = rateLimit(`checkout:${clientIp(request)}`, 10, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);
  const input = (await request.json().catch(() => null)) as CheckoutInput | null;
  if (!input) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const ip = clientIp(request);
  try {
    const placed = await backendFetch<BackendCheckout>("/api/checkout", { method: "POST", body: checkoutBody(input), clientIp: ip });
    const orderNumber = String(placed.order.order_number);
    if (!placed.paymentRequired) {
      return NextResponse.json({ mode: "free", orderToken: placed.orderToken, orderNumber });
    }
    if (placed.paymentMethod === "cash_on_delivery") {
      return NextResponse.json({ mode: "cash_on_delivery", orderToken: placed.orderToken, orderNumber });
    }
    const paypal = await backendFetch<{ paypalOrderId: string }>("/api/storefront/paypal/create", {
      method: "POST",
      body: { orderToken: placed.orderToken },
      clientIp: ip,
    });
    return NextResponse.json({ mode: "paypal", orderToken: placed.orderToken, orderNumber, paypalOrderId: paypal.paypalOrderId });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status >= 500 ? 502 : error.status });
    }
    console.error("[checkout:create]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
