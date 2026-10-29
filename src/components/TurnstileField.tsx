"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: (errorCode?: string) => void;
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

function turnstileErrorHint(code?: string) {
  const normalized = String(code || "").replace(/\*$/, "");
  if (normalized.startsWith("110200") || code === "110200") {
    return "This domain is not allowed on the Turnstile widget. In Cloudflare → Turnstile → widget Settings → Hostname Management, add garthheckman.com (and localhost for local testing).";
  }
  if (normalized.startsWith("110100") || normalized.startsWith("110110") || normalized.startsWith("400020")) {
    return "Invalid Turnstile site key. Check NEXT_PUBLIC_TURNSTILE_SITE_KEY.";
  }
  if (normalized.startsWith("400021")) {
    return "Turnstile site key does not match this domain.";
  }
  if (normalized.startsWith("400070")) {
    return "This Turnstile site key is disabled in the Cloudflare dashboard.";
  }
  return "Security check failed to load. Refresh the page, or check Cloudflare Turnstile hostnames / site key.";
}

/** Explicit Turnstile widget — site key comes from NEXT_PUBLIC_TURNSTILE_SITE_KEY. */
export function TurnstileField({ action = "contact", theme = "auto", onToken }: Props) {
  const siteKey = String(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const reactId = useId();
  const [errorHint, setErrorHint] = useState<string | null>(null);

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
      callback: (token) => {
        setErrorHint(null);
        onTokenRef.current(token);
      },
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": (errorCode) => {
        onTokenRef.current(null);
        setErrorHint(turnstileErrorHint(errorCode));
        if (process.env.NODE_ENV !== "production") {
          console.warn("[turnstile]", errorCode || "unknown error", {
            host: window.location.hostname,
            siteKeyPrefix: siteKey.slice(0, 12),
          });
        }
      },
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
      {errorHint ? (
        <p className="hint mt2" style={{ color: "var(--bad-dp)" }}>
          {errorHint}
        </p>
      ) : null}
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
