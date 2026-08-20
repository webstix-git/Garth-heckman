"use client";

import { useState } from "react";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";
import { BLOG_FILTERS, BLOG_POSTS, type BlogFilter } from "@/lib/blog";
import { IconArrow } from "@/components/icons";

export default function BlogPage() {
  const [cur, setCur] = useState<BlogFilter>("all");
  const [shown, setShown] = useState(6);
  const list = BLOG_POSTS.filter((p) => cur === "all" || p.tag === cur);

  return (
    <SiteChrome nav="blog">
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <span>Blog</span>
            </nav>
            <h1 className="d1">Blog</h1>
            <div className="between mt5" style={{ alignItems: "flex-end" }}>
              <p className="lede mw dim">
                Marriage and relationships, generational differences, evangelism. Written the way Garth talks in the room, not the way a content
                calendar talks. Looking for episodes instead?{" "}
                <a href="/podcast" style={{ color: "var(--acc)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                  The podcast is here.
                </a>
              </p>
              <a className="btn btn--line" href="/podcast">
                The podcast
              </a>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="row mb5" id="filters" data-rv="">
              {BLOG_FILTERS.map((f) => (
                <button
                  key={f}
                  className={`chip${cur === f ? " on" : ""}`}
                  data-f={f}
                  type="button"
                  onClick={() => {
                    setCur(f);
                    setShown(6);
                  }}
                >
                  {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="bgrid" id="grid" data-stagger="">
              {list.slice(0, shown).map((p) => (
                <article className="bcard" key={p.slug}>
                  <div className="bcard__media">
                    <Shot variant={p.v} ratio="16-9" label={false} alt={p.imgAlt} src={p.img} />
                  </div>
                  <div className="bcard__body">
                    <div className="bcard__top">
                      <span className="meta meta--gold">{p.tagLabel}</span>
                      <span className="meta meta--dim tnum">{p.read} read</span>
                    </div>
                    <h2 className="bcard__t">
                      <a href={`/blog/${p.slug}`}>{p.t}</a>
                    </h2>
                    <p className="bcard__tldr">
                      <b>TL;DR</b>
                      {p.tldr}
                    </p>
                    <div className="bcard__foot">
                      <span className="meta meta--dim">Garth Heckman · {p.date}</span>
                      <span className="bcard__go">
                        <IconArrow />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="row mt5" style={{ justifyContent: "center" }}>
              <button
                className="btn btn--line btn--lg"
                id="more"
                type="button"
                hidden={shown >= list.length}
                onClick={() => setShown((n) => n + 6)}
              >
                Load more
              </button>
            </div>
          </div>
        </section>

        <section className="sec-s tint">
          <div className="wrap-t center">
            <p className="meta meta--gold">Never miss one</p>
            <h2 className="d3 mt3">Get it in your inbox instead.</h2>
            <form
              className="row mt5"
              style={{ justifyContent: "center", flexWrap: "nowrap", maxWidth: 460, marginInline: "auto", gap: 10 }}
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="sr" htmlFor="nl">
                Email
              </label>
              <input className="input" id="nl" type="email" placeholder="you@example.com" />
              <button className="btn" type="submit" style={{ flex: "none" }}>
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
