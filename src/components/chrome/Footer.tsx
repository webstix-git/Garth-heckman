"use client";

import { SOCIALS } from "@/lib/nav";
import { WTFU_HREF } from "@/lib/links";
import { IconMail, IconPhone, IconPin, IconX } from "@/components/icons";
import { NavLinks } from "@/components/chrome/Nav";
import { useCart } from "@/components/CartProvider";
import type { NavId } from "@/lib/nav";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="ftr grain">
      <div className="wrap" style={{ position: "relative", zIndex: 2 }}>
        <div className="ftr__top">
          <div>
            <p className="ftr__mission">
              Make God
              <br />
              look <em>good.</em>
            </p>
            <p className="body sm mt3" style={{ maxWidth: "32ch", color: "var(--taupe)" }}>
              Coach · Pastor · Author · Generational Strategist. Forty-two years in, still asking better questions.
            </p>
            <div className="socials">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  className="soc"
                  href={s.href}
                  aria-label={s.name}
                  target="_blank"
                  rel="noopener"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          <div className="fcol">
            <p className="meta meta--gold">Work with Garth</p>
            <ul>
              <li>
                <a href="/work">What I do</a>
              </li>
              <li>
                <a href="/coaching">Coaching</a>
              </li>
              <li>
                <a href="/speaking">Speaking</a>
              </li>
              <li>
                <a href="/simply-church">Simply Church</a>
              </li>
              <li>
                <a href="/relationship-recall">Relationship Recall</a>
              </li>
              <li>
                <a href="/bridgeworks">Bridgeworks</a>
              </li>
            </ul>
          </div>
          <div className="fcol fcol--split">
            <p className="meta meta--gold">More</p>
            <div className="fcol__pair">
              <ul>
                <li>
                  <a href="/story">My story</a>
                </li>
                <li>
                  <a href="/cancer">Cancer</a>
                </li>
                <li>
                  <a href="/podcast">The podcast</a>
                </li>
                <li>
                  <a href="/blog">Blog</a>
                </li>
              </ul>
              <ul>
                <li>
                  <a href={WTFU_HREF}>WTFU, the book</a>
                </li>
                <li>
                  <a href="/store">Store</a>
                </li>
                <li>
                  <a href="/account">Orders &amp; downloads</a>
                </li>
                <li>
                  <a href="/contact">Connect</a>
                </li>
                <li>
                  <a href="/style-guide">Design system</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="fcol fcol--contact">
            <p className="meta meta--gold">Get in touch</p>
            <address className="fcontact">
              <a className="fcontact__row" href="mailto:garthwheckman@gmail.com">
                <IconMail />
                <span>garthwheckman@gmail.com</span>
              </a>
              <a className="fcontact__row" href="tel:+19522407152">
                <IconPhone />
                <span>(952) 240-7152</span>
              </a>
              <a
                className="fcontact__row"
                href="https://maps.google.com/?q=15097+DuPont+Path,+Apple+Valley,+MN+55124"
                target="_blank"
                rel="noopener"
              >
                <IconPin />
                <span>
                  15097 DuPont Path
                  <br />
                  Apple Valley, MN 55124
                </span>
              </a>
            </address>
          </div>
        </div>
        <div className="ftr__bot meta">
          <div className="ftr__legal">
            <span>© {year} Garth Heckman.</span>
            <span className="ftr__dot" aria-hidden="true">
              ·
            </span>
            <nav className="ftr__pipes" aria-label="Legal">
              <a href="/sitemap">Sitemap</a>
              <span aria-hidden="true">|</span>
              <a href="/service-index">Service Index</a>
              <span aria-hidden="true">|</span>
              <a href="/ai-policy">AI Policy</a>
              <span aria-hidden="true">|</span>
              <a href="/privacy">Privacy Policy</a>
            </nav>
          </div>
          <a className="ftr__by" href="https://www.webstix.com/" target="_blank" rel="noopener">
            <span>Designed by</span>
            <img src="/assets/img/webstix.png" width="140" height="28" alt="Webstix" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export function Sheet({
  nav,
  open,
  onClose,
}: {
  nav: NavId;
  open: boolean;
  onClose: () => void;
}) {
  const { openSearch } = useCart();
  return (
    <div className={`sheet${open ? " open" : ""}`} id="sheet" aria-hidden={!open}>
      <div className="sheet__top">
        <a className="mark" href="/">
          <img src="/assets/img/gh-logo.png" width={732} height={732} alt="" />
          <span>
            <b>Garth Heckman</b>
          </span>
        </a>
        <button
          className="drawer__x"
          type="button"
          data-sheetclose
          aria-label="Close menu"
          style={{ borderColor: "rgba(244,241,234,.3)" }}
          onClick={onClose}
        >
          <IconX />
        </button>
      </div>
      <button
        className="sheet__search"
        type="button"
        data-search-open
        onClick={() => {
          onClose();
          openSearch();
        }}
      >
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12.2 12.2 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>Search this site</span>
      </button>
      <nav aria-label="Mobile" onClick={onClose}>
        <NavLinks active={nav} />
      </nav>
      <div className="row mt5">
        <a className="btn btn--lg btn--block" href={WTFU_HREF} onClick={onClose}>
          Get WTFU
        </a>
      </div>
    </div>
  );
}
