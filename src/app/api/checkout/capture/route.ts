import { NextResponse } from "next/server";
import { BackendError, backendFetch } from "@/lib/backend-catalog";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { capturePayPalOrder, PayPalError } from "@/lib/paypal";

export const runtime = "nodejs";

/**
 * Captures the approved PayPal payment on this storefront's PayPal account, then records it
 * with the store backend, which checks the order and amount before marking the order paid.
 */
export async function POST(request: Request) {
  const limited = rateLimit(`capture:${clientIp(request)}`, 30, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);
  const body = (await request.json().catch(() => ({}))) as { orderToken?: unknown; paypalOrderId?: unknown };
  const orderToken = typeof body.orderToken === "string" ? body.orderToken.slice(0, 200) : "";
  const paypalOrderId = typeof body.paypalOrderId === "string" ? body.paypalOrderId.slice(0, 64) : "";
  if (!orderToken || !paypalOrderId) return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  const secretKey = String(process.env.STORE_SECRET_KEY || "").trim();
  if (!secretKey) {
    console.error("[checkout:capture] STORE_SECRET_KEY is not set");
    return NextResponse.json({ error: "PayPal is not available right now." }, { status: 503 });
  }
  try {
    const capture = await capturePayPalOrder(paypalOrderId);
    if (capture.status !== "COMPLETED" || capture.captureStatus !== "COMPLETED") {
      return NextResponse.json(
        { error: "PayPal did not complete the payment. You have not been charged for this order.", code: "payment_not_completed" },
        { status: 402 },
      );
    }
    const result = await backendFetch<{ paid: boolean; orderNumber: string }>("/api/storefront/payments/confirm", {
      method: "POST",
      storeKey: secretKey,
      body: {
        orderToken,
        paypalOrderId,
        captureId: capture.captureId,
        referenceId: capture.referenceId,
        amountCents: capture.amountCents,
        currency: capture.currency,
        payerEmail: capture.payerEmail,
      },
      clientIp: clientIp(request),
    });
    return NextResponse.json({ ok: true, paid: result.paid, orderNumber: result.orderNumber, orderToken });
  } catch (error) {
    if (error instanceof PayPalError && error.status === 422) {
      const declined = error.issue === "INSTRUMENT_DECLINED";
      return NextResponse.json(
        {
          error: declined ? "PayPal declined that payment method. Please choose another one." : "The PayPal payment hasn't been approved yet.",
          code: declined ? "instrument_declined" : "payment_not_approved",
        },
        { status: 402 },
      );
    }
    if (error instanceof BackendError) {
      console.error("[checkout:capture] backend", error.status, error.message);
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status >= 500 ? 502 : error.status });
    }
    console.error("[checkout:capture]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "We couldn't confirm your PayPal payment. Please try again." }, { status: 502 });
  }
}
