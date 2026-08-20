"use client";

import { useSyncExternalStore } from "react";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { emptyOrdersSnapshot, readOrders, subscribeOrders } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

export default function AccountPage() {
  const orders = useSyncExternalStore(subscribeOrders, readOrders, emptyOrdersSnapshot);

  return (
    <SiteChrome nav="store">
      <main id="main">
        <section className="sec">
          <div className="wrap-n">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <span>Orders &amp; downloads</span>
            </nav>
            <div className="between" style={{ alignItems: "flex-end" }}>
              <div>
                <h1 className="d2">
                  Orders &amp;
                  <br />
                  downloads
                </h1>
                <p className="body mt3 mw-s">Every order you have placed, and every file you own.</p>
              </div>
              <span className="badge">Phase 2: customer accounts</span>
            </div>

            <div id="orders" className="mt6">
              {orders && !orders.length ? (
                <div className="empty">
                  <h2 className="d3">No orders yet.</h2>
                  <p className="body mt3">Anything you order will show up here.</p>
                  <p className="mt5">
                    <a className="btn" href="/product/wtfu-book">
                      Get WTFU
                    </a>
                  </p>
                </div>
              ) : null}
              {orders
                ? orders.map((o) => {
                    const d = new Date(o.placedAt);
                    const dig = o.items.filter((i) => !i.shipping);
                    return (
                      <article className="card mb4" key={o.number}>
                        <div className="between" style={{ alignItems: "flex-start" }}>
                          <div>
                            <p className="meta meta--dim">
                              {d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </p>
                            <p className="d4 tnum mt2">{o.number}</p>
                          </div>
                          <div className="row">
                            <span className="badge badge--ok">{o.status}</span>
                            <span className="d4 tnum">{formatMoney(o.totals.total)}</span>
                          </div>
                        </div>
                        <div className="scroll-x mt4">
                          <table className="otable">
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th>Type</th>
                                <th style={{ textAlign: "right" }}>Qty</th>
                                <th style={{ textAlign: "right" }}>Amount</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.items.map((i) => (
                                <tr key={i.productId + i.sku}>
                                  <td>
                                    <strong>{i.title}</strong>
                                    {i.optionsLabel ? (
                                      <>
                                        <br />
                                        <span className="xs dim">{i.optionsLabel}</span>
                                      </>
                                    ) : null}
                                  </td>
                                  <td>{i.shipping ? "Shipped" : "Download"}</td>
                                  <td style={{ textAlign: "right" }} className="tnum">
                                    {i.qty}
                                  </td>
                                  <td style={{ textAlign: "right" }} className="tnum">
                                    {formatMoney(i.unitCents * i.qty)}
                                  </td>
                                  <td style={{ textAlign: "right" }}>
                                    {i.shipping ? (
                                      <span className="xs dim">Tracking pending</span>
                                    ) : (
                                      <a className="btn btn--line btn--sm" href="#" onClick={(e) => e.preventDefault()}>
                                        Download
                                      </a>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {dig.length ? (
                          <p className="hint">
                            {dig.length} file{dig.length > 1 ? "s" : ""} available · links valid 12 months
                          </p>
                        ) : null}
                      </article>
                    );
                  })
                : null}
            </div>

            <div className="card mt6">
              <p className="meta meta--gold">No account? No problem.</p>
              <p className="d4 mt2">Look up an order by email</p>
              <p className="body sm mt2 mw-s">
                Guest checkout is the default. Enter the email you used and the order number and we will resend the
                links.
              </p>
              <form className="mt4" style={{ maxWidth: 520 }} onSubmit={(e) => e.preventDefault()}>
                <div className="field-row">
                  <div className="field">
                    <label className="label" htmlFor="le">
                      Email
                    </label>
                    <input className="input" id="le" type="email" placeholder="you@example.com" />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="lo">
                      Order number
                    </label>
                    <input className="input" id="lo" placeholder="GH-123456" />
                  </div>
                </div>
                <button className="btn mt4" type="submit">
                  Resend my links
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
