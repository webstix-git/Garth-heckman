import { NextResponse } from "next/server";

import { getBackendCatalogConfig } from "@/lib/backend-catalog";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";

type ContactBody = {
  turnstileToken?: string;
  [key: string]: unknown;
};

/** Proxy contact submissions so STORE_API_KEY never ships to the browser. */
export async function POST(request: Request) {
  const limited = rateLimit(`contact:${clientIp(request)}`, 5, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { backendUrl, storeKey, configured } = getBackendCatalogConfig();
  if (!configured) {
    return NextResponse.json(
      { error: "Contact API is not configured on the server." },
      { status: 503 },
    );
  }

  let body: ContactBody;
  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const captcha = await verifyTurnstileToken(body.turnstileToken, request, "contact");
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 403 });
  }

  const { turnstileToken: _token, ...payloadBody } = body;

  const response = await fetch(`${backendUrl}/api/contact-submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Store-Key": storeKey,
      "X-Forwarded-For": clientIp(request),
    },
    body: JSON.stringify(payloadBody),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
