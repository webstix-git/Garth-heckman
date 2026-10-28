import { NextResponse } from "next/server";
import { BackendError, backendFetch } from "@/lib/backend-catalog";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Checkout helper: whether this email already has a password account. */
export async function GET(request: Request) {
  const limited = rateLimit(`fe-account-status:${clientIp(request)}`, 60, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);
  const email = new URL(request.url).searchParams.get("email")?.trim() || "";
  if (!email) return NextResponse.json({ exists: false, hasPassword: false });
  try {
    const status = await backendFetch<{ exists: boolean; hasPassword: boolean }>(
      `/api/storefront/customer/account-status?email=${encodeURIComponent(email)}`,
      { clientIp: clientIp(request) },
    );
    return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to check that email right now." }, { status: 502 });
  }
}
