import "server-only";

import { clientIp } from "@/lib/rate-limit";

type SiteverifyResult = {
  success?: boolean;
  "error-codes"?: string[];
  action?: string;
  hostname?: string;
};

export function getTurnstileSecret() {
  return String(process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET || "").trim();
}

export function isTurnstileEnabled() {
  return Boolean(getTurnstileSecret());
}

/** Verify a Cloudflare Turnstile token. Returns null when Turnstile is not configured. */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  request: Request,
  expectedAction?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = getTurnstileSecret();
  if (!secret) return { ok: true };

  const response = String(token || "").trim();
  if (!response || response.length > 2048) {
    return { ok: false, error: "Please complete the security check." };
  }

  const remoteip = clientIp(request);
  const body = new URLSearchParams({
    secret,
    response,
    ...(remoteip && remoteip !== "unknown" ? { remoteip } : {}),
  });

  let result: SiteverifyResult;
  try {
    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    result = (await verify.json()) as SiteverifyResult;
    if (!verify.ok) {
      return { ok: false, error: "Security check failed. Please try again." };
    }
  } catch {
    return { ok: false, error: "Security check unavailable. Please try again." };
  }

  if (result.success !== true) {
    return { ok: false, error: "Security check failed. Please try again." };
  }

  if (expectedAction && result.action && result.action !== expectedAction) {
    return { ok: false, error: "Security check failed. Please try again." };
  }

  return { ok: true };
}
