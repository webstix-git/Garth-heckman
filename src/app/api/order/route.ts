import { NextResponse } from "next/server";
import { BackendError, backendFetch } from "@/lib/backend-catalog";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Order summary + downloads for the holder of a signed order link. */
export async function GET(request: Request) {
  const limited = rateLimit(`fe-order:${clientIp(request)}`, 60, 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token || token.length > 200) return NextResponse.json({ error: "This order link is invalid." }, { status: 403 });
  try {
    const session = await createClient();
    const { data } = await session.auth.getSession();
    const accessToken = data.session?.access_token;
    const order = await backendFetch(`/api/storefront/order?token=${encodeURIComponent(token)}`, {
      clientIp: clientIp(request),
      ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}),
    });
    return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const message = error instanceof BackendError ? error.message : "Unable to load this order right now.";
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
