"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SiteChrome } from "@/components/chrome/SiteChrome";
import { IconDownload, IconTruck } from "@/components/icons";
import { formatMoney } from "@/lib/money";

type DownloadFile = {
  id: string;
  name: string;
  size: number | null;
  downloads: number;
  limit: number | null;
  expiresAt: string | null;
  available: boolean;
  reason: string | null;
  reasonCode?: "unpaid" | "expired" | "limit" | null;
};

type OrderDownloads = {
  token: string;
  products: Array<{ productId: string; name: string; files: DownloadFile[] }>;
};

type OrderItem = {
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  quantity: number;
  unit_price_cents: number;
  requires_shipping: boolean;
  metadata: { slug?: string } | null;
};

type OrderShipment = {
  status: string;
  printifyStatus?: string | null;
  carrier: string | null;
  tracking: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
};

type Order = {
  id: string;
  order_number: string;
  placed_at: string;
  payment_status: string;
  grand_total_cents: number;
  items: OrderItem[];
  downloads: { token: string | null; locked: boolean } | null;
  shipment: OrderShipment | null;
};

type AccountData = {
  customer: { first_name: string; last_name: string; email: string };
  orders: Order[];
};

function fileMeta(file: DownloadFile) {
  const parts: string[] = [];
  if (file.size != null) {
    const mb = file.size / (1024 * 1024);
    parts.push(`${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`);
  }
  if (file.limit != null) parts.push(`${Math.max(0, file.limit - file.downloads)} of ${file.limit} downloads left`);
  if (file.expiresAt) {
    parts.push(`until ${new Date(file.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
  }
  return parts.join(" · ");
}

function shipmentLabel(shipment: OrderShipment) {
  const key = String(shipment.printifyStatus || shipment.status || "").toLowerCase().replace(/_/g, "-");
  switch (key) {
    case "delivered":
      return shipment.deliveredAt
        ? `Delivered ${new Date(shipment.deliveredAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : "Delivered";
    case "in-transit":
    case "on-the-way":
    case "out-for-delivery":
      return "On its way";
    case "shipped":
    case "fulfilled":
    case "ready-to-ship":
      return "Shipped";
    case "in-production":
    case "production":
      return "In production";
    case "sending-to-production":
      return "Sending to production";
    case "on-hold":
    case "onhold":
      return "On hold";
    case "has-issues":
      return "Has issues";
    case "cancelled":
    case "canceled":
      return "Canceled";
    case "returned":
      return "Returned";
    default:
      return key ? key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Preparing to ship";
  }
}

function OrderShipmentPanel({ shipment }: { shipment: OrderShipment }) {
  const via = [shipment.carrier, shipment.tracking].filter(Boolean).join(" · ");
  const awaitingTracking = !shipment.tracking && !["delivered", "cancelled", "canceled"].includes(shipment.status);
  return (
    <div className="oblock__downloads">
      <p className="meta meta--dim" style={{ marginBottom: 8 }}>Shipping</p>
      <div className="notice notice--info" style={{ margin: 0 }}>
        <IconTruck />
        <span>
          <strong style={{ color: "var(--fg)" }}>{shipmentLabel(shipment)}</strong>
          {via ? <span className="dim"> · {via}</span> : null}
          {awaitingTracking && !shipment.trackingUrl ? (
            <span className="dim"> · Tracking appears once Printify ships.</span>
          ) : null}
          {shipment.trackingUrl ? (
            <>
              {" "}
              <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer">
                {shipment.tracking ? "Track package" : "View status"}
              </a>
            </>
          ) : null}
        </span>
      </div>
    </div>
  );
}

function OrderDownloadsPanel({
  order,
  files,
}: {
  order: Order;
  files: OrderDownloads | "loading" | "error" | undefined;
}) {
  if (!order.downloads) return null;

  return (
    <div className="oblock__downloads">
      <p className="meta meta--dim" style={{ marginBottom: 8 }}>Downloads</p>
      {order.downloads.locked ? (
        <p className="xs dim">Downloads unlock once payment is confirmed.</p>
      ) : files === "loading" || !files ? (
        <p className="xs dim">Loading downloads…</p>
      ) : files === "error" ? (
        <p className="xs dim">Downloads unavailable right now.</p>
      ) : (
        files.products.flatMap((product) =>
          product.files.map((file) => (
            <div className="dl" key={file.id}>
              <div className="flex1" style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 800, overflowWrap: "anywhere" }}>
                  {product.files.length > 1 ? file.name : product.name}
                </p>
                <p className="xs dim">{file.available ? fileMeta(file) : file.reason}</p>
              </div>
              {file.available ? (
                <a
                  className="btn btn--line btn--sm"
                  href={`/api/order/download?token=${encodeURIComponent(files.token)}&file=${encodeURIComponent(file.id)}`}
                >
                  <IconDownload /> Download
                </a>
              ) : (
                <button className="btn btn--line btn--sm" type="button" disabled>
                  Unavailable
                </button>
              )}
            </div>
          )),
        )
      )}
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderDownloads, setOrderDownloads] = useState<Record<string, OrderDownloads | "loading" | "error">>({});
  const fetchedDownloads = useRef(new Set<string>());

  useEffect(() => {
    fetch("/api/customer/account")
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then((result) => {
        if (result.ok) setData(result.body.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data) return;
    const pending = data.orders.filter(
      (order) => order.downloads?.token && !fetchedDownloads.current.has(order.id),
    );
    if (!pending.length) return;

    for (const order of pending) fetchedDownloads.current.add(order.id);
    setOrderDownloads((current) => {
      const next = { ...current };
      for (const order of pending) next[order.id] = "loading";
      return next;
    });

    void Promise.all(
      pending.map(async (order) => {
        const token = order.downloads!.token!;
        try {
          const response = await fetch(`/api/order?token=${encodeURIComponent(token)}`);
          const body = await response.json().catch(() => ({}));
          if (!response.ok || !body.downloads?.products) {
            setOrderDownloads((current) => ({ ...current, [order.id]: "error" }));
            return;
          }
          setOrderDownloads((current) => ({
            ...current,
            [order.id]: { token, products: body.downloads.products },
          }));
        } catch {
          setOrderDownloads((current) => ({ ...current, [order.id]: "error" }));
        }
      }),
    );
  }, [data]);

  async function signOut() {
    await fetch("/api/auth", { method: "DELETE" });
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
                <p className="mt5">
                  <Link className="btn" href="/account/login">
                    Sign in
                  </Link>
                </p>
              </div>
            ) : null}

            {data ? (
              <>
                <div className="between" style={{ alignItems: "flex-end" }}>
                  <div>
                    <p className="meta meta--gold">My account</p>
                    <h1 className="d3 mt2">Welcome back, {data.customer.first_name || "there"}</h1>
                    <p className="xs dim mt2">Signed in as {data.customer.email}</p>
                  </div>
                  <button className="btn btn--line btn--sm" onClick={() => void signOut()}>
                    Sign out
                  </button>
                </div>

                {data.orders.length ? (
                  <div className="olist mt6">
                    {data.orders.map((order) => {
                      const items = order.items.length ? order.items : [];
                      return (
                        <article className="oblock" key={order.id}>
                          <div className="oblock__head">
                            <div className="oblock__meta">
                              <strong className="tnum" style={{ fontSize: "1.05rem" }}>
                                #{order.order_number}
                              </strong>
                              <span className="xs dim">
                                {new Date(order.placed_at).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="badge">{order.payment_status}</span>
                            </div>
                            <p className="tnum" style={{ fontWeight: 800, color: "var(--fg)", margin: 0 }}>
                              {formatMoney(Number(order.grand_total_cents || 0))}
                            </p>
                          </div>

                          <div className="oblock__items">
                            {items.length ? (
                              items.map((item, index) => (
                                <div className="oblock__item" key={`${order.id}-item-${index}`}>
                                  <div style={{ minWidth: 0 }}>
                                    {item.metadata?.slug ? (
                                      <Link href={`/product/${item.metadata.slug}`}>
                                        <strong style={{ overflowWrap: "anywhere" }}>{item.product_name_snapshot}</strong>
                                      </Link>
                                    ) : (
                                      <strong style={{ overflowWrap: "anywhere" }}>{item.product_name_snapshot}</strong>
                                    )}
                                    {item.variant_name_snapshot ? (
                                      <p className="xs dim mt1">{item.variant_name_snapshot}</p>
                                    ) : null}
                                    <p className="xs dim mt1">
                                      {item.requires_shipping ? "Shipped" : "Digital"}
                                      {" · "}
                                      Qty {item.quantity}
                                    </p>
                                  </div>
                                  <div className="oblock__item-side tnum">
                                    {formatMoney(Number(item.unit_price_cents || 0) * item.quantity)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="xs dim">No line items on this order.</p>
                            )}
                          </div>

                          {order.shipment ? <OrderShipmentPanel shipment={order.shipment} /> : null}
                          <OrderDownloadsPanel order={order} files={orderDownloads[order.id]} />
                        </article>
                      );
                    })}
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
