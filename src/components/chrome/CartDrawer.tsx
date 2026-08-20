"use client";

import { useEffect } from "react";
import { Catalog } from "@/lib/catalog";
import { formatMoney, formatMoney0, formatMoneyOrFree } from "@/lib/money";
import { useCart } from "@/components/CartProvider";
import { Shot } from "@/components/Shot";
import { IconX } from "@/components/icons";

export function CartDrawer() {
  const { lines, count, subtotal, physical, drawerOpen, closeDrawer, setQty, remove } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen, closeDrawer]);

  const have = lines.map((i) => i.productId);
  const picks = Catalog.all()
    .filter((p) => have.indexOf(p.id) === -1 && p.status === "active")
    .slice(0, 2);

  return (
    <>
      <div className={`scrim${drawerOpen ? " show" : ""}`} id="scrim" onClick={closeDrawer} />
      <aside
        className={`drawer${drawerOpen ? " open" : ""}`}
        id="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        aria-hidden={!drawerOpen}
      >
        <div className="drawer__head">
          <p className="meta">
            Your cart <span data-dcount="">{lines.length ? `(${count})` : ""}</span>
          </p>
          <button className="drawer__x" type="button" data-dclose aria-label="Close cart" onClick={closeDrawer}>
            <IconX />
          </button>
        </div>
        <div className="drawer__body" data-dbody="">
          {!lines.length ? (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <p className="d4">Your cart is empty.</p>
              <p className="body sm mt2">Books, downloads and merchandise, all in one place.</p>
            </div>
          ) : (
            <>
              {lines.map((i) => {
                const m = i.media || { variant: "default" };
                return (
                  <div className="dline" data-key={i.key} key={i.key}>
                    <a href={`/product/${i.slug}`}>
                      <Shot variant={m.variant} ratio="1-1" label={false} src={"src" in m ? m.src : undefined} />
                    </a>
                    <div>
                      <a href={`/product/${i.slug}`}>
                        <p className="dline__t">{i.title}</p>
                      </a>
                      <p className="dline__m meta meta--dim">
                        {i.type === "pwyw"
                          ? `Your contribution: ${formatMoney(i.unitCents)}`
                          : i.optionsLabel || (i.shipping ? "Ships to you" : "Digital download")}
                      </p>
                      <div className="dline__ctl">
                        <div className="qty qty--sm">
                          <button type="button" data-step="down" aria-label="Decrease" onClick={() => setQty(i.key, i.qty - 1)}>
                            −
                          </button>
                          <input
                            type="number"
                            value={i.qty}
                            min={1}
                            data-dqty
                            aria-label={`Quantity for ${i.title}`}
                            onChange={(e) => setQty(i.key, parseInt(e.target.value, 10) || 1)}
                          />
                          <button type="button" data-step="up" aria-label="Increase" onClick={() => setQty(i.key, i.qty + 1)}>
                            +
                          </button>
                        </div>
                        <a
                          href="#"
                          className="dline__x"
                          data-dremove
                          onClick={(e) => {
                            e.preventDefault();
                            remove(i.key);
                          }}
                        >
                          Remove
                        </a>
                      </div>
                    </div>
                    <p className="dline__p">{formatMoney(i.unitCents * i.qty)}</p>
                  </div>
                );
              })}
              {picks.length > 0 && (
                <div className="dxsell">
                  <p className="meta meta--dim">You may also like</p>
                  <div className="dxsell__row">
                    {picks.map((p) => {
                      const m = p.media[0] || { variant: "default" };
                      const price =
                        p.type === "pwyw"
                          ? `${formatMoney0(p.price.suggested ?? 0)} suggested`
                          : formatMoney(p.price.amount ?? 0);
                      return (
                        <a className="dxsell__i" href={`/product/${p.slug}`} key={p.id}>
                          <Shot variant={m.variant} ratio="1-1" label={false} src={"src" in m ? m.src : undefined} />
                          <p>{p.title}</p>
                          <span>{price}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="drawer__foot" data-dfoot="">
          {!lines.length ? (
            <>
              <a className="btn btn--block" href="/store">
                Shop the store
              </a>
              <button className="btn btn--quiet btn--block mt2" type="button" data-dclose onClick={closeDrawer}>
                Continue browsing
              </button>
            </>
          ) : (
            <>
              <div className="dsum">
                <span className="meta meta--dim">Subtotal</span>
                <b>{formatMoneyOrFree(subtotal)}</b>
              </div>
              <p className="hint" style={{ margin: "0 0 14px" }}>
                {subtotal === 0
                  ? "Nothing to pay. Just an email address for the file."
                  : physical
                    ? "Shipping and tax calculated at checkout."
                    : "Digital order, no shipping."}
              </p>
              <a className="btn btn--lg btn--block" href="/checkout">
                {subtotal === 0 ? "Get it free" : "Checkout"}
              </a>
              <a className="btn btn--line btn--block mt2" href="/cart">
                View full cart
              </a>
              <button className="btn btn--quiet btn--block mt1" type="button" data-dclose onClick={closeDrawer}>
                Continue shopping
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
