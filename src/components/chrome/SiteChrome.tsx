"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import type { NavId } from "@/lib/nav";
import { AskBar } from "@/components/chrome/AskBar";
import { BackToTop } from "@/components/chrome/BackToTop";
import { StickyBar, TopNav } from "@/components/chrome/Nav";
import { Footer, Sheet } from "@/components/chrome/Footer";
import { CartDrawer } from "@/components/chrome/CartDrawer";
import { SearchModal } from "@/components/chrome/SearchModal";
import { useCart } from "@/components/CartProvider";
function withTopNav(node: ReactNode, nav: NavId, sheetOpen: boolean, onSheet: () => void): ReactNode {
  const arr = Children.toArray(node);
  const main = arr[0];
  if (!isValidElement(main)) return node;

  const mainEl = main as ReactElement<{ children?: ReactNode }>;
  const mainKids = Children.toArray(mainEl.props.children);
  let target = mainKids[0];
  let wrapArticle = false;

  if (isValidElement(target) && target.type === "article") {
    wrapArticle = true;
    const articleKids = Children.toArray((target as ReactElement<{ children?: ReactNode }>).props.children);
    target = articleKids[0];
    if (!isValidElement(target)) return node;
    const patched = patchSection(target as ReactElement<{ className?: string; style?: CSSProperties; children?: ReactNode }>, nav, sheetOpen, onSheet);
    const articleEl = mainKids[0] as ReactElement<{ children?: ReactNode }>;
    const newArticle = cloneElement(articleEl, {
      children: [patched, ...Children.toArray(articleEl.props.children).slice(1)],
    });
    return cloneElement(mainEl, {
      children: [newArticle, ...mainKids.slice(1)],
    });
  }

  if (!isValidElement(target)) return node;
  void wrapArticle;
  const patched = patchSection(target as ReactElement<{ className?: string; style?: CSSProperties; children?: ReactNode }>, nav, sheetOpen, onSheet);
  return cloneElement(mainEl, {
    children: [patched, ...mainKids.slice(1)],
  });
}

/** The gold notice follows the page banner, so the header stays the first thing on the page. */
function withAskBar(node: ReactNode): ReactNode {
  const arr = Children.toArray(node);
  const main = arr[0];
  if (!isValidElement(main)) return node;

  const mainEl = main as ReactElement<{ children?: ReactNode }>;
  const kids = Children.toArray(mainEl.props.children);
  const first = kids[0];

  if (isValidElement(first) && first.type === "article") {
    const article = first as ReactElement<{ children?: ReactNode }>;
    const articleKids = Children.toArray(article.props.children);
    if (!articleKids.length) return node;
    return cloneElement(mainEl, {
      children: [
        cloneElement(article, {
          children: [articleKids[0], <AskBar key="askbar" />, ...articleKids.slice(1)],
        }),
        ...kids.slice(1),
      ],
    });
  }

  if (!kids.length) return node;
  return cloneElement(mainEl, {
    children: [kids[0], <AskBar key="askbar" />, ...kids.slice(1)],
  });
}

function patchSection(
  el: ReactElement<{ className?: string; style?: CSSProperties; children?: ReactNode }>,
  nav: NavId,
  sheetOpen: boolean,
  onSheet: () => void,
) {
  const style = { ...(el.props.style || {}) };
  if (!style.position || style.position === "static") style.position = "relative";
  return cloneElement(el, {
    className: [el.props.className, "has-topnav"].filter(Boolean).join(" "),
    style,
    children: [
      <TopNav key="topnav" nav={nav} sheetOpen={sheetOpen} onSheet={onSheet} />,
      ...Children.toArray(el.props.children),
    ],
  });
}

function Toasts() {
  const { toasts, openDrawer } = useCart();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <b>{t.title}</b>
          {t.body}
          {t.href ? (
            <>
              {" · "}
              <a
                href={t.href}
                data-opencart
                onClick={(e) => {
                  if (t.href === "#cart") {
                    e.preventDefault();
                    openDrawer();
                  }
                }}
              >
                {t.label || "View"}
              </a>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function LiveRegion() {
  const { liveMessage } = useCart();
  return (
    <p className="sr" role="status" aria-live="polite">
      {liveMessage}
    </p>
  );
}

function SiteBehaviors() {
  const { toast } = useCart();

  useEffect(() => {
    document.querySelectorAll("[data-stagger]").forEach((g) => {
      Array.from(g.children).forEach((c, i) => {
        (c as HTMLElement).style.setProperty("--i", String(i));
      });
      if (!g.hasAttribute("data-rv")) g.setAttribute("data-rv", "0");
    });

    const items = Array.from(document.querySelectorAll("[data-rv]")).filter((i) => !i.classList.contains("in"));
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((i) => i.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const d = parseInt((en.target as HTMLElement).dataset.rv || "0", 10) || 0;
          setTimeout(() => en.target.classList.add("in"), d);
          io.unobserve(en.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const pending = (e.target as HTMLElement).closest(
        'main a[href="#"], .prow__link[href="#"], .ep__link[href="#"]',
      );
      if (pending) {
        e.preventDefault();
        toast("Link pending", "Waiting on the real URL from Garth: podcast feed and platform links.");
      }

      const qtyBtn = (e.target as HTMLElement).closest(".qty button");
      if (qtyBtn) {
        const input = qtyBtn.closest(".qty")?.querySelector("input");
        if (input) {
          const min = parseInt(input.min || "1", 10);
          const step = qtyBtn.getAttribute("data-step") === "up" ? 1 : -1;
          input.value = String(Math.max(min, (parseInt(input.value, 10) || min) + step));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      const acc = (e.target as HTMLElement).closest(".acc__btn");
      // ProductView accordion is React-controlled — skip legacy DOM toggle there.
      if (acc && !acc.closest("[data-acc-react]")) {
        const open = acc.getAttribute("aria-expanded") === "true";
        acc.setAttribute("aria-expanded", String(!open));
        acc.closest(".acc__item")?.classList.toggle("open", !open);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [toast]);

  return null;
}

export function SiteChrome({
  nav,
  children,
  shell = true,
}: {
  nav: NavId;
  children: ReactNode;
  shell?: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [barShow, setBarShow] = useState(false);

  useEffect(() => {
    if (!shell) return;
    function trigger() {
      const open = document.querySelector(".topnav");
      if (!open) return 120;
      const r = open.getBoundingClientRect();
      const pt = window.scrollY + r.bottom + 24;
      return pt > 400 ? 120 : pt;
    }
    let point = trigger();
    function update() {
      setBarShow(window.scrollY > point);
    }
    function onResize() {
      point = trigger();
      update();
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onResize);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
    };
  }, [shell]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const toggleSheet = () => setSheetOpen((o) => !o);

  if (!shell) {
    return (
      <>
        {children}
        <Toasts />
        <LiveRegion />
      </>
    );
  }

  return (
    <>
      <StickyBar nav={nav} show={barShow} sheetOpen={sheetOpen} onSheet={toggleSheet} />
      {withAskBar(withTopNav(children, nav, sheetOpen, toggleSheet))}
      <Sheet nav={nav} open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <Footer />
      <BackToTop />
      <CartDrawer />
      <SearchModal />
      <Toasts />
      <LiveRegion />
      <SiteBehaviors />
    </>
  );
}
