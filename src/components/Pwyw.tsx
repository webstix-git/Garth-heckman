"use client";

import { useEffect, useRef, useState } from "react";
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
  const [customDraft, setCustomDraft] = useState(String(Math.round(suggested / 100)));
  const [added, setAdded] = useState(false);
  const customRef = useRef<HTMLInputElement>(null);

  const gets = product.pwywGets ?? [];
  const presetLabel = (value: number, index: number) =>
    pr.presetLabels?.[index] || (value === suggested ? "Suggested" : "\u00a0");
  const isPreset = presets.indexOf(amount) > -1;

  useEffect(() => {
    if (!showCustom) return;
    const el = customRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [showCustom]);

  function setCents(v: number, fromInput = false) {
    let n = Math.round(v);
    n = Math.max(min, Math.min(max, n));
    setAmount(n);
    if (!fromInput) {
      setCustomDraft(String(Math.round(n / 100)));
      if (presets.indexOf(n) > -1) setShowCustom(false);
    }
  }

  function onCustomChange(raw: string) {
    // Digits only — whole-dollar amounts.
    const digits = raw.replace(/\D/g, "");
    setCustomDraft(digits);
    if (digits === "") return;
    setCents(Number(digits) * 100, true);
  }

  function onCustomBlur() {
    const dollars = customDraft === "" ? Math.round(min / 100) : Number(customDraft);
    let cents = Math.round(dollars) * 100;
    cents = Math.max(min, Math.min(max, cents));
    setAmount(cents);
    setCustomDraft(String(Math.round(cents / 100)));
  }

  function openCustom() {
    setCustomDraft(String(Math.round(amount / 100)));
    setShowCustom(true);
  }

  function go() {
    const key = addProductToCart(cart, product, { pwywCents: amount, qty: 1 });
    if (!key) return;
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
        <p className="meta meta--dim">
          {pr.max != null && min < suggested
            ? `Anywhere from ${formatMoney0(min)} to ${formatMoney0(pr.max)}`
            : `Minimum ${formatMoney0(min)}`}
        </p>
      </div>

      <div className="pwyw__row" role="group" aria-label="Contribution amount">
        {presets.map((v, i) => (
          <button
            key={v}
            type="button"
            className="pwyw__amt"
            data-amt={v}
            aria-pressed={!showCustom && v === amount}
            aria-label={`Contribute ${formatMoney0(v)}${v === suggested ? ", the suggested amount" : ""}`}
            onClick={() => {
              setShowCustom(false);
              setCents(v);
            }}
          >
            {formatMoney0(v)}
            <span>{presetLabel(v, i)}</span>
          </button>
        ))}
        {showCustom ? (
          <div className="pwyw__custom pwyw__custom--inline" data-custom="">
            <label className="sr" htmlFor="pwywIn">
              Other amount
            </label>
            <span className="pwyw__cur">$</span>
            <input
              ref={customRef}
              className="input"
              id="pwywIn"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={customDraft}
              aria-label="Other amount in dollars"
              onChange={(e) => onCustomChange(e.target.value)}
              onBlur={onCustomBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onCustomBlur();
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            className="pwyw__amt pwyw__amt--other"
            data-other
            aria-pressed={!isPreset}
            aria-expanded={false}
            onClick={openCustom}
          >
            <b>$</b> Other
          </button>
        )}
      </div>

      {gets.length ? (
        <div className="pwyw__gets">
          {gets.map((g) => (
            <span key={g}>
              <IconCheck />
              {g}
            </span>
          ))}
        </div>
      ) : null}

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
          ) : (
            product.ctaLabel || (compact ? "Get it now" : "Add to cart")
          )}
        </button>
        {compact ? (
          <a className="tlink pwyw__more" href={`/product/${product.slug}`}>
            About {product.title} <IconArrow />
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
