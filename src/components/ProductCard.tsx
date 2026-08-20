"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { Catalog } from "@/lib/catalog";
import { formatMoney, formatMoney0 } from "@/lib/money";
import { Shot } from "@/components/Shot";
import { IconCheck } from "@/components/icons";
import { addProductToCart, useCart } from "@/components/CartProvider";

function stockOf(p: Product) {
  if (p.status === "coming-soon") return { ok: false, label: "Coming soon", v: "" };
  if (p.variants && p.variants.length) {
    const left = p.variants.reduce((a, v) => a + v.inventory, 0);
    if (!left) return { ok: false, label: "Sold out", v: "bad" };
    if (left < 15) return { ok: true, label: "Low stock", v: "warn" };
  }
  if (p.inventory && p.inventory.tracked && p.inventory.quantity != null && p.inventory.quantity < 30)
    return { ok: true, label: `Only ${p.inventory.quantity} left`, v: "warn" };
  return { ok: true, label: null as string | null };
}

function firstInStockVariant(p: Product) {
  if (!p.variants || !p.variants.length) return null;
  return p.variants.find((v) => v.inventory > 0) || null;
}

function Price({ p }: { p: Product }) {
  if (p.type === "pwyw") {
    const min = p.price.min ?? 0;
    const max = p.price.max;
    const suggested = p.price.suggested ?? 0;
    if (max != null && min > 0 && min < suggested) {
      return (
        <>
          <small>Suggested donation</small>
          {formatMoney0(min)}–{formatMoney0(max)}
        </>
      );
    }
    return (
      <>
        <small>Pay what you can</small>
        {formatMoney0(suggested)}
        <span style={{ fontSize: 14, fontWeight: 600 }}> suggested</span>
      </>
    );
  }
  if (p.price.amount == null)
    return (
      <>
        <small>Coming soon</small>
        <span style={{ fontSize: 16 }}>Price TBC</span>
      </>
    );
  if (p.price.amount === 0)
    return (
      <>
        <small>No charge</small>Free
      </>
    );
  return (
    <>
      {formatMoney(p.price.amount)}
      {p.price.compareAt ? <del>{formatMoney(p.price.compareAt)}</del> : null}
    </>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const cart = useCart();
  const [added, setAdded] = useState(false);
  const st = stockOf(p);
  const m = p.media[0] || { variant: "default", label: "", note: "" };
  const badges: Array<{ label: string; variant?: string }> = [];
  const skipInstant = p.categories.includes("books") || p.slug === "burn-this-book";
  if (p.badge && !(skipInstant && p.badge.label.toLowerCase() === "instant download"))
    badges.push({ label: p.badge.label, variant: p.badge.variant === "digital" ? "" : p.badge.variant });
  if (st.label && !(p.badge && p.badge.label.toLowerCase() === st.label.toLowerCase()))
    badges.push({ label: st.label, variant: st.v });

  const label = p.price.amount === 0 ? "Get it free" : "Add to cart";

  function add() {
    const v = firstInStockVariant(p);
    addProductToCart(cart, p, {
      variant: v,
      pwywCents: p.type === "pwyw" ? (p.price.suggested ?? undefined) : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    if (p.type === "pwyw") cart.openDrawer();
    else cart.toast("Added to cart", p.title + (v ? ` · ${Catalog.primaryCategoryLabel(p)}` : ""), "#cart", "View cart");
  }

  return (
    <article className="pcard">
      <div className="pcard__media">
        <Shot
          variant={m.variant}
          ratio={m.ratio || "1-1"}
          label={m.label}
          note={m.note}
          src={m.src}
          contain={Boolean(m.src)}
        />
        {badges.length ? (
          <div className="pcard__badges">
            {badges.map((b) => (
              <span key={b.label} className={`badge${b.variant ? ` badge--${b.variant}` : ""}`}>
                {b.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="pcard__body">
        <p className="meta meta--dim">{Catalog.primaryCategoryLabel(p)}</p>
        <h3 className="pcard__t">
          <a href={`/product/${p.slug}`}>{p.title}</a>
        </h3>
        <p className="pcard__d">{p.descriptionShort}</p>
        <div className="pcard__foot">
          <p className="pcard__price">
            <Price p={p} />
          </p>
          <div className="pcard__acts">
            {p.status === "coming-soon" ? (
              <button className="btn btn--sm" disabled>
                Coming soon
              </button>
            ) : !st.ok ? (
              <button className="btn btn--sm" disabled>
                Sold out
              </button>
            ) : (
              <button className={`btn btn--sm${added ? " done" : ""}`} type="button" onClick={add}>
                {added ? (
                  <>
                    <IconCheck /> Added
                  </>
                ) : (
                  label
                )}
              </button>
            )}
            <a className="btn btn--line btn--sm" href={`/product/${p.slug}`}>
              View details
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <>
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </>
  );
}
