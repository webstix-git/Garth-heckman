"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatMoney, formatMoneyOrFree } from "@/lib/money";
import { writePlacedOrder, type StoredOrder } from "@/lib/cart";
import { IconDownload, IconShield, IconTruck } from "@/components/icons";
import { isSampleCheckoutClient } from "@/lib/sample-mode";

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const { lines, subtotal, shipping, tax, total, physical, digital } = cart;
  const sample = isSampleCheckoutClient();
  const free = total === 0;
  const skipPay = free || sample;
  const [err, setErr] = useState("");
  const [placing, setPlacing] = useState(false);
  const year = new Date().getFullYear();

  const steps = useMemo(() => {
    const s = ["Contact"];
    if (physical) s.push("Shipping");
    if (!skipPay) s.push("Payment");
    return s;
  }, [physical, skipPay]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const miss = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[required]")).filter(
      (f) => (f.type === "checkbox" ? !(f as HTMLInputElement).checked : !f.value.trim()),
    );
    form.querySelectorAll(".field").forEach((f) => f.classList.remove("bad"));
    if (miss.length) {
      miss.forEach((f) => f.closest(".field")?.classList.add("bad"));
      setErr(`${miss.length} field${miss.length > 1 ? "s need" : " needs"} attention.`);
      miss[0].focus();
      return;
    }
    setErr("");
    const fd = new FormData(form);

    if (sample) {
      setPlacing(true);
      try {
        const res = await fetch("/api/orders/sample", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart.items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              qty: i.qty,
              pwywCents: i.pwywCents,
            })),
            promoCode: cart.promo?.code ?? null,
            contact: {
              fname: String(fd.get("fname") || ""),
              lname: String(fd.get("lname") || ""),
              email: String(fd.get("email") || ""),
            },
            address: physical
              ? {
                  line1: String(fd.get("a1") || ""),
                  line2: String(fd.get("a2") || ""),
                  city: String(fd.get("city") || ""),
                  state: String(fd.get("state") || ""),
                  zip: String(fd.get("zip") || ""),
                  country: String(fd.get("country") || "United States"),
                }
              : null,
          }),
        });
        const data = (await res.json()) as { order?: StoredOrder; error?: string };
        if (!res.ok || !data.order) {
          setErr(data.error || "Could not place the sample order.");
          setPlacing(false);
          return;
        }
        writePlacedOrder(data.order);
        cart.clear();
        router.push("/order-confirmation");
      } catch {
        setErr("Could not place the sample order.");
        setPlacing(false);
      }
      return;
    }

    const order: StoredOrder = {
      number: "GH-" + String(Math.floor(100000 + Math.random() * 899999)),
      placedAt: new Date().toISOString(),
      email: String(fd.get("email") || ""),
      name: `${fd.get("fname") || ""} ${fd.get("lname") || ""}`.trim(),
      shippingRequired: physical,
      address: physical
        ? {
            line1: String(fd.get("a1") || ""),
            line2: String(fd.get("a2") || ""),
            city: String(fd.get("city") || ""),
            state: String(fd.get("state") || ""),
            zip: String(fd.get("zip") || ""),
            country: String(fd.get("country") || "United States"),
          }
        : null,
      paymentMethod: free ? "none" : String(fd.get("pay") || "paypal"),
      items: lines.map((i) => ({
        productId: i.productId,
        slug: i.slug,
        title: i.title,
        sku: i.sku,
        qty: i.qty,
        optionsLabel: i.optionsLabel,
        shipping: i.shipping,
        type: i.type,
        unitCents: i.unitCents,
      })),
      totals: { subtotal, shipping, tax, total },
      status: free ? "complete" : "paid",
    };
    writePlacedOrder(order);
    setPlacing(true);
    setTimeout(() => {
      cart.clear();
      router.push("/order-confirmation");
    }, 900);
  }

  let stepNo = 1;

  return (
    <>
      <div className="co-top">
        <div className="wrap-n between">
          <a className="mark" href="/" aria-label="Garth Heckman home">
            <img src="/assets/img/gh-logo.png" width={732} height={732} alt="" />
            <span>
              <b>Garth Heckman</b>
            </span>
          </a>
          <div className="row" style={{ gap: 18 }}>
            <span className="meta meta--dim">Secure checkout</span>
            <a className="tlink" href="/cart">
              Back to cart
            </a>
          </div>
        </div>
      </div>

      <main id="main">
        <section className="sec">
          <div className="wrap-n">
            <h1 className="d2 mb5">Checkout</h1>
            <div id="body">
              {!lines.length ? (
                <div className="empty">
                  <h2 className="d3">Your cart is empty.</h2>
                  <p className="body mt3">Nothing to check out yet.</p>
                  <p className="mt5">
                    <a className="btn" href="/store">
                      Browse the store
                    </a>
                  </p>
                </div>
              ) : (
                <>
                  {steps.length >= 2 ? (
                    <nav className="steps-wrap" aria-label="Checkout progress">
                      <ol className="steps">
                        {steps.map((s, i) => (
                          <li
                            key={s}
                            className={`step${i === 0 ? " on" : " step--todo"}`}
                            data-step={i}
                            {...(i === 0 ? { "aria-current": "step" as const } : {})}
                          >
                            <b className="step__n" aria-hidden="true">
                              {i + 1}
                            </b>
                            <span className="step__label">{s}</span>
                            <span className="sr step__state"></span>
                          </li>
                        ))}
                      </ol>
                    </nav>
                  ) : null}

                  <div className="comm">
                    <form id="form" noValidate data-native="true" onSubmit={onSubmit}>
                      <fieldset>
                        <legend className="leg">
                          <b>1</b> Contact
                        </legend>
                        <div className="field-row">
                          <div className="field">
                            <label className="label" htmlFor="fname">
                              First name<span className="req">*</span>
                            </label>
                            <input className="input" id="fname" name="fname" autoComplete="given-name" required />
                          </div>
                          <div className="field">
                            <label className="label" htmlFor="lname">
                              Last name<span className="req">*</span>
                            </label>
                            <input className="input" id="lname" name="lname" autoComplete="family-name" required />
                          </div>
                        </div>
                        <div className="field">
                          <label className="label" htmlFor="email">
                            Email<span className="req">*</span>
                          </label>
                          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
                          <p className="hint">
                            {digital ? "Your download links go here." : "Order confirmation and tracking go here."}
                          </p>
                        </div>
                        <div className="field">
                          <label className="check">
                            <input type="checkbox" defaultChecked />
                            <span>Send me Garth&apos;s occasional email: new writing, new resources, nothing else.</span>
                          </label>
                        </div>
                        <p className="hint">No account needed. Guest checkout is the default.</p>
                      </fieldset>

                      {physical ? (
                        <fieldset>
                          <legend className="leg">
                            <b>{++stepNo}</b> Shipping address
                          </legend>
                          <div className="field">
                            <label className="label" htmlFor="a1">
                              Address<span className="req">*</span>
                            </label>
                            <input className="input" id="a1" name="a1" autoComplete="address-line1" required />
                          </div>
                          <div className="field">
                            <label className="label" htmlFor="a2">
                              Apartment, suite{" "}
                              <span className="dim" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
                                (optional)
                              </span>
                            </label>
                            <input className="input" id="a2" name="a2" autoComplete="address-line2" />
                          </div>
                          <div className="field-row">
                            <div className="field">
                              <label className="label" htmlFor="city">
                                City<span className="req">*</span>
                              </label>
                              <input className="input" id="city" name="city" autoComplete="address-level2" required />
                            </div>
                            <div className="field">
                              <label className="label" htmlFor="state">
                                State<span className="req">*</span>
                              </label>
                              <select className="select" id="state" name="state" required>
                                <option value="">Choose…</option>
                                <option>Minnesota</option>
                                <option>Wisconsin</option>
                                <option>Illinois</option>
                                <option>Iowa</option>
                                <option>Other</option>
                              </select>
                            </div>
                          </div>
                          <div className="field-row">
                            <div className="field">
                              <label className="label" htmlFor="zip">
                                ZIP<span className="req">*</span>
                              </label>
                              <input className="input" id="zip" name="zip" inputMode="numeric" autoComplete="postal-code" required />
                            </div>
                            <div className="field">
                              <label className="label" htmlFor="country">
                                Country<span className="req">*</span>
                              </label>
                              <select className="select" id="country" name="country">
                                <option>United States</option>
                                <option>Canada</option>
                              </select>
                            </div>
                          </div>
                          <div className="notice notice--info mt4">
                            <IconTruck />
                            <span>
                              <strong>Printed on demand.</strong> Merchandise is produced and shipped by Printify once the
                              order is placed. Allow 5–9 business days.
                            </span>
                          </div>
                        </fieldset>
                      ) : null}

                      {skipPay ? null : (
                        <fieldset>
                          <legend className="leg">
                            <b>{++stepNo}</b> Payment
                          </legend>
                          <label className="radio">
                            <input type="radio" name="pay" value="paypal" defaultChecked />
                            <span>
                              <b>PayPal</b>
                              <i>Pay with a PayPal balance, or with any credit or debit card. Card details never touch this site.</i>
                            </span>
                          </label>
                          <label className="radio">
                            <input type="radio" name="pay" value="venmo" />
                            <span>
                              <b>Venmo</b>
                              <i>Pay from your Venmo balance, handled through PayPal&apos;s gateway.</i>
                            </span>
                          </label>
                          <div className="notice notice--info mt4">
                            <IconShield />
                            <span>You will be handed to PayPal to authorise the payment, then brought straight back here.</span>
                          </div>
                        </fieldset>
                      )}

                      <div className="place">
                        {sample ? (
                          <div className="notice notice--ok mb4">
                            <IconShield />
                            <span>
                              <strong>Sample order.</strong> PayPal is skipped. Printify gets a draft only — nothing
                              is printed or charged until you send it to production in Printify.
                            </span>
                          </div>
                        ) : free ? (
                          <div className="notice notice--ok mb4">
                            <IconShield />
                            <span>
                              <strong>Nothing to pay.</strong> There is no card step and no PayPal handoff. Confirm below
                              and the download link is emailed to you straight away.
                            </span>
                          </div>
                        ) : null}
                        <div className="field">
                          <label className="check">
                            <input type="checkbox" id="terms" required />
                            <span>
                              I agree to the terms of sale and the{" "}
                              <a href="/privacy">privacy policy</a>.
                              <span className="req">*</span>
                            </span>
                          </label>
                        </div>
                        {err ? (
                          <div id="err" className="notice notice--bad mt4">
                            <span>
                              <strong>{err}</strong> Check the highlighted fields above.
                            </span>
                          </div>
                        ) : null}
                        <button className="btn btn--lg btn--block mt5" type="submit" id="place" disabled={placing}>
                          {placing
                            ? sample
                              ? "Submitting sample order…"
                              : free
                                ? "Preparing your download…"
                                : "Contacting PayPal…"
                            : sample
                              ? "Place sample order"
                              : free
                                ? "Send me the download"
                                : `Pay ${formatMoney(total)} with PayPal`}
                        </button>
                        {sample ? (
                          <p className="hint" style={{ textAlign: "center" }}>
                            No payment. The Printify order stays a draft.
                          </p>
                        ) : free ? (
                          <p className="hint" style={{ textAlign: "center" }}>
                            No payment method needed. Your email is only used to send the file.
                          </p>
                        ) : null}
                      </div>
                    </form>

                    <aside className="summary">
                      <h2 className="d4 mb4">Order summary</h2>
                      {lines.map((i) => (
                        <div className="sline" key={i.key}>
                          <span className="dim">
                            {i.title}
                            {i.qty > 1 ? ` × ${i.qty}` : ""}
                          </span>
                          <span className="tnum">{formatMoney(i.unitCents * i.qty)}</span>
                        </div>
                      ))}
                      <div className="rule mt4 mb4"></div>
                      <div className="sline">
                        <span className="dim">Subtotal</span>
                        <span className="tnum">{formatMoney(subtotal)}</span>
                      </div>
                      <div className="sline">
                        <span className="dim">Shipping</span>
                        <span className="tnum">{physical ? (shipping === 0 ? "Free" : formatMoney(shipping)) : "None"}</span>
                      </div>
                      <div className="sline">
                        <span className="dim">Estimated tax</span>
                        <span className="tnum">{formatMoney(tax)}</span>
                      </div>
                      <div className="stotal">
                        <span className="label" style={{ margin: 0 }}>
                          Total
                        </span>
                        <b className="tnum">{formatMoneyOrFree(total)}</b>
                      </div>
                      {digital ? (
                        <div className="notice notice--ok mt4">
                          <IconDownload />
                          <span>
                            {free
                              ? "Your download link is emailed the moment you confirm."
                              : "Downloads unlock the moment payment clears."}
                          </span>
                        </div>
                      ) : null}
                      <a className="tlink mt4" href="/cart" style={{ display: "inline-flex" }}>
                        Edit your cart
                      </a>
                    </aside>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="co-top" style={{ borderTop: "1px solid var(--line)", borderBottom: 0, marginTop: 40 }}>
        <div className="wrap-n between meta meta--dim">
          <span>© {year} Garth Heckman</span>
          <span className="row" style={{ gap: 20 }}>
            <a href="mailto:garthwheckman@gmail.com">Need help?</a>
            <a href="#">Privacy</a>
          </span>
        </div>
      </footer>
    </>
  );
}
