"use client";

import { useState } from "react";
import { WORK } from "@/lib/content";
import { Shot } from "@/components/Shot";
import { IconArrow } from "@/components/icons";

export function WorkSwitcher({ className = "work" }: { className?: string }) {
  const [i, setI] = useState(0);

  function select(n: number, focus = false) {
    setI(n);
    if (focus) document.getElementById(`t-${n}`)?.focus();
  }

  return (
    <div className={className}>
      <ul className="work__index" role="tablist" aria-label="Areas of work" data-rv="" id="workTabs">
        {WORK.map((w, n) => (
          <li className="work__item" role="presentation" key={w.t}>
            <button
              className="work__btn"
              role="tab"
              id={`t-${n}`}
              aria-controls={`p-${n}`}
              aria-selected={n === i}
              tabIndex={n === i ? 0 : -1}
              onClick={() => select(n)}
              onKeyDown={(e) => {
                let next: number | null = null;
                if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (n + 1) % WORK.length;
                if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (n - 1 + WORK.length) % WORK.length;
                if (e.key === "Home") next = 0;
                if (e.key === "End") next = WORK.length - 1;
                if (next !== null) {
                  e.preventDefault();
                  select(next, true);
                }
              }}
            >
              <span className="work__n">{n + 1}</span>
              <span className="work__t">{w.t}</span>
              <svg className="work__ar" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <div className="work__panel" data-rv="120" id="workPanels">
        {WORK.map((w, n) => (
          <div
            key={w.t}
            className={`panel${n === i ? " in" : ""}`}
            role="tabpanel"
            id={`p-${n}`}
            aria-labelledby={`t-${n}`}
            hidden={n !== i}
          >
            <Shot variant={w.v} ratio="4-5" label={w.t} note={w.cap} src={w.src} anchor={"anchor" in w ? w.anchor : undefined} />
            <div>
              <p className="meta meta--gold">
                {n + 1} · {w.t}
              </p>
              <h2 className="d3 mt2">{w.h}</h2>
              <p className="body mt3">{w.d}</p>
              <div className="panel__tags">
                {w.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <p className="mt4">
                <a className="tlink" href={w.href}>
                  {w.cta} <IconArrow />
                </a>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
