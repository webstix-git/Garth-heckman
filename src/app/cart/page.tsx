"use client";

import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";
import { IconArrow, IconCheck, IconInfo, IconShield, IconTruck } from "@/components/icons";
import { FREE_SHIPPING_AT, validateCart } from "@/lib/cart";
import { formatMoney, formatMoneyOrFree } from "@/lib/money";
import { useCart } from "@/components/CartProvider";
import { useState } from "react";

export default function CartPage() {
  const cart = useCart();
  const { lines, subtotal, discount, shipping, tax, total, physical, digital, promo } = cart;
  const issues = validateCart(cart.items);
  const [promoIn, setPromoIn] = useState("");
  const [promoMsg, setPromoMsg] = useState("");

  function issueFor(key: string) {
    return issues.find((x) => x.key === key);
  }

  return (
    <SiteChrome nav="store">
      <main id="main">
        <section className="sec">
          <div className="wrap">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <a href="/store">Resources</a>
              <s>/</s>
              <span>Cart</span>
            </nav>
            <h1 className="d2">Your cart</h1>
            <div id="body" className="mt6">
              {!lines.length ? (
                <div className="empty">
                  <h2 className="d3">Nothing in here yet.</h2>
                  <p className="body mt3 mw-s" style={{ marginInline: "auto" }}>
                    Start with the book. Pay what you can. That part is genuinely up to you.
                  </p>
                  <div className="row mt5" style={{ justifyContent: "center" }}>
                    <a className="btn" href="/product/wtfu-book">
                      Get WTFU
                    </a>
                    <a className="btn btn--line" href="/store">
                      Browse resources
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="comm">
                    <div>
                      {issues.length ? (
                        <div className="notice notice--bad mb4">
                          <IconInfo />
                          <span>
                            <strong>Check your cart.</strong> {issues.length}{" "}
                            {issues.length === 1 ? "item needs" : "items need"} attention before checkout.
                          </span>
                        </div>
                      ) : null}
                      {physical && digital ? (
                        <div className="notice notice--info mb4">
                          <IconInfo />
                          <span>
                            <strong>Mixed order.</strong> Your downloads are available the second you pay. The printed
                            items ship separately.
                          </span>
                        </div>
                      ) : null}
                      {lines.map((i) => {
                        const m = i.media || { variant: "default" };
                        const bad = issueFor(i.key);
                        const each =
                          i.qty > 1 ? <s className="li__each">{formatMoney(i.unitCents)} each</s> : null;
                        const minD = i.product.price.min != null ? i.product.price.min / 100 : 1;
                        const maxD = i.product.price.max != null ? i.product.price.max / 100 : 10000;
                        return (
                          <div className={`li${bad ? " li--flag" : ""}`} data-key={i.key} key={i.key}>
                            <a href={`/product/${i.slug}`} tabIndex={-1} aria-hidden="true">
                              <Shot variant={m.variant} ratio="1-1" label={false} src={"src" in m ? m.src : undefined} />
                            </a>
                            <div>
                              <a href={`/product/${i.slug}`}>
                                <p className="li__t">{i.title}</p>
                              </a>
                              <p className="li__meta meta meta--dim">
                                {i.optionsLabel ? <s>{i.optionsLabel}</s> : null}
                                <s>{i.shipping ? "Ships to you" : "Digital download"}</s>
                                <s>{i.sku}</s>
                              </p>
                              {i.type === "pwyw" ? (
                                <div className="li__pwyw">
                                  <label className="label" htmlFor={`a-${i.key}`}>
                                    Your contribution <s>per copy</s>
                                  </label>
                                  <div className="li__amt">
                                    <span className="pwyw__cur">$</span>
                                    <input
                                      className="input"
                                      id={`a-${i.key}`}
                                      type="number"
                                      min={minD}
                                      max={maxD}
                                      step={1}
                                      defaultValue={Math.round(i.unitCents / 100)}
                                      data-amount
                                      aria-describedby={`e-${i.key}`}
                                      onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        if (!isNaN(v)) cart.setPwyw(i.key, Math.round(v * 100));
                                      }}
                                    />
                                  </div>
                                  <p className="li__err" id={`e-${i.key}`} role="alert"></p>
                                </div>
                              ) : null}
                              <div className="li__act">
                                <div className="qty">
                                  <button
                                    type="button"
                                    data-step="down"
                                    aria-label={`Decrease quantity of ${i.title}`}
                                    onClick={() => cart.setQty(i.key, i.qty - 1)}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    value={i.qty}
                                    min={1}
                                    data-qty
                                    aria-label={`Quantity for ${i.title}`}
                                    onChange={(e) => cart.setQty(i.key, parseInt(e.target.value, 10) || 1)}
                                  />
                                  <button
                                    type="button"
                                    data-step="up"
                                    aria-label={`Increase quantity of ${i.title}`}
                                    onClick={() => cart.setQty(i.key, i.qty + 1)}
                                  >
                                    +
                                  </button>
                                </div>
                                <button
                                  className="btn btn--bad btn--sm"
                                  data-remove
                                  type="button"
                                  aria-label={`Remove ${i.title} from cart`}
                                  onClick={() => {
                                    cart.remove(i.key);
                                    cart.announce(`${i.title} removed from your cart.`);
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                              {bad ? (
                                <p className="li__flag">
                                  <IconInfo />
                                  <span>{bad.msg}</span>
                                </p>
                              ) : null}
                            </div>
                            <p className="li__p">
                              {i.unitCents === 0 ? "Free" : formatMoney(i.unitCents * i.qty)}
                              {each}
                            </p>
                          </div>
                        );
                      })}
                      <div className="between mt5">
                        <a className="tlink" href="/store">
                          <IconArrow /> Continue shopping
                        </a>
                        <button
                          className="btn btn--quiet"
                          id="clear"
                          type="button"
                          onClick={() => {
                            if (confirm("Clear all items from your cart?")) {
                              cart.clear();
                              cart.clearPromo();
                              cart.announce("Cart cleared.");
                            }
                          }}
                        >
                          Clear cart
                        </button>
                      </div>
                    </div>
                    <aside className="summary" aria-label="Order summary">
                      <h2 className="d4 mb4">Order summary</h2>
                      <div className="sline">
                        <span className="dim">Subtotal</span>
                        <span className="tnum">{formatMoney(subtotal)}</span>
                      </div>
                      {discount > 0 && promo ? (
                        <div className="sline sline--save">
                          <span>{promo.label}</span>
                          <span className="tnum">−{formatMoney(discount)}</span>
                        </div>
                      ) : null}
                      {physical ? (
                        <div className="sline">
                          <span className="dim">Shipping</span>
                          <span className="tnum">{shipping === 0 ? "Free" : formatMoney(shipping)}</span>
                        </div>
                      ) : (
                        <div className="sline">
                          <span className="dim">Delivery</span>
                          <span>Instant</span>
                        </div>
                      )}
                      <div className="sline">
                        <span className="dim">Estimated tax</span>
                        <span className="tnum">{formatMoney(tax)}</span>
                      </div>
                      <details className="promo" open={!!promo}>
                        <summary>Have a promo code?</summary>
                        {promo ? (
                          <p className="promo__on">
                            <IconCheck />
                            <b>{promo.code}</b> {promo.label}{" "}
                            <button
                              type="button"
                              className="btn btn--quiet btn--sm"
                              id="promoOff"
                              onClick={() => {
                                cart.clearPromo();
                                cart.announce("Promo code removed.");
                              }}
                            >
                              Remove
                            </button>
                          </p>
                        ) : (
                          <>
                            <div className="promo__row">
                              <label className="sr" htmlFor="promoIn">
                                Promo code
                              </label>
                              <input
                                className="input"
                                id="promoIn"
                                placeholder="Enter code"
                                autoComplete="off"
                                value={promoIn}
                                onChange={(e) => setPromoIn(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const r = cart.applyPromo(promoIn);
                                    setPromoMsg(r.ok ? "" : r.msg);
                                    if (r.ok) cart.announce(r.msg);
                                  }
                                }}
                              />
                              <button
                                className="btn btn--line btn--sm"
                                id="promoGo"
                                type="button"
                                onClick={() => {
                                  const r = cart.applyPromo(promoIn);
                                  setPromoMsg(r.ok ? "" : r.msg);
                                  if (r.ok) cart.announce(r.msg);
                                }}
                              >
                                Apply
                              </button>
                            </div>
                            <p className={`promo__msg${promoMsg ? " bad" : ""}`} id="promoMsg" role="alert">
                              {promoMsg}
                            </p>
                          </>
                        )}
                      </details>
                      <div className="stotal">
                        <span className="label" style={{ margin: 0 }}>
                          Total
                        </span>
                        <b className="tnum">{formatMoneyOrFree(total)}</b>
                      </div>
                      <a className="btn btn--lg btn--block mt5" href="/checkout">
                        {total === 0 ? "Get it free" : "Checkout"}
                      </a>
                      <ul className="trustlist">
                        <li>
                          <IconShield />
                          Secure checkout, no card details stored here
                        </li>
                        <li>
                          <IconCheck />
                          Guest checkout, no account needed
                        </li>
                      </ul>
                      {physical && shipping > 0 ? (
                        <div className="notice notice--info mt4">
                          <IconTruck />
                          <span>Add {formatMoney(FREE_SHIPPING_AT - subtotal)} to qualify for free shipping.</span>
                        </div>
                      ) : null}
                    </aside>
                  </div>
                  <div className="cartbar">
                    <div className="cartbar__in">
                      <span>
                        <s>Total</s>
                        <b className="tnum">{formatMoneyOrFree(total)}</b>
                      </span>
                      <a className="btn btn--lg" href="/checkout">
                        {total === 0 ? "Get it free" : "Checkout"}
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
