import { NextResponse } from "next/server";
import {
  getDashboardStats,
  getOrderStatusOverview,
  getRecentMedia,
  getRecentOrders,
  getRecentSubmissions,
  getSalesOverview,
  getTopProducts,
} from "@/services/dashboard-server";
import { SALES_MAX_DATE } from "@/lib/sales-dates";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "stats";
  const asOf = url.searchParams.get("asOf") || SALES_MAX_DATE;
  const from = url.searchParams.get("from") || asOf;
  const to = url.searchParams.get("to") || asOf;
  const limit = Number(url.searchParams.get("limit") || 5);

  try {
    switch (view) {
      case "stats":
        return NextResponse.json({ data: await getDashboardStats(asOf) });
      case "sales":
        return NextResponse.json({ data: await getSalesOverview({ from, to }) });
      case "statuses":
        return NextResponse.json({ data: await getOrderStatusOverview(asOf) });
      case "recent-orders":
        return NextResponse.json({ data: await getRecentOrders(limit, asOf) });
      case "recent-contacts":
        return NextResponse.json({ data: await getRecentSubmissions(limit, asOf) });
      case "recent-media":
        return NextResponse.json({ data: await getRecentMedia(limit) });
      case "top-products":
        return NextResponse.json({ data: await getTopProducts({ from, to }) });
      default:
        return NextResponse.json({ error: "Unknown view" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Dashboard failed" },
      { status: 500 },
    );
  }
}
