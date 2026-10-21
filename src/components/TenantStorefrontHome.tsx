import type { CSSProperties } from "react";

import type { TenantStore } from "@/lib/tenant-store";

const surface: CSSProperties = { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12 };

/** Static tenant home — product cards wired later via API. */
export async function TenantStorefrontHome({ store }: { store: TenantStore }) {
  return (
    <main className="tenant-storefront" id="main">
      <header className="tenant-storefront__header">
        <a className="tenant-storefront__brand" href="/">{store.name}</a>
        <nav aria-label="Store navigation"><a href="/store">Shop</a><a href="/account">Account</a><a href="/cart">Cart</a></nav>
      </header>
      <section className="tenant-storefront__hero">
        <p>Independent store</p><h1>Simple goods, thoughtfully chosen.</h1>
        <span>Everything in this storefront belongs only to {store.name}.</span>
        <a href="/store" className="tenant-storefront__button">Shop the collection</a>
      </section>
      <section className="tenant-storefront__section">
        <div className="tenant-storefront__section-head"><h2>Featured products</h2><a href="/store">View all</a></div>
        <div className="tenant-storefront__grid">
          <div className="tenant-storefront__product" style={surface}>
            <div className="tenant-storefront__image"><span>Product image</span></div>
            <div><strong>Coming soon</strong><small>Connect your catalog API to show products here.</small></div>
          </div>
        </div>
      </section>
    </main>
  );
}
