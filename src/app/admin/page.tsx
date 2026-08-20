"use client";

import { useState } from "react";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Catalog } from "@/lib/catalog";
import { formatMoney, formatMoney0 } from "@/lib/money";

const TABS = ["orders", "products", "posts", "forms", "settings"] as const;
type Tab = (typeof TABS)[number];

const LABELS: Record<Tab, string> = {
  orders: "Orders",
  products: "Products",
  posts: "Blog posts",
  forms: "Form submissions",
  settings: "Store settings",
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("orders");

  return (
    <SiteChrome nav="">
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <span>Admin preview</span>
            </nav>
            <p className="meta meta--gold">Internal · what Garth sees</p>
            <h1 className="d1 mt3">Admin</h1>
            <p className="lede mt5 mw dim">
              One place to manage orders, publish articles and read what comes in through the forms.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="admin">
              <nav className="admin__side" aria-label="Admin sections">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={tab === t ? "on" : ""}
                    data-a={t}
                    aria-current={tab === t}
                    aria-controls="panel"
                    onClick={() => setTab(t)}
                  >
                    {LABELS[t]}
                  </button>
                ))}
              </nav>
              <div className="admin__main" id="panel" role="region" aria-live="polite" aria-label="Admin panel">
                {tab === "orders" && <OrdersPanel />}
                {tab === "products" && <ProductsPanel />}
                {tab === "posts" && <PostsPanel />}
                {tab === "forms" && <FormsPanel />}
                {tab === "settings" && <SettingsPanel />}
              </div>
            </div>
          </div>
        </section>

        <section className="sec tint">
          <div className="wrap">
            <p className="meta meta--gold">Email notifications</p>
            <h2 className="d2 mt3">Two emails per order.</h2>
            <p className="body mt3 mw">
              The proposal calls for a confirmation to the customer and a notification to Garth. Both templates below.
            </p>
            <div className="grid g2 mt5">
              <div className="block">
                <p className="meta meta--dim">To the customer</p>
                <div className="code mt3">
                  {`Subject: Your order GH-696539 is confirmed

Hi Tony,

Thanks, your order is in.

  Wake The Faith Up      $25.00   (your contribution)
  WTFU Tee  Slate / L    $32.00
  ─────────────────────────────
  Shipping                $6.95
  Tax                     $3.92
  Total                  $67.87

Your downloads
  Burn This Book.pdf  [ signed link, 12 months ]

Shipping
  Printed items ship in 5–9 business days.
  Tracking follows in a second email.

Garth`}
                </div>
              </div>
              <div className="block">
                <p className="meta meta--dim">To Garth</p>
                <div className="code mt3">
                  {`Subject: New order GH-696539, $67.87

Customer   Tony Herman
            tony@webstix.com

Items      WTFU (contribution $25)
            WTFU Tee, Slate / L

Fulfilment 1 to ship yourself (the book)
            1 sent to Printify automatically

Ship to    12 Main St
            Madison, Wisconsin 53703

View in admin →`}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}

function OrdersPanel() {
  const rows: Array<[string, string, string, string, string, string]> = [
    ["GH-696539", "Tony Herman", "WTFU + Tee", "You + Printify", "paid", "67.87"],
    ["GH-694120", "Sara Klein", "Burn This Book", "Download", "completed", "5.00"],
    ["GH-693884", "Mark Ellis", "WTFU ×2", "You", "paid", "80.00"],
    ["GH-691002", "Dana Roy", "Mug 15oz", "Printify", "shipped", "22.00"],
    ["GH-690455", "Pete Nasr", "Generations Deck", "Download", "completed", "5.00"],
  ];
  return (
    <>
      <div className="between mb4">
        <h2 className="d3">Orders</h2>
        <span className="badge badge--ok">3 new</span>
      </div>
      <div className="scroll-x">
        <table className="otable">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Fulfilment</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]}>
                <td>
                  <strong>{r[0]}</strong>
                </td>
                <td>{r[1]}</td>
                <td>{r[2]}</td>
                <td>{r[3]}</td>
                <td>
                  <span className={`badge badge--${r[4] === "paid" ? "warn" : "ok"}`}>{r[4]}</span>
                </td>
                <td style={{ textAlign: "right" }} className="tnum">
                  ${r[5]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">
        Pay-what-you-want book sales and merchandise orders are tracked in the same list, tagged by fulfilment.
      </p>
    </>
  );
}

function ProductsPanel() {
  return (
    <>
      <div className="between mb4">
        <h2 className="d3">Products</h2>
        <button className="btn btn--sm" type="button">
          Add product
        </button>
      </div>
      <div className="scroll-x">
        <table className="otable">
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Fulfilment</th>
              <th>Stock</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {Catalog.all().map((p) => {
              const stock =
                p.variants && p.variants.length
                  ? `${p.variants.reduce((n, v) => n + v.inventory, 0)} across ${p.variants.length} variants`
                  : p.inventory && p.inventory.tracked
                    ? p.inventory.quantity == null
                      ? "Not set"
                      : String(p.inventory.quantity)
                    : "Not tracked";
              const price =
                p.type === "pwyw"
                  ? `${formatMoney0(p.price.suggested ?? 0)} suggested`
                  : p.price.amount == null
                    ? "TBC"
                    : formatMoney(p.price.amount);
              return (
                <tr key={p.id}>
                  <td>
                    <strong>{p.title}</strong>
                    <br />
                    <span className="xs dim">{p.sku}</span>
                  </td>
                  <td>
                    <code>{p.type}</code>
                  </td>
                  <td>
                    <code>{p.fulfillment}</code>
                  </td>
                  <td>{stock}</td>
                  <td>
                    <span className={`badge badge--${p.status === "active" ? "ok" : "warn"}`}>{p.status}</span>
                  </td>
                  <td style={{ textAlign: "right" }} className="tnum">
                    {price}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PostsPanel() {
  const rows = [
    ["Name the thing that will actually end it", "published", "18 Aug 26"],
    ["They were raised in a different room", "published", "11 Aug 26"],
    ["If it sounds like a pitch, they already left", "published", "04 Aug 26"],
    ["What I would tell a 25-year-old pastor", "draft", "Not scheduled"],
    ["Five things I got wrong about growth", "draft", "Not scheduled"],
  ];
  return (
    <>
      <div className="between mb4">
        <h2 className="d3">Blog posts</h2>
        <button className="btn btn--sm" type="button">
          Write an article
        </button>
      </div>
      <p className="body mb4 mw">
        Write, add images, preview before publishing, publish with one click, unpublish or edit any time. No coding, no
        technical steps.
      </p>
      <div className="scroll-x">
        <table className="otable">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]}>
                <td>
                  <strong>{r[0]}</strong>
                </td>
                <td>
                  <span className={`badge badge--${r[1] === "published" ? "ok" : "warn"}`}>{r[1]}</span>
                </td>
                <td>{r[2]}</td>
                <td style={{ textAlign: "right" }}>
                  <span className="btn btn--line btn--sm">Edit</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FormsPanel() {
  const rows = [
    ["Rachel M.", "Speaking enquiry", "09 Aug 26, 08:14", "unread"],
    ["Pastor Dave K.", "Bridgeworks / generations", "08 Aug 26, 17:02", "unread"],
    ["Tom B.", "Cancer: I am in the fight", "07 Aug 26, 21:40", "replied"],
    ["Anna S.", "Simply Church", "06 Aug 26, 12:11", "replied"],
  ];
  return (
    <>
      <div className="between mb4">
        <h2 className="d3">Form submissions</h2>
        <span className="badge badge--warn">2 unread</span>
      </div>
      <p className="body mb4 mw">
        Every contact, speaking and Simply Church enquiry lands here as well as in Garth&apos;s inbox, so nothing gets
        lost in email.
      </p>
      <div className="scroll-x">
        <table className="otable">
          <thead>
            <tr>
              <th>From</th>
              <th>Topic</th>
              <th>Received</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]}>
                <td>
                  <strong>{r[0]}</strong>
                </td>
                <td>{r[1]}</td>
                <td className="tnum">{r[2]}</td>
                <td>
                  <span className={`badge badge--${r[3] === "unread" ? "warn" : "ok"}`}>{r[3]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SettingsPanel() {
  return (
    <>
      <h2 className="d3 mb4">Store settings</h2>
      <div className="grid g2">
        <div className="block">
          <p className="meta meta--gold">Payment</p>
          <dl className="spec mt3">
            <dt>Gateway</dt>
            <dd>
              PayPal <span className="badge badge--warn">confirm</span>
            </dd>
            <dt>Venmo</dt>
            <dd>Enabled inside PayPal</dd>
            <dt>Currency</dt>
            <dd>USD</dd>
          </dl>
        </div>
        <div className="block">
          <p className="meta meta--gold">Shipping &amp; tax</p>
          <dl className="spec mt3">
            <dt>Flat rate</dt>
            <dd>$6.95, free over $75</dd>
            <dt>Printify</dt>
            <dd>Connected, rates from API</dd>
            <dt>Tax</dt>
            <dd>MN 6.875%</dd>
          </dl>
        </div>
        <div className="block">
          <p className="meta meta--gold">Notifications</p>
          <dl className="spec mt3">
            <dt>Customer</dt>
            <dd>Order confirmation + downloads</dd>
            <dt>Garth</dt>
            <dd>garthwheckman@gmail.com</dd>
            <dt>Shipping</dt>
            <dd>Tracking email on dispatch</dd>
          </dl>
        </div>
        <div className="block">
          <p className="meta meta--gold">Digital delivery</p>
          <dl className="spec mt3">
            <dt>Link life</dt>
            <dd>12 months</dd>
            <dt>Download cap</dt>
            <dd>5 per file</dd>
            <dt>Storage</dt>
            <dd>Signed URLs</dd>
          </dl>
        </div>
      </div>
    </>
  );
}
