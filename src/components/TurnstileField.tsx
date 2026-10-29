"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  action?: string;
  theme?: "light" | "dark" | "auto";
  onToken: (token: string | null) => void;
};

/** Explicit Turnstile widget — site key comes from NEXT_PUBLIC_TURNSTILE_SITE_KEY. */
export function TurnstileField({ action = "contact", theme = "auto", onToken }: Props) {
  const siteKey = String(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const reactId = useId();

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const mount = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme,
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": () => onTokenRef.current(null),
    });
  }, [action, siteKey, theme]);

  useEffect(() => {
    mount();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [mount]);

  if (!siteKey) return null;

  return (
    <div className="field mt4">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={mount}
      />
      <div ref={containerRef} id={`cf-turnstile-${reactId.replace(/:/g, "")}`} />
    </div>
  );
}

export function resetTurnstile() {
  if (typeof window === "undefined" || !window.turnstile) return;
  try {
    window.turnstile.reset();
  } catch {
    /* ignore */
  }
}
