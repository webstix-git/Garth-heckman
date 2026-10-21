"use client";

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
}) {
  const ratioClass = normalizeRatio(ratio);
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(src) && !failed;

  if (showPhoto) {
    return (
      <div
        className={`photo r${ratioClass}${contain ? " photo--contain" : ""}${
          anchor === "top" ? " photo--top" : ""
        } ${className}`.trim()}
      >
        <img
          src={src}
          alt={alt ?? (label === false ? "" : label || "")}
          onError={() => setFailed(true)}
        />
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
