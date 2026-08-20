"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Catalog } from "@/lib/catalog";
import { BLOG_POSTS } from "@/lib/content";
import { formatMoney } from "@/lib/money";
import { WTFU_HREF } from "@/lib/links";
import { useCart } from "@/components/CartProvider";
import { IconTrend, IconStore, IconJournal, IconX } from "@/components/icons";

type GroupId = "all" | "store" | "journal";

const GROUPS: Array<{ id: GroupId; label: string; icon: ReactNode }> = [
  { id: "all", label: "All", icon: <IconTrend /> },
  { id: "store", label: "Store", icon: <IconStore /> },
  { id: "journal", label: "Blog", icon: <IconJournal /> },
];

type IndexItem = {
  group: GroupId;
  kicker: string;
  title: string;
  desc: string;
  href: string;
  hay: string;
};

function buildIndex(): IndexItem[] {
  const out: IndexItem[] = [];
  BLOG_POSTS.forEach((p) => {
    out.push({
      group: "journal",
      kicker: `Blog · ${p.read}`,
      title: p.t,
      desc: p.d,
      href: `/blog/${p.slug}`,
      hay: `${p.t} ${p.d} ${p.tag} article blog journal`.toLowerCase(),
    });
  });
  Catalog.all().forEach((p) => {
    const price =
      p.type === "pwyw" ? "Pay what you can" : p.price.amount != null ? formatMoney(p.price.amount) : "Price TBC";
    out.push({
      group: "store",
      kicker: `Store · ${price}`,
      title: p.title,
      desc: p.descriptionShort || p.subtitle || "",
      href: `/product/${p.slug}`,
      hay: [p.title, p.subtitle, p.descriptionShort, p.sku, ...(p.tags || []), ...(p.categories || [])]
        .join(" ")
        .toLowerCase(),
    });
  });
  return out;
}

function score(item: IndexItem, q: string) {
  const t = item.title.toLowerCase();
  if (t === q) return 100;
  if (t.indexOf(q) === 0) return 80;
  if (new RegExp("\\b" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(t)) return 60;
  if (t.indexOf(q) > -1) return 45;
  if (item.hay.indexOf(q) > -1) return 20;
  return 0;
}

export function SearchModal() {
  const { searchOpen, closeSearch, openSearch } = useCart();
  const [group, setGroup] = useState<GroupId>("all");
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(() => buildIndex(), []);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return index
      .map((i) => ({ i, s: score(i, query) }))
      .filter((r) => r.s > 0 && (group === "all" || r.i.group === group))
      .sort((a, b) => b.s - a.s)
      .map((r) => r.i);
  }, [q, group, index]);

  const counts = useMemo(() => {
    const query = q.trim().toLowerCase();
    const c: Record<string, number> = { all: 0 };
    GROUPS.forEach((g) => {
      c[g.id] = 0;
    });
    if (!query) return c;
    index
      .map((i) => ({ i, s: score(i, query) }))
      .filter((r) => r.s > 0)
      .forEach((r) => {
        c.all++;
        c[r.i.group]++;
      });
    return c;
  }, [q, index]);

  const suggestions = index
    .filter((i) => group === "all" || i.group === group)
    .slice(0, 7)
    .map((i) => ({ t: i.title, href: i.href }));

  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName || "") ||
        (e.target as HTMLElement)?.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openSearch();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openSearch]);

  useEffect(() => {
    if (!searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [searchOpen]);

  function onDialogKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (results.length ? (c + 1) % results.length : -1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (results.length ? (c - 1 + results.length) % results.length : -1));
    }
    if (e.key === "Enter" && cursor > -1 && results[cursor]) {
      e.preventDefault();
      window.location.href = results[cursor].href;
    }
  }

  return (
    <div className={`qs${searchOpen ? " show" : ""}`} id="qs" hidden={!searchOpen} onKeyDown={onDialogKey}>
      <div className="qs__backdrop" data-qs-close onClick={closeSearch} />
      <div className="qs__modal" role="dialog" aria-modal="true" aria-label="Search this site">
        <div className="qs__head">
          <a className="qs__brand" href="/" aria-label="Garth Heckman home">
            <img src="/assets/img/gh-logo.png" width={732} height={732} alt="" />
          </a>
          <div className="qs__field">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12.2 12.2 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <label className="sr" htmlFor="qsInput">
              Search this site
            </label>
            <input
              id="qsInput"
              ref={inputRef}
              className="qs__input"
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search the store and blog…"
              role="combobox"
              aria-expanded={!!q}
              aria-controls="qsResults"
              aria-autocomplete="list"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCursor(-1);
              }}
            />
            <button
              type="button"
              className="qs__clear"
              data-qs-clear
              aria-label="Clear search"
              hidden={!q}
              onClick={() => {
                setQ("");
                inputRef.current?.focus();
              }}
            >
              <IconX />
            </button>
          </div>
          <div className="qs__actions">
            <a className="qs__link" href="/contact">
              Connect
            </a>
            <a className="btn btn--sm" href={WTFU_HREF}>
              Get WTFU
            </a>
          </div>
          <button type="button" className="qs__x" data-qs-close aria-label="Close search" onClick={closeSearch}>
            <IconX />
          </button>
        </div>
        <div className="qs__body">
          <nav className="qs__rail" aria-label="Filter results">
            {GROUPS.map((g) => {
              const on = group === g.id;
              const disabled = !!q && !counts[g.id] && g.id !== "all";
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`qs__tab${on ? " on" : ""}`}
                  data-qs-group={g.id}
                  aria-pressed={on}
                  disabled={disabled}
                  onClick={() => {
                    setGroup(g.id);
                    setCursor(-1);
                    inputRef.current?.focus();
                  }}
                >
                  {g.icon}
                  <span>{g.label}</span>
                  <s data-qs-count={g.id}>{q ? counts[g.id] || "" : ""}</s>
                </button>
              );
            })}
          </nav>
          <div className="qs__content">
            <ul className="qs__results" id="qsResults" role="listbox" aria-label="Search results">
              {q && results.length
                ? results.map((item, i) => (
                    <li
                      key={item.href + item.title + i}
                      role="option"
                      aria-selected={cursor === i}
                      data-qs-row={i}
                      id={`qsrow${i}`}
                    >
                      <a href={item.href} tabIndex={-1}>
                        <span className="qs__kicker">{item.kicker}</span>
                        <span className="qs__title">{item.title}</span>
                        {item.desc ? <span className="qs__desc">{item.desc}</span> : null}
                      </a>
                    </li>
                  ))
                : null}
            </ul>
            <div className="qs__state" data-qs-state="">
              {!q ? (
                <ul className="qs__suggest">
                  {suggestions.map((s) => (
                    <li key={s.href + s.t}>
                      <a href={s.href}>{s.t}</a>
                    </li>
                  ))}
                </ul>
              ) : !results.length ? (
                <p className="qs__none">
                  <strong>No results for “{q}”.</strong> Try a shorter word, or browse{" "}
                  <a href="/store">the store</a> and <a href="/blog">the blog</a>.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
