"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Catalog, type Product, type ProductVariant } from "@/lib/catalog";
import {
  cartKeyFor,
  emptyCartSnapshot,
  emptyPromoSnapshot,
  fetchQuote,
  hasDigital,
  hasPhysical,
  hydrateAll,
  printifyDigitalCartConflict,
  quoteRequestKey,
  readCart,
  readPromo,
  subtotalCents,
  writeCart,
  writePromo,
  type CartItem,
  type CartQuote,
  type HydratedLine,
  type Promo,
} from "@/lib/cart";
import { isPayWhatYouWantPrice } from "@/lib/pay-what-you-want";

type Toast = { id: number; title: string; body: string; href?: string; label?: string };

type CartContextValue = {
  items: CartItem[];
  lines: HydratedLine[];
  count: number;
  promo: Promo | null;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  taxLabel: string;
  taxIncluded: boolean;
  freeShippingRemaining: number | null;
  total: number;
  /** True once the backend has priced the current cart (shipping, tax, coupon). */
  priced: boolean;
  quoteError: string;
  paypalAvailable: boolean;
  codAvailable: boolean;
  physical: boolean;
  digital: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  addItem: (item: Omit<CartItem, "key">) => string;
  setQty: (key: string, qty: number) => void;
  setPwyw: (key: string, cents: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  applyPromo: (code: string) => Promise<{ ok: boolean; msg: string }>;
  clearPromo: () => void;
  toasts: Toast[];
  toast: (title: string, body: string, href?: string, label?: string) => void;
  announce: (msg: string) => void;
  liveMessage: string;
  /** True after CMS catalog hydrate so cart lines can resolve new products. */
  catalogReady: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

function subscribeCart(onChange: () => void) {
  window.addEventListener("cart:change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("cart:change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribeCart, readCart, emptyCartSnapshot);
  const promo = useSyncExternalStore(subscribeCart, readPromo, emptyPromoSnapshot);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [liveMessage, setLiveMessage] = useState("");
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogTick, setCatalogTick] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        // Same-origin /api/catalog avoids browser CORS to the ecommerce backend.
        const response = await fetch("/api/catalog", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as {
          data?: Product[];
          categories?: Array<{ id: string; name: string; slug: string; description?: string }>;
        };
        if (!active) return;
        if (response.ok && Array.isArray(payload.data)) {
          Catalog.hydrateCms(payload.data);
          Catalog.hydrateCategories(payload.categories ?? []);
          setCatalogTick((tick) => tick + 1);
        }
      } catch {
        // Keep cart usable even if the catalog is unreachable.
      } finally {
        if (active) setCatalogReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    writeCart(next);
  }, []);

  const toast = useCallback((title: string, body: string, href?: string, label?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, body, href, label }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4520);
  }, []);
  const toastRef = useRef(toast);

  const lines = useMemo(() => {
    void catalogTick;
    return hydrateAll(items);
  }, [items, catalogTick]);
  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const physical = useMemo(() => hasPhysical(lines), [lines]);
  const digital = useMemo(() => hasDigital(lines), [lines]);

  const requestKey = quoteRequestKey(items, promo);
  const [quoteState, setQuoteState] = useState<{ key: string; quote: CartQuote | null; error: string } | null>(null);
  const current = items.length && quoteState?.key === requestKey ? quoteState : null;
  const quote = current?.quote ?? null;

  useEffect(() => {
    if (!items.length) return;
    let active = true;
    const timer = setTimeout(() => {
      fetchQuote(items, promo?.code ?? null)
        .then((next) => {
          if (!active) return;
          if (promo && next.couponError) {
            writePromo(null);
            toastRef.current("Code removed", next.couponError.message);
          }
          setQuoteState({ key: requestKey, quote: next, error: "" });
        })
        .catch((error: unknown) => {
          if (active) setQuoteState({ key: requestKey, quote: null, error: error instanceof Error ? error.message : "Unable to price your cart." });
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [items, promo, requestKey]);

  const localSubtotal = useMemo(() => subtotalCents(lines), [lines]);
  const subtotal = quote?.subtotalCents ?? localSubtotal;
  const discount = quote?.discountCents ?? 0;
  const shipping = quote?.shippingCents ?? 0;
  const tax = quote?.taxCents ?? 0;
  const total = quote?.totalCents ?? localSubtotal;

  const addItem = useCallback(
    (item: Omit<CartItem, "key">) => {
      const key = cartKeyFor(item);
      const qty = item.qty || 1;
      const existing = items.find((i) => i.key === key);
      const next = existing
        ? items.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i))
        : [...items, { ...item, key, qty }];
      persist(next);
      return key;
    },
    [items, persist],
  );

  const setQty = useCallback(
    (key: string, qty: number) => {
      let next = items.map((i) => (i.key === key ? { ...i, qty: Math.max(0, qty) } : i));
      next = next.filter((i) => i.qty > 0);
      persist(next);
    },
    [items, persist],
  );

  const setPwyw = useCallback(
    (key: string, cents: number) => {
      const next = items.map((i) => {
        if (i.key !== key) return i;
        const updated = { ...i, pwywCents: cents };
        return { ...updated, key: cartKeyFor(updated) };
      });
      persist(next);
    },
    [items, persist],
  );

  const remove = useCallback(
    (key: string) => persist(items.filter((i) => i.key !== key)),
    [items, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const applyPromo = useCallback(
    async (code: string) => {
      const c = String(code || "").trim().toUpperCase();
      if (!c) return { ok: false, msg: "Enter a code." };
      if (!items.length) return { ok: false, msg: "Add something to your cart first." };
      try {
        const checked = await fetchQuote(items, c);
        if (!checked.coupon) return { ok: false, msg: checked.couponError?.message || "That code is not valid." };
        writePromo({ code: checked.coupon.code, kind: checked.coupon.kind, label: checked.coupon.label });
        return { ok: true, msg: `${checked.coupon.label} applied.` };
      } catch (error) {
        return { ok: false, msg: error instanceof Error ? error.message : "Couldn't check that code." };
      }
    },
    [items],
  );

  const clearPromo = useCallback(() => {
    writePromo(null);
  }, []);

  const announce = useCallback((msg: string) => {
    setLiveMessage("");
    setTimeout(() => setLiveMessage(msg), 60);
  }, []);

  const value: CartContextValue = {
    items,
    lines,
    count,
    promo,
    subtotal,
    discount,
    shipping,
    tax,
    taxLabel: quote?.taxLabel || "Tax",
    taxIncluded: Boolean(quote?.taxIncluded),
    freeShippingRemaining: quote?.freeShippingRemainingCents ?? null,
    total,
    priced: Boolean(quote),
    quoteError: current?.error ?? "",
    paypalAvailable: quote?.paypal !== false,
    codAvailable: false,
    physical,
    digital,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    searchOpen,
    openSearch: () => setSearchOpen(true),
    closeSearch: () => setSearchOpen(false),
    addItem,
    setQty,
    setPwyw,
    remove,
    clear,
    applyPromo,
    clearPromo,
    toasts,
    toast,
    announce,
    liveMessage,
    catalogReady,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function addProductToCart(
  cart: CartContextValue,
  p: Product,
  opts?: { variant?: ProductVariant | null; qty?: number; pwywCents?: number },
): string | null {
  const conflict = printifyDigitalCartConflict(cart.lines, p);
  if (conflict) {
    cart.toast("Can’t mix these items", conflict, "#cart", "View cart");
    return null;
  }
  const variant = opts?.variant ?? null;
  const pwywCents =
    isPayWhatYouWantPrice(p.price) ? opts?.pwywCents ?? p.price.suggested ?? p.price.min ?? 0 : undefined;
  return cart.addItem({
    productId: p.id,
    slug: p.slug,
    variantId: variant ? variant.id : null,
    qty: opts?.qty || 1,
    pwywCents,
  });
}
