"use client";

import { SOCIALS } from "@/lib/nav";

export function Socials({ className = "socials" }: { className?: string }) {
  return (
    <div className={className}>
      {SOCIALS.map((s) => (
        <a key={s.name} className="soc" href={s.href} aria-label={s.name} target="_blank" rel="noopener">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d={s.d} />
          </svg>
        </a>
      ))}
    </div>
  );
}
