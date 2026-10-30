"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatMoney, formatMoneyOrFree } from "@/lib/money";
import { IconDownload, IconEye, IconEyeOff, IconShield, IconTruck } from "@/components/icons";
import { PayPalCheckoutButtons } from "@/components/PayPalCheckoutButtons";

type CreateResponse = { mode?: "free" | "paypal" | "cash_on_delivery"; orderToken?: string; paypalOrderId?: string; error?: string };
type PaymentChoice = "paypal" | "cash_on_delivery";

/** Same rule the store backend applies, so a bad address is caught before the order is sent. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CheckoutPageInner() {
  const cart = useCart();
  const router = useRouter();
  const { lines, subtotal, discount, shipping, tax, total, physical, digital, priced, promo, catalogReady } = cart;
  const loading = !catalogReady;
  const free = priced && total === 0;
  const printify = lines.some((line) => line.fulfillment === "printify");
  const [err, setErr] = useState("");
  const [placing, setPlacing] = useState(false);
  const [choice, setChoice] = useState<PaymentChoice>("paypal");
  const codOffered = cart.codAvailable && physical;
  const payByCod = !free && codOffered && (choice === "cash_on_delivery" || !cart.paypalAvailable);
  const [activeStep, setActiveStep] = useState(0);
  const [accountEmail, setAccountEmail] = useState("");
  /** idle = no valid email yet; checking = DB lookup; new = show password; exists = hide password */
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "new" | "exists">("idle");
  const emailCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailCheckSeq = useRef(0);
  const orderTokenRef = useRef("");
  const year = new Date().getFullYear();
  const isGuest = !accountEmail;
  const showPasswordFields = isGuest && emailStatus === "new";
  // PayPal createOrder keeps a stale callback — always read the latest email/password gate.
  const emailGateRef = useRef({ isGuest, emailStatus, showPasswordFields });
  emailGateRef.current = { isGuest, emailStatus, showPasswordFields };
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const steps = useMemo(() => {
    const s = ["Contact"];
    if (physical) s.push("Shipping");
    if (!free) s.push("Payment");
    return s;
  }, [physical, free]);

  useEffect(() => {
    const sectionIds = ["contact", ...(physical ? ["shipping"] : []), ...(!free ? ["payment"] : [])];

    function updateActiveStep() {
      const nextStep = sectionIds.reduce((current, id, index) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= 104 ? index : current;
      }, 0);
      setActiveStep((current) => (current === nextStep ? current : nextStep));
    }

    updateActiveStep();
    window.addEventListener("scroll", updateActiveStep, { passive: true });
    window.addEventListener("resize", updateActiveStep);
    return () => {
      window.removeEventListener("scroll", updateActiveStep);
      window.removeEventListener("resize", updateActiveStep);
    };
  }, [physical, free]);

  useEffect(() => {
    let active = true;
    fetch("/api/customer/account")
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then((result) => {
        const customer = result.ok ? result.body?.data?.customer : null;
        if (!active || !customer) return;
        const fields: Array<[string, string]> = [
          ["fname", customer.first_name || ""],
          ["lname", customer.last_name || ""],
          ["email", customer.email || ""],
        ];
        for (const [id, value] of fields) {
          const input = document.getElementById(id) as HTMLInputElement | null;
          if (input && !input.value) input.value = value;
        }
        setAccountEmail(customer.email || "");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const checkEmailAccount = useCallback((rawEmail: string) => {
    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    const email = rawEmail.trim().toLowerCase();
    if (!isGuest || !EMAIL_PATTERN.test(email)) {
      setEmailStatus("idle");
      return;
    }
    setEmailStatus("checking");
    const seq = ++emailCheckSeq.current;
    emailCheckTimer.current = setTimeout(() => {
      fetch(`/api/customer/account-status?email=${encodeURIComponent(email)}`)
        .then(async (response) => ({
          ok: response.ok,
          body: await response.json().catch(() => ({})) as { exists?: boolean; hasPassword?: boolean },
        }))
        .then((result) => {
          if (seq !== emailCheckSeq.current) return;
          // Email already in this store / Auth → hide password. Brand-new email → create password.
          setEmailStatus(result.ok && result.body?.exists === true ? "exists" : "new");
          document.getElementById("email")?.closest(".field")?.classList.remove("bad");
          setErr("");
        })
        .catch(() => {
          if (seq !== emailCheckSeq.current) return;
          setEmailStatus("new");
        });
    }, 350);
  }, [isGuest]);

  const validateForm = useCallback((form: HTMLFormElement): boolean => {
    const { isGuest: guest, emailStatus: status, showPasswordFields: needPassword } = emailGateRef.current;
    const badEmail = (f: Element) => f instanceof HTMLInputElement && f.type === "email" && !EMAIL_PATTERN.test(f.value.trim());
    const miss = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[required]")).filter(
      (f) => (f.type === "checkbox" ? !(f as HTMLInputElement).checked : !f.value.trim() || badEmail(f)),
    );
    form.querySelectorAll(".field").forEach((f) => f.classList.remove("bad"));
    if (guest && status === "checking") {
      setErr("Checking that email — one moment.");
      return false;
    }
    if (guest && status === "idle") {
      form.querySelector("#email")?.closest(".field")?.classList.add("bad");
      setErr("Enter a valid email address.");
      (form.elements.namedItem("email") as HTMLInputElement | null)?.focus();
      return false;
    }
    if (needPassword) {
      const password = String((form.elements.namedItem("password") as HTMLInputElement | null)?.value || "");
      const confirm = String((form.elements.namedItem("passwordConfirm") as HTMLInputElement | null)?.value || "");
      if (password.length < 8) {
        form.querySelector("#password")?.closest(".field")?.classList.add("bad");
        setErr("Create a password with at least 8 characters so you can sign in later.");
        (form.elements.namedItem("password") as HTMLInputElement | null)?.focus();
        return false;
      }
      if (password !== confirm) {
        form.querySelector("#passwordConfirm")?.closest(".field")?.classList.add("bad");
        setErr("Passwords do not match.");
        (form.elements.namedItem("passwordConfirm") as HTMLInputElement | null)?.focus();
        return false;
      }
    }
    if (!miss.length) {
      setErr("");
      return true;
    }
    miss.forEach((f) => f.closest(".field")?.classList.add("bad"));
    const onlyEmail = miss.length === 1 && badEmail(miss[0]) && miss[0].value.trim();
    setErr(onlyEmail ? "Enter a valid email address." : `${miss.length} field${miss.length > 1 ? "s need" : " needs"} attention.`);
    miss[0].focus();
    return false;
  }, []);

  const checkoutPayload = useCallback(
    (form: HTMLFormElement, paymentMethod: PaymentChoice = "paypal") => {
      const fd = new FormData(form);
      const password = showPasswordFields ? String(fd.get("password") || "") : "";
      return {
        paymentMethod,
        items: cart.items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty, pwywCents: i.pwywCents })),
        couponCode: promo?.code ?? null,
        contact: { fname: String(fd.get("fname") || ""), lname: String(fd.get("lname") || ""), email: String(fd.get("email") || "") },
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
        ...(password ? { password } : {}),
      };
    },
    [cart.items, promo?.code, physical, showPasswordFields],
  );

  const finish = useCallback(
    (orderToken: string) => {
      cart.clear();
      cart.clearPromo();
      router.push(`/order-confirmation?token=${encodeURIComponent(orderToken)}`);
    },
    [cart, router],
  );

  const createPayPalOrder = useCallback(async () => {
    const form = document.getElementById("form") as HTMLFormElement | null;
    if (!form) throw new Error("Please complete the required fields.");
    if (!validateForm(form)) {
      // validateForm already set a specific message — don't overwrite it.
      throw new Error("VALIDATION_FAILED");
    }
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload(form)),
      });
      const data = (await res.json().catch(() => ({}))) as CreateResponse;
      if (!res.ok || !data.orderToken) throw new Error(data.error || "Could not start checkout.");
      orderTokenRef.current = data.orderToken;
      if (data.mode === "free") {
        finish(data.orderToken);
        throw new Error("Nothing to pay for this order.");
      }
      if (!data.paypalOrderId) throw new Error("Could not start checkout.");
      return data.paypalOrderId;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start checkout.";
      if (message !== "VALIDATION_FAILED") setErr(message);
      setPlacing(false);
      throw error;
    }
  }, [checkoutPayload, finish, validateForm]);

  const approvePayPalOrder = useCallback(
    async (paypalOrderId: string) => {
      try {
        const res = await fetch("/api/checkout/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderToken: orderTokenRef.current, paypalOrderId }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; orderToken?: string; error?: string };
        if (!res.ok || !data.ok || !data.orderToken) throw new Error(data.error || "Could not confirm your payment.");
        finish(data.orderToken);
      } catch (error) {
        setErr(error instanceof Error ? error.message : "Could not confirm your payment.");
        setPlacing(false);
      }
    },
    [finish],
  );

  const handlePayPalCancel = useCallback(() => {
    setPlacing(false);
    setErr("PayPal checkout was cancelled. No charge was made. You can try again.");
  }, []);

  const handlePayPalError = useCallback((message: string) => {
    setPlacing(false);
    setErr(message);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!free && !payByCod) return;
    const form = e.currentTarget;
    if (!validateForm(form)) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload(form, payByCod ? "cash_on_delivery" : "paypal")),
      });
      const data = (await res.json().catch(() => ({}))) as CreateResponse;
      if (!res.ok || !data.orderToken) {
        setErr(data.error || "Could not place your order.");
        setPlacing(false);
        return;
      }
      finish(data.orderToken);
    } catch {
      setErr("Could not place your order.");
      setPlacing(false);
    }
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
              {loading ? (
                <div className="empty cart-loading" aria-busy="true" aria-live="polite">
                  <span className="cart-loading__spin" aria-hidden="true" />
                  <p className="body mt4">Loading checkout…</p>
                </div>
              ) : !lines.length ? (
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
                            className={`step${i === activeStep ? " on" : i < activeStep ? " done" : " step--todo"}`}
                            data-step={i}
                            {...(i === activeStep ? { "aria-current": "step" as const } : {})}
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
                      <fieldset id="contact">
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
                          <input
                            className="input"
                            id="email"
                            name="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            required
                            readOnly={Boolean(accountEmail)}
                            onBlur={(event) => checkEmailAccount(event.currentTarget.value)}
                            onChange={(event) => checkEmailAccount(event.currentTarget.value)}
                          />
                          {accountEmail ? (
                            <p className="hint">Signed in as {accountEmail}. Your contact details were filled in for you.</p>
                          ) : emailStatus === "exists" ? (
                            <p className="hint">This email address is already registered with this store.</p>
                          ) : (
                            <p className="hint">
                              {digital ? "Your download link and receipt go here." : "Order confirmation and tracking go here."}
                            </p>
                          )}
                        </div>
                        {showPasswordFields ? (
                          <>
                            <div className="field">
                              <label className="label" htmlFor="password">
                                Create a password<span className="req">*</span>
                              </label>
                              <div className="input-wrap">
                                <input
                                  className="input"
                                  id="password"
                                  name="password"
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="new-password"
                                  minLength={8}
                                  required
                                />
                                <button
                                  className="input-wrap__toggle"
                                  type="button"
                                  aria-label={showPassword ? "Hide password" : "Show password"}
                                  onClick={() => setShowPassword((value) => !value)}
                                >
                                  {showPassword ? <IconEyeOff /> : <IconEye />}
                                </button>
                              </div>
                              <p className="hint">Use this email and password later to sign in and view orders.</p>
                            </div>
                            <div className="field">
                              <label className="label" htmlFor="passwordConfirm">
                                Confirm password<span className="req">*</span>
                              </label>
                              <div className="input-wrap">
                                <input
                                  className="input"
                                  id="passwordConfirm"
                                  name="passwordConfirm"
                                  type={showPasswordConfirm ? "text" : "password"}
                                  autoComplete="new-password"
                                  minLength={8}
                                  required
                                />
                                <button
                                  className="input-wrap__toggle"
                                  type="button"
                                  aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
                                  onClick={() => setShowPasswordConfirm((value) => !value)}
                                >
                                  {showPasswordConfirm ? <IconEyeOff /> : <IconEye />}
                                </button>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </fieldset>

                      {physical ? (
                        <fieldset id="shipping">
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
                                State / Province<span className="req">*</span>
                              </label>
                              <input className="input" id="state" name="state" autoComplete="address-level1" required />
                            </div>
                          </div>
                          <div className="field-row">
                            <div className="field">
                              <label className="label" htmlFor="zip">
                                ZIP / Postal code<span className="req">*</span>
                              </label>
                              <input className="input" id="zip" name="zip" autoComplete="postal-code" required />
                            </div>
                            <div className="field">
                              <label className="label" htmlFor="country">
                                Country<span className="req">*</span>
                              </label>
                              <input
                                className="input"
                                id="country"
                                name="country"
                                defaultValue="United States"
                                readOnly
                                autoComplete="country-name"
                              />
                            </div>
                          </div>
                          {printify ? (
                            <div className="notice notice--info mt4">
                              <IconTruck />
                              <span>
                                <strong>Printed on demand.</strong> Merchandise is produced and shipped by Printify once the
                                order is paid. Allow 5–9 business days.
                              </span>
                            </div>
                          ) : null}
                        </fieldset>
                      ) : null}

                      {free ? null : (
                        <fieldset id="payment">
                          <legend className="leg">
                            <b>{++stepNo}</b> Payment
                          </legend>
                          {codOffered && cart.paypalAvailable ? (
                            <div role="radiogroup" aria-label="Payment method">
                              <label className="radio">
                                <input
                                  type="radio"
                                  name="payment"
                                  checked={choice === "paypal"}
                                  onChange={() => setChoice("paypal")}
                                />
                                <span>
                                  <b>PayPal or Venmo</b>
                                  <i>Pay now in a secure PayPal window.</i>
                                </span>
                              </label>
                              <label className="radio">
                                <input
                                  type="radio"
                                  name="payment"
                                  checked={choice === "cash_on_delivery"}
                                  onChange={() => setChoice("cash_on_delivery")}
                                />
                                <span>
                                  <b>Cash on delivery</b>
                                  <i>Nothing is charged now. You pay when the order arrives.</i>
                                </span>
                              </label>
                            </div>
                          ) : null}
                          {payByCod ? (
                            <div className="notice notice--info mt4">
                              <IconShield />
                              <span>No payment is taken online. Your order is confirmed now and paid for on delivery.</span>
                            </div>
                          ) : (
                            <>
                              <p className="hint">Pay securely with PayPal or Venmo below.</p>
                              <div className="notice notice--info mt4">
                                <IconShield />
                                <span>PayPal opens in a secure window to authorise the payment, then you come straight back here.</span>
                              </div>
                            </>
                          )}
                        </fieldset>
                      )}

                      <div className="place">
                        {free ? (
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
                              I agree to the terms of sale and the <a href="/privacy">privacy policy</a>.
                              <span className="req">*</span>
                            </span>
                          </label>
                        </div>
                        {err || cart.quoteError ? (
                          <div id="err" className="notice notice--bad mt4" role="alert">
                            <span>
                              <strong>{err || cart.quoteError}</strong>
                            </span>
                          </div>
                        ) : null}
                        {!priced ? (
                          <p className="hint mt5">Working out your total…</p>
                        ) : free ? (
                          <button className="btn btn--lg btn--block mt5" type="submit" id="place" disabled={placing}>
                            {placing ? "Preparing your download…" : "Send me the download"}
                          </button>
                        ) : payByCod ? (
                          <button className="btn btn--lg btn--block mt5" type="submit" id="place" disabled={placing}>
                            {placing ? "Placing your order…" : `Place order · ${formatMoney(total)}`}
                          </button>
                        ) : cart.paypalAvailable ? (
                          <PayPalCheckoutButtons
                            onCreateOrder={createPayPalOrder}
                            onApprove={approvePayPalOrder}
                            onError={handlePayPalError}
                            onCancel={handlePayPalCancel}
                            disabled={placing}
                          />
                        ) : (
                          <div className="notice notice--bad mt4">
                            <span>Online payment isn&apos;t available right now. Please try again later.</span>
                          </div>
                        )}
                        {free ? (
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
                            {i.optionsLabel ? ` (${i.optionsLabel})` : ""}
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
                      {discount > 0 ? (
                        <div className="sline sline--save">
                          <span>{promo ? `${promo.code} · ${promo.label}` : "Discount"}</span>
                          <span className="tnum">−{formatMoney(discount)}</span>
                        </div>
                      ) : null}
                      {physical ? (
                        <div className="sline">
                          <span className="dim">Shipping</span>
                          <span className="tnum">{!priced ? "…" : shipping ? formatMoney(shipping) : "Free"}</span>
                        </div>
                      ) : null}
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
                      {digital && !free ? (
                        <div className="notice notice--ok mt4">
                          <IconDownload />
                          <span>Downloads unlock the moment payment clears.</span>
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
            <a href="/contact">Need help?</a>
            <a href="/privacy">Privacy</a>
          </span>
        </div>
      </footer>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main id="main"><section className="sec"><div className="wrap-n"><h1 className="d2">Checkout</h1></div></section></main>}>
      <CheckoutPageInner />
    </Suspense>
  );
}
