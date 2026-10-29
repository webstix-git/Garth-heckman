"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { IconCheck, IconDownload, IconTruck } from "@/components/icons";
import { SiteChrome } from "@/components/chrome/SiteChrome";

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

type OrderPayload = {
  order: {
    number: string;
    paymentStatus: string;
    paymentMethod: string;
    placedAt: string;
    customerFirstName: string | null;
    customerEmail: string;
    subtotalCents: number;
    discountCents: number;
    couponCode: string | null;
    shippingRequired: boolean;
    shippingCents: number;
    shipment?: {
      status: string;
      carrier: string | null;
      tracking: string | null;
      trackingUrl: string | null;
      shippedAt: string | null;
      deliveredAt: string | null;
    };
    taxCents: number;
    totalCents: number;
    items: Array<{ title: string; quantity: number; unitCents: number; lineCents: number; requiresShipping: boolean }>;
  };
  downloads: { paid: boolean; customerEmail: string; products: Array<{ productId: string; name: string; files: DownloadFile[] }> } | null;
};

function fileMeta(file: DownloadFile) {
  const parts: string[] = [];
  if (file.size != null) {
    const mb = file.size / (1024 * 1024);
    parts.push(`${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`);
  }
  if (file.limit != null) parts.push(`${Math.max(0, file.limit - file.downloads)} of ${file.limit} downloads left`);
  if (file.expiresAt) parts.push(`until ${new Date(file.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
  return parts.join(" · ");
}

function fileKind(name: string) {
  const ext = name.split(".").pop()?.toUpperCase() ?? "";
  return ext && ext.length <= 4 ? ext : "FILE";
}

/**
 * SiteChrome injects TopNav into the first <section> under <main>.
 * That only works when main+section are in the same client render tree as SiteChrome
 * (same pattern as /cart) — not when SiteChrome wraps a nested client boundary.
 */
function Shell({ children }: { children: ReactNode }) {
  return (
    <SiteChrome nav="store">
      <main id="main">{children}</main>
    </SiteChrome>
  );
}

function shortDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
}

function shipmentCopy(shipment: OrderPayload["order"]["shipment"], email: string) {
  const via = [shipment?.carrier, shipment?.tracking ? `tracking ${shipment.tracking}` : null].filter(Boolean).join(", ");
  switch (shipment?.status) {
    case "delivered": {
      const on = shortDate(shipment.deliveredAt);
      return { title: "Delivered", body: `Your order was delivered${on ? ` on ${on}` : ""}.${via ? ` Shipped via ${via}.` : ""}` };
    }
    case "in_transit":
      return { title: "On its way to you", body: `Your order has shipped${via ? ` via ${via}` : ""}.` };
    case "returned":
      return { title: "Returned", body: "This shipment was returned. Get in touch if you have any questions." };
    default:
      return { title: "On its way to you", body: `We will email tracking to ${email} as soon as it ships.` };
  }
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <section className="phead on-dark grain">
      <div className="wrap">
        <div className="empty">
          <h1 className="d3">{title}</h1>
          <p className="lede mt3 dim">{body}</p>
          <p className="mt5">
            <a className="btn btn--hero" href="/store">
              Back to the shop
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Order confirmation and secure downloads for whoever holds the signed order link. */
export function OrderStatusView({ mode }: { mode: "confirmation" | "downloads" }) {
  const token = useSearchParams().get("token") || "";
  const [data, setData] = useState<OrderPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`/api/order?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as OrderPayload & { error?: string };
        if (!active) return;
        if (!response.ok) setError(body.error || "We couldn't load this order.");
        else setData(body);
      })
      .catch(() => active && setError("We couldn't load this order."));
    return () => {
      active = false;
    };
  }, [token]);

  if (!token) {
    return (
      <Shell>
        <Message
          title="No order link found."
          body="Open the link in your order confirmation email. It works from any device."
        />
      </Shell>
    );
  }
  if (error) {
    return (
      <Shell>
        <Message title="This link isn't working." body={`${error} Check the link in your confirmation email.`} />
      </Shell>
    );
  }
  if (!data) {
    return (
      <Shell>
        <section className="phead on-dark grain">
          <div className="wrap">
            <p className="meta meta--dim">Loading your order…</p>
          </div>
        </section>
      </Shell>
    );
  }

  const { order, downloads } = data;
  const paid = order.paymentStatus === "paid";
  const cod = order.paymentMethod === "cash_on_delivery";
  const shipped = order.items.filter((item) => item.requiresShipping);
  const shipping = shipmentCopy(order.shipment, order.customerEmail);
  const placed = new Date(order.placedAt);
  const products = downloads?.products ?? [];

  return (
    <Shell>
      <section className="phead on-dark grain">
        <div className="wrap">
          <span className="badge badge--gold">
            <IconCheck /> {paid ? (order.totalCents ? "Payment received" : "Order confirmed") : cod ? "Order confirmed" : "Awaiting payment"}
          </span>
          <h1 className="d1 mt4">
            {mode === "downloads" ? (
              "Your downloads"
            ) : (
              <>
                Thank you
                {order.customerFirstName ? (
                  <>
                    ,
                    <br />
                    {order.customerFirstName}
                  </>
                ) : null}
                .
              </>
            )}
          </h1>
          <p className="lede mt5 mw dim">
            {paid
              ? "Your order is in. Here is everything you need."
              : cod
                ? `Your order is in. Please have ${formatMoney(order.totalCents)} ready when it is delivered.`
                : "We haven't received the payment for this order yet. Downloads unlock once it clears."}
          </p>
          <div className="row mt6" style={{ gap: 48 }}>
            <div>
              <p className="meta meta--dim">Order number</p>
              <p className="d4 tnum mt2">{order.number}</p>
            </div>
            <div>
              <p className="meta meta--dim">Placed</p>
              <p className="d4 mt2">{placed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
            <div>
              <p className="meta meta--dim">Total</p>
              <p className="d4 tnum mt2" style={{ color: "var(--acc)" }}>
                {formatMoney(order.totalCents)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap comm">
          <div>
            {products.length ? (
              <div className="mb6" id="downloads">
                <h2 className="d3">{paid ? "Your downloads are ready" : "Downloads"}</h2>
                <p className="body sm mt2">
                  {paid
                    ? `Also emailed to ${order.customerEmail}. Keep this link private; guest downloads from this link are limited to 2 per file.`
                    : "These unlock as soon as your payment is confirmed."}
                </p>
                <div className="mt4">
                  {products.flatMap((product) =>
                    product.files.map((file) => (
                      <div className="dl" key={file.id}>
                        <span className="dl__ic">{fileKind(file.name)}</span>
                        <div className="flex1">
                          <p style={{ fontWeight: 800 }}>{product.files.length > 1 ? file.name : product.name}</p>
                          <p className="xs dim">
                            {product.files.length > 1 ? `${product.name} · ` : `${file.name} · `}
                            {file.available ? fileMeta(file) : file.reason}
                          </p>
                        </div>
                        {file.available ? (
                          <a
                            className="btn btn--line btn--sm"
                            href={`/api/order/download?token=${encodeURIComponent(token)}&file=${encodeURIComponent(file.id)}`}
                            rel="noreferrer"
                          >
                            <IconDownload /> Download
                          </a>
                        ) : file.reasonCode === "limit" ? (
                          <a className="btn btn--sm" href="/account">
                            Sign in to My Account
                          </a>
                        ) : (
                          <button className="btn btn--line btn--sm" type="button" disabled>
                            Unavailable
                          </button>
                        )}
                      </div>
                    )),
                  )}
                </div>
                {mode === "confirmation" ? (
                  <p className="mt4">
                    <a className="btn btn--line btn--sm" href="/account">
                      My account
                    </a>
                  </p>
                ) : null}
              </div>
            ) : null}

            {shipped.length && mode === "confirmation" ? (
              <div className="mb6">
                <h2 className="d3">{shipping.title}</h2>
                <div className="notice notice--info mt3">
                  <IconTruck />
                  <span>
                    {shipping.body}
                    {order.shipment?.trackingUrl ? (
                      <>
                        {" "}
                        <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer">
                          Track package
                        </a>
                      </>
                    ) : null}
                  </span>
                </div>
                <div className="mt4">
                  {shipped.map((item, index) => (
                    <div className="dl" key={`${item.title}-${index}`}>
                      <span className="dl__ic" style={{ height: 44 }}>
                        ×{item.quantity}
                      </span>
                      <div className="flex1">
                        <p style={{ fontWeight: 800 }}>{item.title}</p>
                      </div>
                      <span className="tnum sm">{formatMoney(item.lineCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {mode === "confirmation" ? (
              <div className="card">
                <p className="meta meta--gold">One more thing</p>
                <p className="d4 mt2">Garth would genuinely like to hear from you.</p>
                <p className="body sm mt2">Tell him what you are walking through, or nothing at all. Both are fine.</p>
                <p className="mt4">
                  <a className="btn btn--line btn--sm" href="/contact">
                    Say hello
                  </a>
                </p>
              </div>
            ) : null}
          </div>

          <aside className="summary">
            <h2 className="d4 mb4">Receipt</h2>
            {order.items.map((item, index) => (
              <div className="sline" key={`${item.title}-${index}`}>
                <span className="dim">
                  {item.title}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
                <span className="tnum">{formatMoney(item.lineCents)}</span>
              </div>
            ))}
            <div className="rule mt4 mb4"></div>
            <div className="sline">
              <span className="dim">Subtotal</span>
              <span className="tnum">{formatMoney(order.subtotalCents)}</span>
            </div>
            {order.discountCents > 0 ? (
              <div className="sline">
                <span className="dim">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span className="tnum">−{formatMoney(order.discountCents)}</span>
              </div>
            ) : null}
            {order.shippingRequired ? (
              <div className="sline">
                <span className="dim">Shipping</span>
                <span className="tnum">{order.shippingCents ? formatMoney(order.shippingCents) : "Free"}</span>
              </div>
            ) : null}
            {order.taxCents > 0 ? (
              <div className="sline">
                <span className="dim">Tax</span>
                <span className="tnum">{formatMoney(order.taxCents)}</span>
              </div>
            ) : null}
            <div className="stotal">
              <span className="label" style={{ margin: 0 }}>
                {paid ? "Paid" : cod ? "Due on delivery" : "Total"}
              </span>
              <b className="tnum">{formatMoney(order.totalCents)}</b>
            </div>
            <p className="hint">
              {!order.totalCents
                ? "No payment taken"
                : cod
                  ? paid
                    ? "Paid on delivery"
                    : "Cash on delivery"
                  : paid
                    ? "Paid with PayPal"
                    : "Payment pending"}{" "}
              · {order.number}
            </p>
            <a className="btn btn--quiet btn--block mt4" href="/account">
              My account
            </a>
            <a className="btn btn--quiet btn--block mt2" href="/store">
              Keep browsing
            </a>
          </aside>
        </div>
      </section>
    </Shell>
  );
}
