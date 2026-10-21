"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { isPayWhatYouWantPrice } from "@/lib/pay-what-you-want";
import { formatMoney0 } from "@/lib/money";

type StoreProduct = Product;
type StoreCategory = { name: string; slug: string; parentSlug: string | null };

function eff(p: StoreProduct) {
  return isPayWhatYouWantPrice(p.price) ? p.price.suggested ?? 0 : p.price.amount == null ? 1e9 : p.price.amount;
}

function listSentence(items: string[]) {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function nameOf(categories: StoreCategory[], slug: string) {
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}

function setUrlParam(name: string, value: string) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  window.history.replaceState(null, "", url.toString());
}

/**
 * Store UI. Products and categories come from the store backend via the store page.
 */
export default function StoreClient({
  initialProducts = [],
  categories = [],
  spotlightProduct = null,
}: {
  initialProducts?: StoreProduct[];
  categories?: StoreCategory[];
  spotlightProduct?: StoreProduct | null;
}) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [sort, setSort] = useState("featured");
  const [category, setCategory] = useState(params.get("category") || "");

  const spotlightSlug = spotlightProduct?.slug || null;
  const spotlightImage = spotlightProduct?.media?.find((m) => m.src)?.src || null;
  const spotlightIsPwyw = spotlightProduct ? isPayWhatYouWantPrice(spotlightProduct.price) : false;
  const categoryName = (slug: string) => nameOf(categories, slug);

  /** Top-level categories in backend order, only those with something for sale. */
  const topCategories = useMemo(
    () =>
      categories
        .filter((c) => !c.parentSlug)
        .map((c) => ({ ...c, count: initialProducts.filter((p) => p.categories.includes(c.slug)).length }))
        .filter((c) => c.count > 0),
    [categories, initialProducts],
  );
  const activeCategory = topCategories.some((c) => c.slug === category) ? category : "";

  const spotlightCompanion = useMemo(() => {
    if (!spotlightProduct) return null;
    const top = spotlightProduct.categories.find((slug) => topCategories.some((c) => c.slug === slug));
    return (
      spotlightProduct.related
        .map((ref) => initialProducts.find((p) => p.id === ref || p.slug === ref))
        .find((p): p is StoreProduct => Boolean(p && top && p.categories.includes(top))) ?? null
    );
  }, [spotlightProduct, initialProducts, topCategories]);

  const lede = useMemo(() => {
    const parts = ["Everything Garth has put on paper, on tape or on a shirt."];
    if (spotlightProduct && spotlightIsPwyw && spotlightProduct.price.suggested != null) {
      parts.push(`${spotlightProduct.title} is a ${formatMoney0(spotlightProduct.price.suggested)} suggested donation.`);
    }
    const free = initialProducts.filter((p) => !isPayWhatYouWantPrice(p.price) && p.price.amount === 0).map((p) => p.title);
    if (free.length) parts.push(`${listSentence(free)} ${free.length > 1 ? "are" : "is"} free.`);
    return parts.join(" ");
  }, [initialProducts, spotlightProduct, spotlightIsPwyw]);

  const list = useMemo(() => {
    const groupIndex = (p: StoreProduct) => {
      const index = topCategories.findIndex((c) => p.categories.includes(c.slug));
      return index === -1 ? topCategories.length : index;
    };
    const needle = q.trim().toLowerCase();
    const next = initialProducts.filter((p) => {
      if (activeCategory && !p.categories.includes(activeCategory)) return false;
      if (needle) {
        return [p.title, p.subtitle, p.descriptionShort, ...(p.tags || []), ...p.categories.map((slug) => nameOf(categories, slug))]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      }
      return activeCategory || !(spotlightSlug && p.slug === spotlightSlug);
    });
    const sorted = [...next];
    if (sort === "price-asc") sorted.sort((a, b) => eff(a) - eff(b));
    if (sort === "price-desc") sorted.sort((a, b) => eff(b) - eff(a));
    if (sort === "az") sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "featured")
      sorted.sort((a, b) => {
        const group = groupIndex(a) - groupIndex(b);
        if (group) return group;
        return Number(b.collections.includes("featured")) - Number(a.collections.includes("featured"));
      });
    return sorted;
  }, [q, sort, initialProducts, spotlightSlug, activeCategory, topCategories, categories]);

  const resources = useMemo(() => list.filter((p) => p.fulfillment !== "printify"), [list]);
  const merch = useMemo(() => list.filter((p) => p.fulfillment === "printify"), [list]);

  function pickCategory(slug: string) {
    setCategory(slug);
    setUrlParam("category", slug);
  }

  const emptyBecauseNoCatalog = !initialProducts.length && !q;

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
                <p className="lede mt5 mw dim">{lede}</p>
              </div>
            </div>
          </div>
        </section>

        {spotlightProduct && !activeCategory && !q ? (
          <section className="sec-s">
            <div className="wrap">
              <div className="split split-b on-dark grain plp__feature" data-rv="">
                <div className="book__shot" style={{ background: "var(--paper)" }}>
                  {spotlightImage ? (
                    <img
                      src={spotlightImage}
                      width={718}
                      height={957}
                      loading="lazy"
                      alt={spotlightProduct.title}
                    />
                  ) : null}
                </div>
                <div>
                  <span className="badge badge--gold">
                    {spotlightIsPwyw ? "Featured · Pay what you want" : "Featured"}
                  </span>
                  <h2 className="d2 mt3">{spotlightProduct.title}</h2>
                  <p className="body mt3 mw-s">
                    {spotlightProduct.descriptionShort || spotlightProduct.subtitle}
                  </p>
                  <div className="row mt5">
                    <a className="btn btn--lg" href={`/product/${spotlightProduct.slug}`}>
                      {spotlightIsPwyw ? "Choose your contribution" : "View product"}
                    </a>
                    {spotlightCompanion ? (
                      <a className="btn btn--line btn--lg" href={`/product/${spotlightCompanion.slug}`}>
                        {categoryName(spotlightCompanion.categories[spotlightCompanion.categories.length - 1])}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="sec">
          <div className="wrap">
            <div>
              {topCategories.length > 1 ? (
                <div className="row mb4" role="group" aria-label="Filter by category" style={{ gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="chip" aria-pressed={!activeCategory} onClick={() => pickCategory("")}>
                    All <small>{initialProducts.length}</small>
                  </button>
                  {topCategories.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      className="chip"
                      aria-pressed={activeCategory === c.slug}
                      onClick={() => pickCategory(activeCategory === c.slug ? "" : c.slug)}
                    >
                      {c.name} <small>{c.count}</small>
                    </button>
                  ))}
                </div>
              ) : null}
              <div
                className="between mb4"
                style={{
                  paddingBottom: 16,
                  borderBottom: "1px solid var(--line)",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <p className="meta meta--dim" id="count">
                  {list.length} {list.length === 1 ? "product" : "products"}
                  {activeCategory ? ` in ${categoryName(activeCategory)}` : ""}
                  {q ? ` for “${q}”` : ""}
                </p>
                <div
                  className="row"
                  style={{
                    gap: 12,
                    flex: "1 1 280px",
                    justifyContent: "flex-end",
                    maxWidth: 520,
                  }}
                >
                  <form
                    role="search"
                    id="searchForm"
                    style={{ flex: "1 1 200px", minWidth: 180, maxWidth: 280 }}
                    onSubmit={(e) => e.preventDefault()}
                  >
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
                    <select
                      className="select"
                      id="sort"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
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
                            Tee, tank,
                            <br />
                            mug and more
                          </h2>
                        </div>
                        <p className="body sm" style={{ maxWidth: "36ch" }}>
                          The WTFU lockup on Printify pieces — apparel, drinkware, and more. Printed when you order, shipped to you. Nothing sits in a warehouse.
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
                    {emptyBecauseNoCatalog ? (
                      <>
                        <h2 className="d3">Products coming soon</h2>
                        <p className="body mt3">The shop is being restocked. Please check back shortly.</p>
                      </>
                    ) : (
                      <>
                        <h2 className="d3">Nothing matches that.</h2>
                        <p className="body mt3">Try a shorter word, or browse everything.</p>
                        <p className="mt5">
                          <button className="btn" id="reset" type="button" onClick={() => { setQ(""); pickCategory(""); }}>
                            Show all resources
                          </button>
                        </p>
                      </>
                    )}
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
