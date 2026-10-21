"use client";

import { useEffect, useRef } from "react";
import { FORGE_ROWS } from "@/lib/content";
import { IconArrow } from "@/components/icons";

export function Forge({ cta = true }: { cta?: boolean }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ledger = root.current?.querySelector("#ledger") as HTMLElement | null;
    if (!ledger) return;
    const fill = ledger.querySelector("[data-fill]") as HTMLElement | null;
    const rows = Array.from(ledger.querySelectorAll(".lrow"));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (fill) fill.style.height = "100%";
      rows.forEach((r) => r.classList.add("lit"));
      return;
    }
    if (!("IntersectionObserver" in window) || !fill) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("lit");
          const i = rows.indexOf(en.target as Element);
          const pct = Math.round(((i + 1) / rows.length) * 100);
          fill.style.height = pct + "%";
          io.unobserve(en.target);
        });
      },
      { rootMargin: "0px 0px -40% 0px", threshold: 0.15 },
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={root}
      className="sec on-dark grain forge"
      id="forge"
      style={{ background: "linear-gradient(168deg,var(--maroon-dp) 0%,#1B0C10 56%,#0C0709 100%)" }}
    >
      <div className="wrap forge__head">
        <div className="forge__top">
          <div>
            <p className="meta" style={{ color: "var(--ember)" }}>
              Forged by fire
            </p>
            <h2 className="d2 mt3" style={{ maxWidth: "17ch" }}>
              Four things that should have ended it.
            </h2>
          </div>
          <p className="forge__kicker">
            Some stories are built through success. <em>His was built through survival.</em>
          </p>
        </div>
      </div>

      <div className="wrap mt6">
        <ol className="ledger" id="ledger">
          <span className="ledger__fill" data-fill="" aria-hidden="true"></span>
          {FORGE_ROWS.map((r) => (
            <li className="lrow" key={r.t}>
              <p className="lrow__age">
                {r.age}
                {r.tag ? <s>{r.tag}</s> : null}
              </p>
              <div>
                <h3 className="lrow__t">{r.t}</h3>
                <p className="lrow__d">{r.d}</p>
              </div>
              <div className="lrow__yet">
                <b>And yet</b>
                <p>{r.yet}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="forge__close">
          None of it took. <em>That is the whole point.</em>
        </p>

        {cta ? (
          <div className="row forge__cta">
            <a className="btn" href="/cancer">
              If you are in the fight right now
            </a>
            <a className="tlink" href="/story">
              Read the whole story <IconArrow />
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
