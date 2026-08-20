"use client";

import { useSyncExternalStore } from "react";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { emptyOrderSnapshot, readOrder, subscribeOrders } from "@/lib/cart";
import { Catalog } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { IconCheck, IconDownload, IconTruck } from "@/components/icons";

export default function OrderConfirmationPage() {
  const order = useSyncExternalStore(subscribeOrders, readOrder, emptyOrderSnapshot);

  if (!order) {
    return (
      <SiteChrome nav="store">
        <main id="main">
          <div id="out">
            <section className="sec">
              <div className="wrap">
                <div className="empty">
                  <h1 className="d3">No recent order found.</h1>
                  <p className="body mt3">
                    If you have just bought something, check the confirmation email. The link works from any device.
                  </p>
                  <p className="mt5">
                    <a className="btn" href="/account">
                      Look up an order
                    </a>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </SiteChrome>
    );
  }

  const dig = order.items.filter((i) => !i.shipping);
  const phy = order.items.filter((i) => i.shipping);
  const pwyw = order.items.filter((i) => i.type === "pwyw");
  const d = new Date(order.placedAt);

  return (
    <SiteChrome nav="store">
      <main id="main">
        <div id="out">
          <section className="phead on-dark grain">
            <div className="wrap">
              <span className="badge badge--gold">
                <IconCheck /> {order.status === "sample" ? "Sample order" : "Payment received"}
              </span>
              <h1 className="d1 mt4">
                Thank you,
                <br />
                {order.name.split(" ")[0]}.
              </h1>
              <p className="lede mt5 mw dim">
                {pwyw.length
                  ? "You did not just buy a book. You kept the message moving. That is not a small thing."
                  : "Your order is in. Here is everything you need."}
              </p>
              <div className="row mt6" style={{ gap: 48 }}>
                <div>
                  <p className="meta meta--dim">Order number</p>
                  <p className="d4 tnum mt2">{order.number}</p>
                </div>
                <div>
                  <p className="meta meta--dim">Placed</p>
                  <p className="d4 mt2">
                    {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="meta meta--dim">Total</p>
                  <p className="d4 tnum mt2" style={{ color: "var(--acc)" }}>
                    {formatMoney(order.totals.total)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="sec">
            <div className="wrap comm">
              {order.status === "sample" ? (
                <div className="notice notice--info" style={{ gridColumn: "1 / -1", marginBottom: 24 }}>
                  <span>
                    <strong>No payment taken.</strong> This is a sample.{" "}
                    {order.printifyOrderId
                      ? `Printify draft ${order.printifyOrderId} is in the shop and will not print until you send it to production.`
                      : "Nothing was sent to Printify."}
                  </span>
                </div>
              ) : null}
              <div>
                {dig.length ? (
                  <div className="mb6">
                    <h2 className="d3">Your downloads are ready</h2>
                    <p className="body sm mt2">
                      Also emailed to {order.email}. Links stay live for 12 months, up to 5 downloads each.
                    </p>
                    <div className="mt4">
                      {dig.map((i) => {
                        const p = Catalog.byId(i.productId);
                        const f = p && p.digital && p.digital.files && p.digital.files[0];
                        return (
                          <div className="dl" key={i.productId + i.sku}>
                            <span className="dl__ic">PDF</span>
                            <div className="flex1">
                              <p style={{ fontWeight: 800 }}>{i.title}</p>
                              <p className="xs dim">
                                {f ? `${f.name} · ${f.sizeMb} MB` : "File attached to your account"}
                              </p>
                            </div>
                            <a className="btn btn--line btn--sm" href="#" onClick={(e) => e.preventDefault()}>
                              <IconDownload /> Download
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {phy.length ? (
                  <div className="mb6">
                    <h2 className="d3">On its way to you</h2>
                    <div className="notice notice--info mt3">
                      <IconTruck />
                      <span>
                        We will email tracking to {order.email} as soon as it ships. Printed items are made to order.
                        Allow 5–9 business days.
                      </span>
                    </div>
                    <div className="mt4">
                      {phy.map((i) => (
                        <div className="dl" key={i.productId + i.sku}>
                          <span className="dl__ic" style={{ height: 44 }}>
                            ×{i.qty}
                          </span>
                          <div className="flex1">
                            <p style={{ fontWeight: 800 }}>{i.title}</p>
                            <p className="xs dim">
                              {i.optionsLabel ? `${i.optionsLabel} · ` : ""}
                              {i.sku}
                            </p>
                          </div>
                          <span className="tnum sm">{formatMoney(i.unitCents * i.qty)}</span>
                        </div>
                      ))}
                    </div>
                    {order.address ? (
                      <div className="mt5">
                        <p className="label">Shipping to</p>
                        <p className="body sm">
                          {order.name}
                          <br />
                          {order.address.line1}
                          <br />
                          {order.address.line2 ? (
                            <>
                              {order.address.line2}
                              <br />
                            </>
                          ) : null}
                          {order.address.city}, {order.address.state} {order.address.zip}
                          <br />
                          {order.address.country}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

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
              </div>

              <aside className="summary">
                <h2 className="d4 mb4">Receipt</h2>
                {order.items.map((i) => (
                  <div className="sline" key={i.productId + i.sku}>
                    <span className="dim">
                      {i.title}
                      {i.qty > 1 ? ` × ${i.qty}` : ""}
                    </span>
                    <span className="tnum">{formatMoney(i.unitCents * i.qty)}</span>
                  </div>
                ))}
                <div className="rule mt4 mb4"></div>
                <div className="sline">
                  <span className="dim">Subtotal</span>
                  <span className="tnum">{formatMoney(order.totals.subtotal)}</span>
                </div>
                <div className="sline">
                  <span className="dim">Shipping</span>
                  <span className="tnum">
                    {order.totals.shipping ? formatMoney(order.totals.shipping) : order.shippingRequired ? "Free" : "None"}
                  </span>
                </div>
                <div className="sline">
                  <span className="dim">Tax</span>
                  <span className="tnum">{formatMoney(order.totals.tax)}</span>
                </div>
                <div className="stotal">
                  <span className="label" style={{ margin: 0 }}>
                    Paid
                  </span>
                  <b className="tnum">{formatMoney(order.totals.total)}</b>
                </div>
                <p className="hint">
                  {order.paymentMethod === "none"
                    ? "No payment taken"
                    : `Paid by ${order.paymentMethod === "venmo" ? "Venmo" : "PayPal"}`}{" "}
                  · {order.number}
                </p>
                <a className="btn btn--line btn--block mt4" href="/account">
                  View all orders
                </a>
                <a className="btn btn--quiet btn--block mt2" href="/store">
                  Keep browsing
                </a>
              </aside>
            </div>
          </section>
        </div>
      </main>
    </SiteChrome>
  );
}
