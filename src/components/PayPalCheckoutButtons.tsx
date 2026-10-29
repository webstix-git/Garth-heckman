"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: {
      FUNDING?: { PAYPAL?: unknown; VENMO?: unknown };
      Buttons: (options: Record<string, unknown>) => {
        isEligible: () => boolean;
        render: (target: HTMLElement) => Promise<void>;
        close?: () => void;
      };
    };
  }
}

type Props = {
  onCreateOrder: (method: "paypal" | "venmo") => Promise<string>;
  onApprove: (paypalOrderId: string) => Promise<void>;
  onError: (message: string) => void;
  onCancel: () => void;
  disabled?: boolean;
};

function loadScript(clientId: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
  if (existing) {
    if (window.paypal) return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load PayPal.")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&enable-funding=venmo`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load PayPal."));
    document.head.appendChild(script);
  });
}

export function PayPalCheckoutButtons({ onCreateOrder, onApprove, onError, onCancel, disabled = false }: Props) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const venmoRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    let paypalButtons: { close?: () => void } | undefined;
    let venmoButtons: { close?: () => void } | undefined;

    async function setup() {
      try {
        const configRes = await fetch("/api/paypal/config", { cache: "no-store" });
        const config = (await configRes.json()) as { configured?: boolean; clientId?: string; paypalEnabled?: boolean; venmoEnabled?: boolean };
        if (!configRes.ok || !config.configured || !config.clientId) throw new Error("PayPal is unavailable.");
        await loadScript(config.clientId);
        if (!active || !window.paypal || !paypalRef.current) return;

        const render = (method: "paypal" | "venmo", target: HTMLDivElement) => {
          const fundingSource = method === "venmo" ? window.paypal?.FUNDING?.VENMO : window.paypal?.FUNDING?.PAYPAL;
          let createOrderFailed = false;
          const buttons = window.paypal?.Buttons({
            fundingSource,
            style: { layout: "horizontal", height: 48, label: "paypal", shape: "rect", tagline: false },
            createOrder: () =>
              onCreateOrder(method).catch((error) => {
                // PayPal surfaces rejected createOrder promises through onError. Preserve
                // our validation/server message so the shopper knows what to fix.
                createOrderFailed = true;
                const message = error instanceof Error ? error.message : "Could not start checkout.";
                if (message !== "VALIDATION_FAILED") onError(message);
                throw error;
              }),
            onApprove: (data: { orderID?: string }) => {
              if (!data.orderID) throw new Error("PayPal did not return an order ID.");
              return onApprove(data.orderID);
            },
            onError: () => {
              if (!createOrderFailed) onError("PayPal could not start the payment. Please try again.");
            },
            onCancel: () => onCancel(),
          });
          if (buttons?.isEligible()) {
            void buttons.render(target);
            return buttons;
          }
          return undefined;
        };

        if (config.paypalEnabled !== false) paypalButtons = render("paypal", paypalRef.current);
        if (config.venmoEnabled !== false && venmoRef.current) venmoButtons = render("venmo", venmoRef.current);
        if (active) setStatus("ready");
      } catch {
        if (active) setStatus("unavailable");
      }
    }

    void setup();
    return () => {
      active = false;
      paypalButtons?.close?.();
      venmoButtons?.close?.();
    };
  }, [onApprove, onCreateOrder, onError, onCancel]);

  if (status === "unavailable") return null;

  return (
    <div className={`paypal-buttons${disabled ? " is-disabled" : ""}`} aria-busy={status === "loading"}>
      {status === "loading" ? <p className="hint">Loading secure payment options…</p> : null}
      <div ref={paypalRef} aria-label="Pay with PayPal" />
      <div ref={venmoRef} aria-label="Pay with Venmo" />
    </div>
  );
}
