import { NextResponse } from "next/server";
import { listStorefrontCategories, listStorefrontProducts } from "@/lib/catalog-public";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Same-origin catalog for client components (cart, search, related products).
 * Everything comes from the store backend; money is integer cents.
 */
export async function GET(request: Request) {
  const limited = rateLimit(`fe-catalog:${clientIp(request)}`, 120, 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const [products, categories] = await Promise.all([listStorefrontProducts(), listStorefrontCategories()]);

  return NextResponse.json(
    {
      data: products,
      categories: categories.map(({ id, name, slug, description, parentSlug }) => ({ id, name, slug, description, parentSlug })),
      meta: { count: products.length, categoryCount: categories.length, source: "backend", currency: "USD", unit: "cents" },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
