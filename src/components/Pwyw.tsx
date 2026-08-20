"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import { formatMoney, formatMoney0 } from "@/lib/money";
import { IconArrow, IconCheck } from "@/components/icons";
import { addProductToCart, useCart } from "@/components/CartProvider";
import { useRouter } from "next/navigation";

export function Pwyw({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const pr = product.price;
  const min = pr.min ?? 0;
  const max = pr.max ?? 50000;
  const suggested = pr.suggested ?? min;
  const presets = pr.presets;
  const cart = useCart();
  const router = useRouter();
  const [amount, setAmount] = useState(suggested);
  const [showCustom, setShowCustom] = useState(false);
  const [added, setAdded] = useState(false);

  const gets =
    product.pwywGets ||
    (product.fulfillment === "download"
      ? ["MP3 and M4B files", "Read by Garth himself", "Yours to keep, no app required"]
      : ["Paperback, 214 pages", "30-day devotional included", "Signed by Garth", "Ships free in the US"]);
  const isPreset = presets.indexOf(amount) > -1;

  const dollarValue = useMemo(() => Math.round(amount / 100), [amount]);

  function setCents(v: number, fromInput = false) {
    let n = Math.round(v);
    n = Math.max(min, Math.min(max, n));
    setAmount(n);
    if (!fromInput && presets.indexOf(n) > -1) setShowCustom(false);
  }

  function go() {
    addProductToCart(cart, product, { pwywCents: amount, qty: 1 });
    if (compact) {
      router.push("/checkout");
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    cart.openDrawer();
  }

  return (
    <div className="pwyw">
      <div className="pwyw__head">
        <p className="meta">Choose your contribution</p>
        <p className="meta meta--dim">Minimum {formatMoney0(min)}</p>
      </div>

      <div className="pwyw__row" role="group" aria-label="Contribution amount">
        {presets.map((v, i) => (
          <button
            key={v}
            type="button"
            className="pwyw__amt"
            data-amt={v}
            aria-pressed={v === amount}
            aria-label={`Contribute ${formatMoney0(v)}${i === 0 ? ", the suggested amount" : ""}`}
            onClick={() => {
              setShowCustom(false);
              setCents(v);
            }}
          >
            {formatMoney0(v)}
            <span>{i === 0 ? "Suggested" : "\u00a0"}</span>
          </button>
        ))}
        <button
          type="button"
          className="pwyw__amt pwyw__amt--other"
          data-other
          aria-pressed={!isPreset}
          aria-expanded={showCustom}
          onClick={() => {
            setShowCustom((s) => !s);
          }}
        >
          <b>$</b> Other
        </button>
      </div>

      <div className={`pwyw__custom${showCustom ? " show" : ""}`} data-custom="">
        <label className="sr" htmlFor="pwywIn">
          Other amount
        </label>
        <span className="pwyw__cur">$</span>
        <input
          className="input"
          id="pwywIn"
          type="number"
          inputMode="decimal"
          min={min / 100}
          max={max / 100}
          step={1}
          value={dollarValue}
          onChange={(e) => setCents((parseFloat(e.target.value) || 0) * 100, true)}
          onBlur={(e) => setCents((parseFloat(e.target.value) || 0) * 100)}
        />
      </div>

      <div className="pwyw__gets">
        {gets.map((g) => (
          <span key={g}>
            <IconCheck />
            {g}
          </span>
        ))}
      </div>

      <div className="pwyw__foot">
        <div className="pwyw__total">
          <span className="meta meta--dim">Your contribution</span>
          <b data-total="">{formatMoney(amount)}</b>
        </div>
        <button className={`btn btn--lg btn--block${added ? " done" : ""}`} data-go type="button" onClick={go}>
          {added ? (
            <>
              <IconCheck /> Added
            </>
          ) : compact ? (
            "Get WTFU"
          ) : (
            product.ctaLabel || "Get the book"
          )}
        </button>
        {compact ? (
          <a className="tlink pwyw__more" href={`/product/${product.slug}`}>
            About the book <IconArrow />
          </a>
        ) : null}
      </div>

      <p className="pwyw__note">
        {product.fulfillment === "download"
          ? `Suggested donation, from ${formatMoney0(min)} to ${formatMoney0(max)}. If ${formatMoney0(min)} is what you have right now, that is the right number.`
          : `Every dollar helps Garth keep printing the book and getting it into more hands. Suggested donation ${formatMoney0(suggested)}. If ${formatMoney0(min)} is what you have right now, that is the right number. The book still ships.`}
      </p>
    </div>
  );
}
