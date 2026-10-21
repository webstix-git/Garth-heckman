import { NextResponse } from "next/server";
import { BackendError, backendFetch } from "@/lib/backend-catalog";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Confirms an approved PayPal payment. The backend checks the amount and marks the order paid. */
export async function POST(request: Request) {
  const limited = rateLimit(`capture:${clientIp(request)}`, 30, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);
  const body = (await request.json().catch(() => ({}))) as { orderToken?: unknown; paypalOrderId?: unknown };
  const orderToken = typeof body.orderToken === "string" ? body.orderToken.slice(0, 200) : "";
  const paypalOrderId = typeof body.paypalOrderId === "string" ? body.paypalOrderId.slice(0, 64) : "";
  if (!orderToken || !paypalOrderId) return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  try {
    const result = await backendFetch<{ paid: boolean; orderNumber: string }>("/api/storefront/paypal/capture", {
      method: "POST",
      body: { orderToken, paypalOrderId },
      clientIp: clientIp(request),
    });
    return NextResponse.json({ ok: true, paid: result.paid, orderNumber: result.orderNumber, orderToken });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status >= 500 ? 502 : error.status });
    }
    return NextResponse.json({ error: "We couldn't confirm your PayPal payment. Please try again." }, { status: 502 });
  }
}
