"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { formatMoney, formatMoney0 } from "@/lib/money";
import { Shot } from "@/components/Shot";
import { IconCheck } from "@/components/icons";
import { addProductToCart, useCart } from "@/components/CartProvider";
import { isPayWhatYouWantPrice } from "@/lib/pay-what-you-want";
import { stripRichText } from "@/lib/rich-text";
import { isPurchasable, productStockBadge } from "@/lib/product-stock";

/** A single sellable variant can go straight to the cart; several need the shopper to choose. */
function onlyVariant(p: Product) {
  if (!p.variants?.length) return null;
  return p.variants.length === 1 && isPurchasable(p, p.variants[0]) ? p.variants[0] : undefined;
}

function Price({ p }: { p: Product }) {
  if (p.variants.length > 1) {
    const prices = p.variants.map((v) => v.price);
    const low = Math.min(...prices);
    return (
      <>
        {Math.max(...prices) > low ? <small>From</small> : null}
        {formatMoney(low)}
      </>
    );
  }
  if (isPayWhatYouWantPrice(p.price)) {
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
  const st = productStockBadge(p);
  const m = p.media[0] || { variant: "default", label: "", note: "" };
  const badges: Array<{ label: string; variant?: string }> = [];
  if (p.badge) badges.push({ label: p.badge.label, variant: p.badge.variant === "digital" ? "" : p.badge.variant });
  if (st.label && !(p.badge && p.badge.label.toLowerCase() === st.label.toLowerCase()))
    badges.push({ label: st.label, variant: st.v });

  const variant = onlyVariant(p);
  const needsChoice = variant === undefined;
  const label = p.price.amount === 0 ? "Get it free" : "Add to cart";

  function add() {
    if (needsChoice) return;
    addProductToCart(cart, p, {
      variant,
      pwywCents: isPayWhatYouWantPrice(p.price) ? (p.price.suggested ?? undefined) : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    if (isPayWhatYouWantPrice(p.price)) cart.openDrawer();
    else cart.toast("Added to cart", p.title, "#cart", "View cart");
  }

  return (
    <article className="pcard">
      <div className="pcard__media">
        <Shot
          variant={m.variant}
          ratio={m.ratio || "1-1"}
          label={false}
          alt={m.label || p.title}
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
        <h3 className="pcard__t">
          <a href={`/product/${p.slug}`}>{p.title}</a>
        </h3>
        <p className="pcard__d">{stripRichText(p.descriptionShort)}</p>
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
            ) : needsChoice ? (
              <a className="btn btn--sm" href={`/product/${p.slug}`}>
                Choose options
              </a>
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
