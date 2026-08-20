"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Catalog } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { SiteChrome } from "@/components/chrome/SiteChrome";

type StoreProduct = ReturnType<typeof Catalog.all>[number];

function eff(p: StoreProduct) {
  return p.type === "pwyw" ? p.price.suggested ?? 0 : p.price.amount == null ? 1e9 : p.price.amount;
}

function storeGroup(p: StoreProduct) {
  if (p.fulfillment === "printify") return 2;
  if (p.categories.includes("books")) return 0;
  return 1;
}

function featuredElsewhere(p: StoreProduct) {
  return p.slug === "wtfu-book";
}

const MERCH_SLUGS = ["wtfu-tee", "wtfu-mug", "wtfu-journal"];

function merchOrder(p: StoreProduct) {
  const i = MERCH_SLUGS.indexOf(p.slug);
  return i === -1 ? 99 : i;
}

export default function StorePage() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [sort, setSort] = useState("featured");

  const list = useMemo(() => {
    const next = q ? Catalog.search(q) : Catalog.all().filter((p) => !featuredElsewhere(p));
    if (sort === "price-asc") next.sort((a, b) => eff(a) - eff(b));
    if (sort === "price-desc") next.sort((a, b) => eff(b) - eff(a));
    if (sort === "az") next.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "featured")
      next.sort((a, b) => {
        const group = storeGroup(a) - storeGroup(b);
        if (group) return group;
        return Number(b.collections.indexOf("featured") > -1) - Number(a.collections.indexOf("featured") > -1);
      });
    return next;
  }, [q, sort]);

  const resources = useMemo(
    () => list.filter((p) => p.fulfillment !== "printify"),
    [list],
  );
  const merch = useMemo(() => {
    const items = list.filter((p) => p.fulfillment === "printify");
    if (sort !== "featured") return items;
    return [...items].sort((a, b) => merchOrder(a) - merchOrder(b));
  }, [list, sort]);

  return (
    <SiteChrome nav="store">
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <span>Books &amp; Resources</span>
            </nav>
            <div className="between" style={{ alignItems: "flex-end" }}>
              <div>
                <h1 className="d1">
                  Books &amp;
                  <br />
                  resources
                </h1>
                <p className="lede mt5 mw dim">
                  Everything Garth has put on paper, on tape or on a shirt. Wake the Faith Up is a $10
                  suggested donation. The Generations Training Deck is free.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec-s">
          <div className="wrap">
            <div className="split split-b on-dark grain plp__feature" data-rv="">
              <div className="book__shot" style={{ background: "var(--paper)" }}>
                <img src="/assets/img/products/wtfu-featured.png" width={718} height={957} loading="lazy" alt="Wake The Faith Up" />
              </div>
              <div>
                <span className="badge badge--gold">Featured · Pay what you want</span>
                <h2 className="d2 mt3">
                  Wake the
                  <br />
                  faith up
                </h2>
                <p className="body mt3 mw-s">
                  Men were made for war. Suggested donation $10. Give more if the mission is worth it to you. The
                  paperback includes a 30-day devotional, and either way the book ships.
                </p>
                <div className="row mt5">
                  <a className="btn btn--lg" href="/product/wtfu-book">
                    Choose your contribution
                  </a>
                  <a className="btn btn--line btn--lg" href="/product/wtfu-audiobook">
                    Audiobook
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div>
              <div className="between mb4" style={{ paddingBottom: 16, borderBottom: "1px solid var(--line)", gap: 16, flexWrap: "wrap" }}>
                <p className="meta meta--dim" id="count">
                  {list.length} {list.length === 1 ? "product" : "products"}
                  {q ? ` for “${q}”` : ""}
                </p>
                <div className="row" style={{ gap: 12, flex: "1 1 280px", justifyContent: "flex-end", maxWidth: 520 }}>
                  <form role="search" id="searchForm" style={{ flex: "1 1 200px", minWidth: 180, maxWidth: 280 }} onSubmit={(e) => e.preventDefault()}>
                    <label className="sr" htmlFor="q">
                      Search resources
                    </label>
                    <input
                      className="input"
                      type="search"
                      id="q"
                      name="q"
                      placeholder="Search resources…"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </form>
                  <div>
                    <label className="sr" htmlFor="sort">
                      Sort by
                    </label>
                    <select className="select" id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                      <option value="featured">Featured</option>
                      <option value="price-asc">Price: low to high</option>
                      <option value="price-desc">Price: high to low</option>
                      <option value="az">A – Z</option>
                    </select>
                  </div>
                </div>
              </div>

              {list.length ? (
                <>
                  {resources.length ? (
                    <div className="pgrid" id="grid" data-stagger="">
                      {resources.map((p) => (
                        <ProductCard key={p.id} p={p} />
                      ))}
                    </div>
                  ) : null}

                  {merch.length ? (
                    <div className="mt7" id="merch">
                      <div className="between mb5" data-rv="">
                        <div>
                          <p className="meta meta--gold">Branded merchandise</p>
                          <h2 className="d2 mt3">
                            Tee, mug
                            <br />
                            and journal
                          </h2>
                        </div>
                        <p className="body sm" style={{ maxWidth: "36ch" }}>
                          The WTFU lockup on three Printify pieces. Printed when you order, shipped to you. Nothing sits in a warehouse.
                        </p>
                      </div>
                      <div className="pgrid" data-stagger="">
                        {merch.map((p) => (
                          <ProductCard key={p.id} p={p} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div id="empty">
                  <div className="empty">
                    <h2 className="d3">Nothing matches that.</h2>
                    <p className="body mt3">Try a shorter word, or browse everything.</p>
                    <p className="mt5">
                      <button className="btn" id="reset" type="button" onClick={() => setQ("")}>
                        Show all resources
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
