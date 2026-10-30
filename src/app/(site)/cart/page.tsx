"use client";

import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";
import { IconArrow, IconCheck, IconInfo, IconShield, IconTruck } from "@/components/icons";
import { validateCart } from "@/lib/cart";
import { formatMoney, formatMoneyOrFree } from "@/lib/money";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const cart = useCart();
  const { lines, subtotal, discount, shipping, tax, total, physical, digital, promo, priced, catalogReady } = cart;
  const issues = validateCart(cart.items);
  const loading = !catalogReady;

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
              {loading ? (
                <div className="empty cart-loading" aria-busy="true" aria-live="polite">
                  <span className="cart-loading__spin" aria-hidden="true" />
                  <p className="body mt4">Loading your cart…</p>
                </div>
              ) : !lines.length ? (
                <div className="empty">
                  <h2 className="d3">Nothing in here yet.</h2>
                  <p className="body mt3 mw-s" style={{ marginInline: "auto" }}>
                    Books, downloads and merchandise, all in one place.
                  </p>
                  <div className="row mt5" style={{ justifyContent: "center" }}>
                    <a className="btn" href="/store">
                      Browse resources
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="comm">
                    <div>
                      {cart.quoteError ? (
                        <div className="notice notice--bad mb4">
                          <IconInfo />
                          <span>
                            <strong>Check your cart.</strong> {cart.quoteError}
                          </span>
                        </div>
                      ) : null}
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
                              {i.pwywCents != null ? (
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
                                <p className="meta meta--dim" aria-label={`Quantity for ${i.title}`}>
                                  Qty {i.qty}
                                </p>
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
                          <span className="tnum">{!priced ? "…" : shipping === 0 ? "Free" : formatMoney(shipping)}</span>
                        </div>
                      ) : (
                        <div className="sline">
                          <span className="dim">Download</span>
                          <span>Instant</span>
                        </div>
                      )}
                      {priced && tax > 0 ? (
                        <div className="sline">
                          <span className="dim">
                            {cart.taxLabel}
                            {cart.taxIncluded ? " (included)" : ""}
                          </span>
                          <span className="tnum">{formatMoney(tax)}</span>
                        </div>
                      ) : null}
                      <div className="stotal">
                        <span className="label" style={{ margin: 0 }}>
                          Total
                        </span>
                        <b className="tnum">{priced ? formatMoneyOrFree(total) : "…"}</b>
                      </div>
                      <a className="btn btn--lg btn--block mt5" href="/checkout">
                        {priced && total === 0 ? "Get it free" : "Checkout"}
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
                      {physical && cart.freeShippingRemaining ? (
                        <div className="notice notice--info mt4">
                          <IconTruck />
                          <span>Add {formatMoney(cart.freeShippingRemaining)} to qualify for free shipping.</span>
                        </div>
                      ) : null}
                    </aside>
                  </div>
                  <div className="cartbar">
                    <div className="cartbar__in">
                      <span>
                        <s>Total</s>
                        <b className="tnum">{priced ? formatMoneyOrFree(total) : "…"}</b>
                      </span>
                      <a className="btn btn--lg" href="/checkout">
                        {priced && total === 0 ? "Get it free" : "Checkout"}
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
