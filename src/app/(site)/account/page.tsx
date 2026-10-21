"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteChrome } from "@/components/chrome/SiteChrome";
import { formatMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";

type OrderItem = {
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  quantity: number;
  unit_price_cents: number;
  requires_shipping: boolean;
  metadata: { slug?: string } | null;
};

type Order = {
  id: string;
  order_number: string;
  placed_at: string;
  payment_status: string;
  grand_total_cents: number;
  items: OrderItem[];
  downloads: { url: string | null; locked: boolean } | null;
};

type AccountData = {
  customer: { first_name: string; last_name: string; email: string };
  orders: Order[];
};

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customer/account")
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then((result) => {
        if (result.ok) setData(result.body.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/account/login");
    router.refresh();
  }

  return (
    <SiteChrome nav="store">
      <main id="main">
        <section className="sec">
          <div className="wrap-n">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <s>/</s>
              <span>My account</span>
            </nav>

            {loading ? <p className="body">Loading your account…</p> : null}

            {!loading && !data ? (
              <div className="empty">
                <h1 className="d2">Your purchases</h1>
                <p className="body mt3">Sign in with the account you set up after your purchase.</p>
                <p className="mt5"><Link className="btn" href="/account/login">Sign in</Link></p>
              </div>
            ) : null}

            {data ? (
              <>
                <div className="between" style={{ alignItems: "flex-end" }}>
                  <div>
                    <p className="meta meta--gold">My account</p>
                    <h1 className="d3 mt2">Welcome back, {data.customer.first_name || "there"}</h1>
                    <p className="body mt3">Your purchases and order history are ready below.</p>
                    <p className="xs dim mt2">Signed in as {data.customer.email}</p>
                  </div>
                  <button className="btn btn--line btn--sm" onClick={() => void signOut()}>
                    Sign out
                  </button>
                </div>

                {data.orders.length ? (
                  <div className="card mt6 scroll-x">
                    <table className="otable w-full">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Date</th>
                          <th>Payment</th>
                          <th style={{ textAlign: "right" }}>Total</th>
                          <th>Product</th>
                          <th>Type</th>
                          <th style={{ textAlign: "right" }}>Qty</th>
                          <th style={{ textAlign: "right" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.orders.flatMap((order) => {
                          const items = order.items.length ? order.items : [null];
                          return items.map((item, index) => (
                            <tr key={`${order.id}-${index}`}>
                              {index === 0 ? (
                                <>
                                  <td rowSpan={items.length} className="tnum">
                                    <strong>#{order.order_number}</strong>
                                    {order.downloads?.url ? (
                                      <p className="mt2">
                                        <a className="btn btn--line btn--sm" href={order.downloads.url}>
                                          Download files
                                        </a>
                                      </p>
                                    ) : order.downloads?.locked ? (
                                      <p className="xs dim mt2">Downloads unlock once payment is confirmed.</p>
                                    ) : null}
                                  </td>
                                  <td rowSpan={items.length}>{new Date(order.placed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                                  <td rowSpan={items.length}><span className="badge">{order.payment_status}</span></td>
                                  <td rowSpan={items.length} className="tnum" style={{ textAlign: "right" }}>{formatMoney(Number(order.grand_total_cents || 0))}</td>
                                </>
                              ) : null}
                              <td>
                                {item?.metadata?.slug ? (
                                  <Link href={`/product/${item.metadata.slug}`}><strong>{item.product_name_snapshot}</strong></Link>
                                ) : item ? <strong>{item.product_name_snapshot}</strong> : "—"}
                                {item?.variant_name_snapshot ? <><br /><span className="xs dim">{item.variant_name_snapshot}</span></> : null}
                              </td>
                              <td>{item ? (item.requires_shipping ? "Shipped" : "Digital") : "—"}</td>
                              <td className="tnum" style={{ textAlign: "right" }}>{item?.quantity ?? "—"}</td>
                              <td className="tnum" style={{ textAlign: "right" }}>{item ? formatMoney(Number(item.unit_price_cents || 0) * item.quantity) : "—"}</td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty mt6">
                    <h2 className="d3">No orders yet.</h2>
                    <p className="body mt3">Your completed purchases will appear here.</p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
