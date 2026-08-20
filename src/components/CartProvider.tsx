"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Product, ProductVariant } from "@/lib/catalog";
import {
  PROMOS,
  cartKeyFor,
  discountCents,
  emptyCartSnapshot,
  emptyPromoSnapshot,
  hasDigital,
  hasPhysical,
  hydrateAll,
  readCart,
  readPromo,
  shippingCents,
  subtotalCents,
  taxCents,
  totalCents,
  writeCart,
  writePromo,
  type CartItem,
  type HydratedLine,
  type Promo,
} from "@/lib/cart";

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
  total: number;
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
  applyPromo: (code: string) => { ok: boolean; msg: string };
  clearPromo: () => void;
  toasts: Toast[];
  toast: (title: string, body: string, href?: string, label?: string) => void;
  announce: (msg: string) => void;
  liveMessage: string;
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

  const persist = useCallback((next: CartItem[]) => {
    writeCart(next);
  }, []);

  const lines = useMemo(() => hydrateAll(items), [items]);
  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const subtotal = useMemo(() => subtotalCents(lines), [lines]);
  const discount = useMemo(() => discountCents(subtotal, promo), [subtotal, promo]);
  const shipping = useMemo(() => shippingCents(lines, subtotal, promo), [lines, subtotal, promo]);
  const tax = useMemo(() => taxCents(subtotal, discount), [subtotal, discount]);
  const total = useMemo(() => totalCents(lines, promo), [lines, promo]);
  const physical = useMemo(() => hasPhysical(lines), [lines]);
  const digital = useMemo(() => hasDigital(lines), [lines]);

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
    (code: string) => {
      const c = String(code || "").trim().toUpperCase();
      if (!c) return { ok: false, msg: "Enter a code." };
      const p = PROMOS[c];
      if (!p) return { ok: false, msg: "That code is not recognised." };
      if (p.kind === "shipping" && !hasPhysical(lines))
        return { ok: false, msg: "That code applies to shipping, and this order has nothing to ship." };
      writePromo({ code: c, ...p });
      return { ok: true, msg: p.label + " applied." };
    },
    [lines],
  );

  const clearPromo = useCallback(() => {
    writePromo(null);
  }, []);

  const toast = useCallback((title: string, body: string, href?: string, label?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, body, href, label }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4520);
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
    total,
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
) {
  const variant = opts?.variant ?? null;
  const pwywCents =
    p.type === "pwyw" ? opts?.pwywCents ?? p.price.suggested ?? p.price.min ?? 0 : undefined;
  return cart.addItem({
    productId: p.id,
    slug: p.slug,
    variantId: variant ? variant.id : null,
    qty: opts?.qty || 1,
    pwywCents,
  });
}
