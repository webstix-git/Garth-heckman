import { NextResponse } from "next/server";

import { BackendError, backendFetch } from "@/lib/backend-catalog";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { token?: string; password?: string } | null;
  const token = body?.token?.trim() || "";
  const password = body?.password || "";
  if (!token || password.length < 8) {
    return NextResponse.json({ error: "Use a valid setup link and a password of at least 8 characters." }, { status: 400 });
  }

  try {
    const result = await backendFetch<{ ok: boolean; email: string }>("/api/storefront/customer/setup", {
      method: "POST",
      body: { token, password },
      clientIp: clientIp(req),
    });
    return NextResponse.json({ ok: true, email: result.email });
  } catch (error) {
    if (error instanceof BackendError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not set up your account right now." }, { status: 502 });
  }
}
