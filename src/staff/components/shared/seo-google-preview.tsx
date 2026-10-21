"use client";

import { useMemo } from "react";

import { APP_LOGO_SRC, APP_NAME } from "@/lib/constants";
import { SEO_DESC_MAX, SEO_TITLE_MAX, truncateSeo } from "@/lib/product-seo";
import { cn } from "@/lib/utils";

function resolvePreviewOrigin(): { host: string; protocol: string } {
  const fallback = { host: "garthheckman.com", protocol: "https:" };
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
        return fallback;
      }
      return { host: url.host, protocol: url.protocol };
    } catch {
      return fallback;
    }
  }
  if (typeof window !== "undefined" && window.location.host) {
    const host = window.location.host;
    if (host.startsWith("127.0.0.1") || host.startsWith("localhost")) {
      return fallback;
    }
    return { host, protocol: window.location.protocol };
  }
  return fallback;
}

export interface SeoGooglePreviewProps {
  title: string;
  description: string;
  /** Path only, e.g. `/product/my-book` */
  path: string;
  siteName?: string;
  faviconSrc?: string;
  className?: string;
}

export function SeoGooglePreview({
  title,
  description,
  path,
  siteName = APP_NAME,
  faviconSrc = APP_LOGO_SRC,
  className,
}: SeoGooglePreviewProps) {
  const { host, protocol } = useMemo(() => resolvePreviewOrigin(), []);
  const segments = path.split("/").filter(Boolean);
  const urlDisplay = `${protocol}//${host}${segments.length ? ` › ${segments.join(" › ")}` : ""}`;

  const displayTitle = truncateSeo(title.trim() || "Page title", SEO_TITLE_MAX);

  const rawDescription =
    description.trim() ||
    "Add a meta description to see how your page may appear in Google search results.";
  const clippedDescription = truncateSeo(rawDescription, SEO_DESC_MAX - 12);
  const showReadMore =
    rawDescription.length > clippedDescription.replace(/…$/, "").length ||
    rawDescription.length > SEO_DESC_MAX - 20;

  return (
    <div
      className={cn(
        "rounded-lg border border-[#dedee1] bg-white px-4 py-4 shadow-sm",
        className,
      )}
    >
      <div className="max-w-2xl font-[family-name:var(--font-sans)]">
        <div className="flex items-start gap-2.5">
          <div
            className="mt-0.5 flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e8eaed] bg-white"
            style={{ width: 26, height: 26 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faviconSrc}
              alt=""
              width={26}
              height={26}
              className="size-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm leading-5 text-[#202124]">{siteName}</p>
            <p className="truncate text-xs leading-4 text-[#4d5156]">{urlDisplay}</p>
          </div>
        </div>

        <p
          className="mt-2 text-xl font-normal leading-[26px]"
          style={{ color: "#1a0dab" }}
        >
          {displayTitle}
        </p>

        <p className="mt-0.5 text-sm leading-[22px] text-[#4d5156]">
          {clippedDescription}
          {showReadMore ? (
            <>
              {" "}
              <span style={{ color: "#1a0dab" }}>Read more</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
