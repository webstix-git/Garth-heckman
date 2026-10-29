"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { Product, ProductMedia } from "@/lib/catalog";
import { Catalog } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { Shot } from "@/components/Shot";
import { Pwyw } from "@/components/Pwyw";
import { ProductCard } from "@/components/ProductCard";
import { IconArrow, IconCheck, IconDownload, IconMail, IconPlay, IconShield, IconTruck } from "@/components/icons";
import { addProductToCart, useCart } from "@/components/CartProvider";
import { isPayWhatYouWantPrice } from "@/lib/pay-what-you-want";
import { contentSectionsFromStorefront, ensureSkuInDetailsBody } from "@/lib/product-content-sections";
import { toProseHtml } from "@/lib/rich-text";
import { isOptionValueAvailable, isPurchasable } from "@/lib/product-stock";

function Accordion({ product: p }: { product: Product }) {
  const customSections = (p.contentSections || []).filter(
    (section) => section.heading.trim() || section.body.trim(),
  );
  // Same one-by-one prose Details as WTFU — never the two-column .spec grid.
  const sections = (customSections.length ? customSections : contentSectionsFromStorefront(p)).map(
    (section) =>
      section.heading.trim().toLowerCase() === "details"
        ? { ...section, body: ensureSkuInDetailsBody(section.body, p.sku) }
        : section,
  );
  // All sections open by default; click still toggles each heading.
  const [openByIndex, setOpenByIndex] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(sections.map((_, index) => [index, true])),
  );

  return (
    <div className="acc mt6" data-acc-react>
      {sections.map((section, index) => {
        const open = openByIndex[index] ?? false;
        return (
          <div key={`${section.heading}-${index}`} className={open ? "acc__item open" : "acc__item"}>
            <button
              className="acc__btn"
              type="button"
              aria-expanded={open}
              onClick={() =>
                setOpenByIndex((current) => ({
                  ...current,
                  [index]: !(current[index] ?? false),
                }))
              }
            >
              {section.heading || `Section ${index + 1}`} <i></i>
            </button>
            <div className="acc__panel">
              <div>
                <div
                  className="in prose"
                  dangerouslySetInnerHTML={{ __html: toProseHtml(section.body) }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProductView({
  slug,
  product,
  relatedProducts,
  className,
  style,
  children,
}: {
  slug: string;
  product?: Product | null;
  relatedProducts?: Product[];
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const p = product ?? Catalog.bySlug(slug);
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
  return <ProductViewInner p={p} relatedProducts={relatedProducts} className={className} style={style} chrome={children} />;
}

function ProductViewInner({
  p,
  relatedProducts,
  className,
  style,
  chrome,
}: {
  p: Product;
  relatedProducts?: Product[];
  className?: string;
  style?: CSSProperties;
  chrome?: ReactNode;
}) {
  const cart = useCart();
  const [media, setMedia] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  /** No default variant: the shopper picks each option, except options with only one value. */
  const [sel, setSel] = useState<Record<string, string>>(() =>
    Object.fromEntries((p.options || []).filter((o) => o.values.length === 1).map((o) => [o.name, o.values[0].value])),
  );
  const optionNames = useMemo(() => (p.options || []).map((o) => o.name), [p.options]);
  const hasOptions = optionNames.length > 0;
  const selectionComplete =
    !hasOptions || optionNames.every((name) => Boolean(sel[name]));
  const variant = useMemo(
    () => (selectionComplete ? Catalog.variantFor(p, sel) : null),
    [p, sel, selectionComplete],
  );

  useEffect(() => {
    if (variant?.image) setMedia(0);
  }, [variant?.id, variant?.image]);

  function inStock() {
    if (!selectionComplete && hasOptions) return true;
    return isPurchasable(p, hasOptions ? variant : null);
  }
  function avail(name: string, val: string) {
    return isOptionValueAvailable(p, name, val, sel);
  }

  // Products such as digital downloads may not have artwork. Keep a placeholder
  // gallery item so the product page can still render its title and purchase UI.
  const galleryBase: ProductMedia[] = p.media.length
    ? p.media.some((x) => x.src)
      ? p.media.filter((x) => x.src)
      : p.media
    : [{ kind: "image", variant: "default", ratio: "1-1", label: p.title, note: "" }];
  const variantImage: ProductMedia | null =
    variant?.image && selectionComplete
      ? {
          kind: "image",
          variant: "default",
          ratio: "1-1",
          label: variant.sku || "Selected variation",
          note: "",
          src: variant.image,
        }
      : null;
  const gallery: ProductMedia[] = variantImage
    ? [variantImage, ...galleryBase.filter((item) => item.src !== variantImage.src)]
    : galleryBase;
  const active = Math.min(Math.max(media, 0), Math.max(gallery.length - 1, 0));
  const m = gallery[active] ?? gallery[0];
  const hasSlider = gallery.length > 1;
  const go = (next: number) => setMedia((next + gallery.length) % gallery.length);
  const isPwyw = isPayWhatYouWantPrice(p.price);
  const showVariantDetails = !hasOptions || (selectionComplete && !!variant);
  const unit = showVariantDetails
    ? variant
      ? variant.price
      : p.price.amount
    : null;
  const compareAt = showVariantDetails
    ? variant?.compareAt ?? p.price.compareAt
    : null;
  const related = (relatedProducts ?? Catalog.all())
    .filter(
      (candidate) =>
        candidate !== p && (p.related.includes(candidate.id) || p.related.includes(candidate.slug)),
    )
    .filter((candidate, index, items) => items.findIndex((item) => item.id === candidate.id) === index);

  function add() {
    if (hasOptions && !selectionComplete) {
      cart.toast("Choose options", "Select each option before adding to cart.");
      return;
    }
    if (p.variants?.length && !variant) {
      cart.toast("Unavailable", "That combination is not available.");
      return;
    }
    const key = addProductToCart(cart, p, { variant, qty });
    if (!key) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    cart.openDrawer();
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
            <span>{p.title}</span>
          </nav>
          <div className="pdp">
            <div>
              <div
                className="pdp-gallery"
                onKeyDown={(event) => {
                  if (!hasSlider) return;
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    go(active + 1);
                  }
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    go(active - 1);
                  }
                }}
              >
                <div
                  className="pdp-slider"
                  onTouchStart={(event) => {
                    const touch = event.changedTouches[0];
                    if (touch) (event.currentTarget as HTMLElement).dataset.touchX = String(touch.clientX);
                  }}
                  onTouchEnd={(event) => {
                    if (!hasSlider) return;
                    const start = Number((event.currentTarget as HTMLElement).dataset.touchX || 0);
                    const end = event.changedTouches[0]?.clientX ?? start;
                    const delta = end - start;
                    if (Math.abs(delta) < 40) return;
                    go(active + (delta < 0 ? 1 : -1));
                  }}
                >
                  {m.kind === "video" && m.embedUrl ? (
                    <div className="photo r1-1 pdp-slide" style={{ position: "relative", overflow: "hidden", background: "#0e0c0a" }}>
                      <iframe
                        src={m.embedUrl}
                        title={`${p.title} video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                      />
                    </div>
                  ) : (
                    <Shot
                      variant={m.variant}
                      ratio={m.ratio || "1-1"}
                      label={false}
                      alt={m.label || p.title}
                      src={m.src}
                      contain={Boolean(m.src)}
                      className="pdp-slide"
                    />
                  )}
                  {hasSlider ? (
                    <>
                      <button className="pdp-slider__nav pdp-slider__nav--prev" type="button" aria-label="Previous image" onClick={() => go(active - 1)}>
                        <IconArrow style={{ transform: "scaleX(-1)" }} />
                      </button>
                      <button className="pdp-slider__nav pdp-slider__nav--next" type="button" aria-label="Next image" onClick={() => go(active + 1)}>
                        <IconArrow />
                      </button>
                      <div className="pdp-slider__dots" role="tablist" aria-label="Product images">
                        {gallery.map((item, index) => (
                          <button
                            key={(item.src || item.label) + index}
                            type="button"
                            role="tab"
                            aria-selected={index === active}
                            aria-label={`Show image ${index + 1}`}
                            className="pdp-slider__dot"
                            onClick={() => setMedia(index)}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
                {hasSlider ? (
                  <div className="thumbs" style={{ gridTemplateColumns: `repeat(${Math.min(gallery.length, 5)}, minmax(0, 1fr))` }}>
                    {gallery.map((x, i) => (
                      <button
                        key={(x.src || x.label) + i}
                        className="thumb"
                        type="button"
                        data-thumb={i}
                        aria-pressed={i === active}
                        aria-label={`View ${x.label}`}
                        onClick={() => setMedia(i)}
                      >
                        <span className="thumb__frame">
                          <Shot variant={x.variant} ratio={x.ratio || "1-1"} label={false} src={x.src} contain={Boolean(x.src)} />
                          {x.kind === "video" ? (
                            <span className="thumb__play" aria-hidden="true">
                              <IconPlay />
                            </span>
                          ) : null}
                        </span>
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
              {p.descriptionShort || p.subtitle ? (
                <div
                  className="body sm mt2 buybox-desc"
                  dangerouslySetInnerHTML={{
                    __html: toProseHtml(p.descriptionShort || p.subtitle),
                  }}
                />
              ) : null}
              {isPwyw ? (
                <div id="pwywHost" className="mt5">
                  <Pwyw product={p} />
                </div>
              ) : hasOptions && !showVariantDetails ? (
                <div className="mt4">
                  <p className="price meta meta--dim">Select options</p>
                  <p className="hint">
                    Choose {optionNames.map((n) => n.toLowerCase()).join(" and ")} to see price and
                    availability.
                  </p>
                </div>
              ) : p.price.amount == null && unit == null ? (
                <div className="mt4">
                  <p className="price">Coming soon</p>
                </div>
              ) : (
                <div className="mt4">
                  <p className="price">
                    {unit === 0 ? "Free" : formatMoney(unit ?? 0)}
                    {compareAt ? <del>{formatMoney(compareAt)}</del> : null}
                  </p>
                  {variant?.sku ? (
                    <p className="hint" style={{ marginTop: 6 }}>
                      SKU {variant.sku}
                      {typeof variant.weightOz === "number"
                        ? ` · ${variant.weightOz} oz`
                        : p.shipping.weightOz
                          ? ` · ${p.shipping.weightOz} oz`
                          : ""}
                    </p>
                  ) : null}
                  <p className="hint">
                    {unit === 0
                      ? "Yours for nothing. Give us an email address and the file is on its way."
                      : p.shipping.required
                        ? "Plus shipping, calculated at checkout."
                        : "Instant download. No shipping, no waiting."}
                  </p>
                </div>
              )}
              {(p.options || []).map((o) => {
                const cur = sel[o.name]
                  ? o.values.find((v) => v.value === sel[o.name])
                  : undefined;
                return (
                  <div className="mt4" key={o.name}>
                    <div className="between" style={{ marginBottom: 10 }}>
                      <span className="label" style={{ margin: 0 }}>
                        {o.name}
                      </span>
                      {cur ? <span className="meta meta--dim">{cur.label}</span> : null}
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
                        Get in touch
                      </a>
                      .
                    </p>
                  </div>
                ) : hasOptions && !selectionComplete ? (
                  <div className="mt5">
                    <button className="btn btn--lg btn--block" type="button" disabled>
                      Select options
                    </button>
                    <p className="hint" style={{ textAlign: "center" }}>
                      Choose {optionNames.map((n) => n.toLowerCase()).join(" and ")} to continue.
                    </p>
                  </div>
                ) : !inStock() ? (
                  <div className="mt5">
                    <button className="btn btn--lg btn--block" disabled>
                      Sold out
                    </button>
                    <p className="hint" style={{ textAlign: "center" }}>
                      {hasOptions
                        ? "That combination is gone. Try another size or color."
                        : "This item is currently out of stock."}
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
