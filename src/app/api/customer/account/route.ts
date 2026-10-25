import { NextResponse } from "next/server";

import { BackendError, backendFetch } from "@/lib/backend-catalog";
import { clientIp } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type BackendAccountOrder = {
  id: string;
  order_number: string;
  placed_at: string;
  payment_status: string;
  fulfillment_status: string;
  grand_total_cents: number;
  items: Array<{ requires_shipping?: boolean }>;
  download: { paid: boolean; token: string | null } | null;
};

type BackendAccount = {
  customer: { first_name: string | null; last_name: string | null; email: string | null };
  orders: BackendAccountOrder[];
};

/** The backend owns customer data; this forwards the customer's session token with the store key. */
export async function GET(request: Request) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { data } = await session.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  try {
    const account = await backendFetch<BackendAccount>("/api/storefront/customer/account", {
      headers: { Authorization: `Bearer ${accessToken}` },
      clientIp: clientIp(request),
    });
    return NextResponse.json({
      data: {
        customer: {
          first_name: account.customer.first_name || "",
          last_name: account.customer.last_name || "",
          email: account.customer.email || user.email || "",
        },
        orders: account.orders.map(({ download, ...order }) => ({
          ...order,
          fulfillment_status: order.items.some((item) => Boolean(item.requires_shipping)) ? order.fulfillment_status : "completed",
          downloads: download
            ? { url: download.token ? `/downloads?token=${encodeURIComponent(download.token)}` : null, locked: !download.paid }
            : null,
        })),
      },
    });
  } catch (error) {
    if (error instanceof BackendError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to load your account right now." }, { status: 502 });
  }
}
