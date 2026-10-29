"use client";

import Image from "next/image";
import { useState } from "react";

const VARIANT: Record<string, string> = {
  light: "",
  pale: "",
  default: "dark",
  dark: "dark",
  warm: "warm",
  ember: "warm",
  cool: "cool",
};

function normalizeRatio(ratio?: string) {
  // CSS uses classes like .r1-1 — normalize "1/1" from older CMS payloads.
  return String(ratio || "4-3").replace(/\//g, "-");
}

function canOptimize(src: string) {
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    return host.endsWith("supabase.co") || host.endsWith("garthheckman.com");
  } catch {
    return false;
  }
}

export function Shot({
  variant = "default",
  ratio = "4-3",
  label,
  note,
  className = "",
  src,
  contain = false,
  alt,
  anchor,
  priority = false,
}: {
  variant?: string;
  ratio?: string;
  label?: string | false;
  note?: string;
  className?: string;
  src?: string;
  contain?: boolean;
  alt?: string;
  anchor?: "top" | "center";
  /** Eager-load hero / LCP images. */
  priority?: boolean;
}) {
  const ratioClass = normalizeRatio(ratio);
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(src) && !failed;
  const altText = alt ?? (label === false ? "" : label || "");

  if (showPhoto && src) {
    const objectPosition = anchor === "top" ? "top center" : "center";
    const objectFit = contain ? "contain" : "cover";
    return (
      <div
        className={`photo r${ratioClass}${contain ? " photo--contain" : ""}${
          anchor === "top" ? " photo--top" : ""
        } ${className}`.trim()}
      >
        {canOptimize(src) ? (
          <Image
            src={src}
            alt={altText}
            fill
            sizes="(max-width: 940px) 100vw, (max-width: 1400px) 50vw, 720px"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            style={{ objectFit, objectPosition }}
            onError={() => setFailed(true)}
          />
        ) : (
          // External hosts outside next.config remotePatterns keep native img + lazy attrs.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={altText}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            width={1200}
            height={900}
            onError={() => setFailed(true)}
          />
        )}
        <span className="shot__tick">
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </span>
        {label !== false && (
          <span className="shot__cap meta">
            <b>{label || "Image"}</b>
            {note ? <span>{note}</span> : null}
          </span>
        )}
      </div>
    );
  }

  const name = VARIANT[variant === undefined ? "default" : variant] ?? VARIANT.default;
  const v = name ? ` shot--${name}` : "";
  return (
    <div className={`shot${v} r${ratioClass} ${className}`.trim()}>
      <span className="shot__tick">
        <i></i>
        <i></i>
        <i></i>
        <i></i>
      </span>
      {label !== false && (
        <span className="shot__cap meta">
          <b>{label || "Image"}</b>
          <span>{note || "Supplied by client"}</span>
        </span>
      )}
    </div>
  );
}
