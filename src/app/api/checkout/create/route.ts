import { NextResponse } from "next/server";
import { BackendError, backendFetch } from "@/lib/backend-catalog";
import { checkoutBody, type CheckoutInput } from "@/lib/store-checkout";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createPayPalOrder, paypalConfigured } from "@/lib/paypal";

export const runtime = "nodejs";

const STORE_NAME = "Garth Heckman";

type BackendCheckout = {
  ok: boolean;
  order: { id: string; order_number: string; grand_total_cents: number };
  orderToken: string;
  paymentRequired: boolean;
  paymentMethod: string;
};

/**
 * Places the order with the store backend (which prices it), then opens the matching PayPal order
 * on this storefront's PayPal account. Free and cash-on-delivery orders are complete straight away.
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
    if (!paypalConfigured()) return NextResponse.json({ error: "PayPal is not available right now." }, { status: 503 });
    const paypalOrderId = await createPayPalOrder({
      orderId: String(placed.order.id),
      orderNumber,
      totalCents: Number(placed.order.grand_total_cents),
      storeName: STORE_NAME,
    });
    return NextResponse.json({ mode: "paypal", orderToken: placed.orderToken, orderNumber, paypalOrderId });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status >= 500 ? 502 : error.status });
    }
    console.error("[checkout:create]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
