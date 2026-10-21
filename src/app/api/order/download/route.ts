import { NextResponse } from "next/server";
import { BackendError, backendFetch } from "@/lib/backend-catalog";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * GET /api/order/download?token=…&file=…
 * The backend checks the order is paid and the download allowance, then this redirects
 * to a short-lived signed file URL.
 */
export async function GET(request: Request) {
  const limited = rateLimit(`fe-download:${clientIp(request)}`, 30, 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);
  const params = new URL(request.url).searchParams;
  const token = params.get("token") || "";
  const file = params.get("file") || "";
  if (!token || token.length > 200 || !/^[0-9a-f-]{36}$/i.test(file)) {
    return NextResponse.json({ error: "This download link is invalid." }, { status: 400 });
  }
  try {
    const result = await backendFetch<{ url: string }>(
      `/api/storefront/order/download?token=${encodeURIComponent(token)}&file=${encodeURIComponent(file)}&format=json`,
      { clientIp: clientIp(request) },
    );
    const response = NextResponse.redirect(result.url, 302);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const message = error instanceof BackendError ? error.message : "This download isn't available right now.";
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
