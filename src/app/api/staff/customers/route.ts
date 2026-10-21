import { NextResponse } from "next/server";
import { listCustomers } from "@/services/customers-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const data = await listCustomers({
    search: url.searchParams.get("search") || undefined,
    status: (url.searchParams.get("status") as "all") || "all",
    page: Number(url.searchParams.get("page") || 1),
    pageSize: Number(url.searchParams.get("pageSize") || 10),
    sortBy: (url.searchParams.get("sortBy") as "createdAt") || "createdAt",
    sortDir: (url.searchParams.get("sortDir") as "desc") || "desc",
  });
  return NextResponse.json({ data });
}
