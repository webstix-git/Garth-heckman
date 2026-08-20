"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { Product } from "@/lib/catalog";
import { Catalog } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { Shot } from "@/components/Shot";
import { Pwyw } from "@/components/Pwyw";
import { ProductCard } from "@/components/ProductCard";
import { IconCheck, IconDownload, IconMail, IconShield, IconTruck } from "@/components/icons";
import { addProductToCart, useCart } from "@/components/CartProvider";

function Accordion({ product: p }: { product: Product }) {
  const deliver = p.shipping.required ? (
    <p>
      <strong>Shipping.</strong> {p.shipping.originNote || ""} Flat rate $6.95, free over $75. You get a confirmation
      email as soon as the order is placed and a second one when it ships.
    </p>
  ) : (
    <p>
      <strong>Delivery.</strong> The download link appears on your confirmation page the moment payment clears, and is
      emailed to you as well.{" "}
      {p.digital
        ? `Up to ${p.digital.downloadLimit} downloads, link valid for ${Math.round((p.digital.expiryDays || 365) / 30)} months.`
        : ""}
    </p>
  );
  const files =
    p.digital && p.digital.files && p.digital.files.length ? (
      <p className="mt3">
        <strong>Files.</strong>{" "}
        {p.digital.files.map((f) => `${f.name} (${f.sizeMb} MB)`).join(", ")}
      </p>
    ) : null;

  return (
    <div className="acc mt6">
      <div className="acc__item open">
        <button className="acc__btn" type="button" aria-expanded="true">
          Description <i></i>
        </button>
        <div className="acc__panel">
          <div>
            <div className="in prose">
              {p.descriptionLong.map((t) => (
                <p key={t.slice(0, 24)} dangerouslySetInnerHTML={{ __html: t }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="acc__item open">
        <button className="acc__btn" type="button" aria-expanded="true">
          Details <i></i>
        </button>
        <div className="acc__panel">
          <div>
            <div className="in">
              <dl className="spec">
                {p.details.map((d) => (
                  <span key={d.label}>
                    <dt>{d.label}</dt>
                    <dd>{d.value}</dd>
                  </span>
                ))}
                <dt>SKU</dt>
                <dd className="tnum">{p.sku}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="acc__item open">
        <button className="acc__btn" type="button" aria-expanded="true">
          {p.shipping.required ? "Shipping & returns" : "Delivery & access"} <i></i>
        </button>
        <div className="acc__panel">
          <div>
            <div className="in prose">
              {deliver}
              {files}
              {p.shipping.required ? (
                <p className="mt3">
                  <strong>Returns.</strong> Something arrive damaged? Email Garth and it gets replaced. No forms.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductView({
  slug,
  className,
  style,
  children,
}: {
  slug: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const p = Catalog.bySlug(slug);
  if (!p) {
    return (
      <div className={["sec", className].filter(Boolean).join(" ")} id="pdp" style={style}>
        {children}
        <div className="wrap">
          <div className="empty">
            <h1 className="d3">We could not find that.</h1>
            <p className="body mt3">The product may have been renamed or retired.</p>
            <p className="mt5">
              <a className="btn" href="/store">
                Back to the shop
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return <ProductViewInner p={p} className={className} style={style} chrome={children} />;
}

function ProductViewInner({
  p,
  className,
  style,
  chrome,
}: {
  p: Product;
  className?: string;
  style?: CSSProperties;
  chrome?: ReactNode;
}) {
  const cart = useCart();
  const [media, setMedia] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [sel, setSel] = useState<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    (p.options || []).forEach((o) => {
      const ok = o.values.find((v) =>
        (p.variants || []).some((vr) => vr.options[o.name] === v.value && vr.inventory > 0),
      );
      s[o.name] = (ok || o.values[0]).value;
    });
    return s;
  });
  const variant = useMemo(() => Catalog.variantFor(p, sel), [p, sel]);

  function inStock() {
    if (p.status === "coming-soon") return false;
    if (p.variants && p.variants.length) return !!variant && variant.inventory > 0;
    if (p.inventory && p.inventory.tracked && p.inventory.quantity != null) return p.inventory.quantity > 0;
    return true;
  }
  function avail(name: string, val: string) {
    if (!p.variants || !p.variants.length) return true;
    const t = { ...sel, [name]: val };
    return p.variants.some(
      (v) => Object.keys(t).every((k) => v.options[k] === t[k]) && v.inventory > 0,
    );
  }

  const gallery = p.media.some((x) => x.src) ? p.media.filter((x) => x.src) : p.media;
  const m = gallery[Math.min(media, gallery.length - 1)] ?? gallery[0];
  const isPwyw = p.type === "pwyw";
  const unit = variant ? variant.price : p.price.amount;
  const related = Catalog.related(p);

  function add() {
    addProductToCart(cart, p, { variant, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    cart.toast("Added to cart", p.title, "#cart", "View cart");
  }

  return (
    <>
      <div className={["sec", className].filter(Boolean).join(" ")} id="pdp" style={style}>
        {chrome}
        <div className="wrap">
          <nav className="crumbs meta mb5" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <s>/</s>
            <a href="/store">Resources</a>
            <s>/</s>
            <a href={`/store?category=${p.categories[0]}`}>{Catalog.categoryName(p.categories[0])}</a>
            <s>/</s>
            <span>{p.title}</span>
          </nav>
          <div className="pdp">
            <div>
              <div>
                <Shot
                  variant={m.variant}
                  ratio="3-4"
                  label={false}
                  alt={m.label || p.title}
                  src={m.src}
                  contain={Boolean(m.src)}
                />
                {gallery.length > 1 ? (
                  <div className="thumbs">
                    {gallery.map((x, i) => (
                      <button
                        key={(x.src || x.label) + i}
                        className="thumb"
                        type="button"
                        data-thumb={i}
                        aria-pressed={i === Math.min(media, gallery.length - 1)}
                        aria-label={`View ${x.label}`}
                        onClick={() => setMedia(i)}
                      >
                        <Shot variant={x.variant} ratio="3-4" label={false} src={x.src} contain={Boolean(x.src)} />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="hide-s">
                <Accordion product={p} />
              </div>
            </div>
            <div className="buybox">
              <p className="meta meta--dim">{Catalog.primaryCategoryLabel(p)}</p>
              <h1 className="d2 mt2">{p.title}</h1>
              {p.subtitle ? <p className="body sm mt2">{p.subtitle}</p> : null}
              {isPwyw ? (
                <div id="pwywHost" className="mt5">
                  <Pwyw product={p} />
                </div>
              ) : p.price.amount == null ? (
                <div className="mt4">
                  <p className="price">Coming soon</p>
                </div>
              ) : (
                <div className="mt4">
                  <p className="price">
                    {unit === 0 ? "Free" : formatMoney(unit ?? 0)}
                    {p.price.compareAt ? <del>{formatMoney(p.price.compareAt)}</del> : null}
                  </p>
                  <p className="hint">
                    {p.price.amount === 0
                      ? "Yours for nothing. Give us an email address and the file is on its way."
                      : p.shipping.required
                        ? "Plus shipping, calculated at checkout."
                        : "Instant download. No shipping, no waiting."}
                  </p>
                </div>
              )}
              <p className="lede mt4">{p.descriptionShort}</p>
              {(p.options || []).map((o) => {
                const cur = o.values.find((v) => v.value === sel[o.name]);
                return (
                  <div className="mt4" key={o.name}>
                    <div className="between" style={{ marginBottom: 10 }}>
                      <span className="label" style={{ margin: 0 }}>
                        {o.name}
                      </span>
                      <span className="meta meta--dim">{cur ? cur.label : ""}</span>
                    </div>
                    {o.type === "swatch" ? (
                      <div className="swatches">
                        {o.values.map((v) => {
                          const ok = avail(o.name, v.value);
                          return (
                            <button
                              key={v.value}
                              type="button"
                              className="swatch"
                              style={{ backgroundColor: v.hex, opacity: ok ? undefined : 0.3 }}
                              aria-pressed={sel[o.name] === v.value}
                              aria-label={`${v.label}${ok ? "" : ", sold out in this size"}`}
                              onClick={() => setSel((s) => ({ ...s, [o.name]: v.value }))}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="sizes">
                        {o.values.map((v) => {
                          const ok = avail(o.name, v.value);
                          return (
                            <button
                              key={v.value}
                              type="button"
                              className="size"
                              aria-pressed={sel[o.name] === v.value}
                              disabled={!ok}
                              onClick={() => setSel((s) => ({ ...s, [o.name]: v.value }))}
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {!isPwyw ? (
                p.status === "coming-soon" ? (
                  <div className="mt5">
                    <button className="btn btn--lg btn--block" disabled>
                      Coming soon
                    </button>
                    <p className="hint" style={{ textAlign: "center" }}>
                      Want to know when it lands?{" "}
                      <a href="/contact" style={{ color: "var(--acc)", textDecoration: "underline" }}>
                        Join the list
                      </a>
                      .
                    </p>
                  </div>
                ) : !inStock() ? (
                  <div className="mt5">
                    <button className="btn btn--lg btn--block" disabled>
                      Sold out
                    </button>
                    <p className="hint" style={{ textAlign: "center" }}>
                      That combination is gone. Try another size or color.
                    </p>
                  </div>
                ) : (
                  <div className="row mt5" style={{ flexWrap: "nowrap", gap: 10 }}>
                    <div className="qty">
                      <button type="button" data-step="down" aria-label="Decrease quantity" onClick={() => setQty((n) => Math.max(1, n - 1))}>
                        −
                      </button>
                      <input id="qty" type="number" value={qty} min={1} aria-label="Quantity" onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)} />
                      <button type="button" data-step="up" aria-label="Increase quantity" onClick={() => setQty((n) => n + 1)}>
                        +
                      </button>
                    </div>
                    <button className={`btn btn--lg flex1${added ? " done" : ""}`} id="add" type="button" onClick={add}>
                      {added ? (
                        <>
                          <IconCheck /> Added
                        </>
                      ) : p.price.amount === 0 ? (
                        "Get it free"
                      ) : (
                        "Add to cart"
                      )}
                    </button>
                  </div>
                )
              ) : null}
              {!p.shipping.required ? (
                <div className="trust mt5">
                  <div>
                    <IconDownload />
                    <span>Instant download after checkout</span>
                  </div>
                  <div>
                    <IconMail />
                    <span>Link emailed to you as well</span>
                  </div>
                  <div>
                    <IconShield />
                    <span>Secure PayPal checkout</span>
                  </div>
                </div>
              ) : (
                <div className="trust mt5">
                  <div>
                    <IconTruck />
                    <span>{p.shipping.originNote || "Ships within a week"}</span>
                  </div>
                  <div>
                    <IconShield />
                    <span>Secure PayPal checkout</span>
                  </div>
                  <div>
                    <IconMail />
                    <span>Confirmation email with tracking</span>
                  </div>
                </div>
              )}
              <div className="only-s">
                <Accordion product={p} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {related.length ? (
        <div id="related">
          <section className="sec tint">
            <div className="wrap">
              <div className="between mb5">
                <h2 className="d3">You may also want</h2>
                <a className="tlink" href="/store">
                  All resources <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M2 6.5h9M7.5 3l3.5 3.5L7.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </a>
              </div>
              <div className="pgrid" id="relGrid">
                {related.map((r) => (
                  <ProductCard key={r.id} p={r} />
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div id="related" />
      )}
    </>
  );
}
