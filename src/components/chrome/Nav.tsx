"use client";

import { WTFU_HREF } from "@/lib/links";
import { NAV, type NavId } from "@/lib/nav";
import { useCart } from "@/components/CartProvider";
import { IconBag, IconSearch } from "@/components/icons";

export function Mark({ small = false, href = "/" }: { small?: boolean; href?: string }) {
  return (
    <a className="mark" href={href} aria-label="Garth Heckman home">
      <img src="/assets/img/gh-logo.png" width={732} height={732} alt="" />
      <span>
        <b>Garth Heckman</b>
        {small ? null : <s>Make God look good</s>}
      </span>
    </a>
  );
}

export function NavLinks({ active }: { active: NavId }) {
  return (
    <>
      {NAV.map((n) => (
        <a
          key={n.id}
          className="navlink"
          href={n.href}
          {...(n.id === active ? { "aria-current": "page" as const } : {})}
        >
          {n.label}
        </a>
      ))}
    </>
  );
}

export function SearchBtn() {
  const { openSearch } = useCart();
  return (
    <button
      className="iconbtn hide-s"
      type="button"
      data-search-open
      aria-label="Search this site"
      title="Search (press /)"
      onClick={openSearch}
    >
      <IconSearch />
    </button>
  );
}

export function CartBtn() {
  const { count, openDrawer } = useCart();
  return (
    <button className="cartbtn" type="button" data-opendrawer aria-label="Open cart" onClick={openDrawer}>
      <IconBag />
      <b data-cart-count="" data-empty={count === 0 ? "true" : "false"}>
        {count}
      </b>
    </button>
  );
}

export function TopNav({ nav, sheetOpen, onSheet }: { nav: NavId; sheetOpen: boolean; onSheet: () => void }) {
  return (
    <div className="topnav">
      <div className="wrap topnav__in">
        <Mark />
        <nav className="topnav__links" aria-label="Primary">
          <NavLinks active={nav} />
        </nav>
        <div className="topnav__cta">
          <SearchBtn />
          <CartBtn />
          <a className="btn btn--hero hide-s" href={WTFU_HREF}>
            Get WTFU
          </a>
          <button
            className="burger"
            type="button"
            data-sheet
            aria-expanded={sheetOpen}
            aria-controls="sheet"
            aria-label="Menu"
            onClick={onSheet}
          >
            <span></span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function StickyBar({
  nav,
  show,
  sheetOpen,
  onSheet,
}: {
  nav: NavId;
  show: boolean;
  sheetOpen: boolean;
  onSheet: () => void;
}) {
  return (
    <header className={`stickybar${show ? " show" : ""}`} id="stickybar">
      <div className="wrap stickybar__in">
        <Mark small />
        <nav className="stickybar__links" aria-label="Primary">
          <NavLinks active={nav} />
        </nav>
        <div className="stickybar__cta">
          <SearchBtn />
          <CartBtn />
          <a className="btn btn--hero hide-s" href={WTFU_HREF}>
            Get WTFU
          </a>
          <button
            className="burger"
            type="button"
            data-sheet
            aria-expanded={sheetOpen}
            aria-controls="sheet"
            aria-label="Menu"
            onClick={onSheet}
          >
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
