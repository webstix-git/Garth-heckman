import { NextResponse } from "next/server";
import { listCustomPosts } from "@/lib/custom-posts-server";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Same-origin list of published custom posts for client components. */
export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const limited = rateLimit(`fe-posts:${clientIp(request)}`, 120, 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);
  const { type } = await params;
  const search = new URL(request.url).searchParams;
  const list = await listCustomPosts(type, {
    limit: Math.min(100, Math.max(1, Number(search.get("limit")) || 24)),
    offset: Math.max(0, Number(search.get("offset")) || 0),
    category: search.get("category")?.slice(0, 100) || undefined,
    q: search.get("q")?.slice(0, 100) || undefined,
  });
  if (!list) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(list, { headers: { "Cache-Control": "no-store" } });
}
