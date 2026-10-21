"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getSeenOrderIds,
  isSeenOrdersSeeded,
  markOrderSeen,
  markOrdersSeen,
  seedSeenOrders,
  subscribeSeenOrders,
} from "@/lib/unread-orders-store";
import { listOrders } from "@/services/orders";
import type { Order } from "@/types";

export type UnreadOrderNotice = {
  id: string;
  number: string;
  customerName: string;
  total: number;
  createdAt: string;
  href: string;
};

type UnreadOrdersValue = {
  unreadCount: number;
  unreadOrders: UnreadOrderNotice[];
  loading: boolean;
  refresh: () => Promise<void>;
  markSeen: (orderId: string) => void;
  markAllSeen: () => void;
};

const UnreadOrdersContext = createContext<UnreadOrdersValue | null>(null);

function toNotice(order: Order): UnreadOrderNotice {
  return {
    id: order.id,
    number: order.number,
    customerName: order.customerName,
    total: order.total,
    createdAt: order.createdAt,
    href: `/admin/orders/${order.id}`,
  };
}

export function UnreadOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const syncSeen = useCallback(() => {
    setSeenIds(getSeenOrderIds());
  }, []);

  const refresh = useCallback(async () => {
    try {
      const page = await listOrders({ page: 1, pageSize: 50, sortBy: "createdAt", sortDir: "desc" });
      const items = page.items ?? [];
      if (!isSeenOrdersSeeded()) {
        seedSeenOrders(items.map((order) => order.id));
      }
      setOrders(items);
      syncSeen();
    } catch {
      // Keep previous snapshot if the request fails.
    } finally {
      setLoading(false);
    }
  }, [syncSeen]);

  useEffect(() => {
    syncSeen();
    void refresh();
    const unsubscribe = subscribeSeenOrders(syncSeen);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [refresh, syncSeen]);

  const unreadOrders = useMemo(() => {
    const seen = new Set(seenIds);
    return orders.filter((order) => !seen.has(order.id)).map(toNotice);
  }, [orders, seenIds]);

  const value = useMemo<UnreadOrdersValue>(
    () => ({
      unreadCount: unreadOrders.length,
      unreadOrders,
      loading,
      refresh,
      markSeen: (orderId: string) => {
        markOrderSeen(orderId);
        syncSeen();
      },
      markAllSeen: () => {
        markOrdersSeen(orders.map((order) => order.id));
        syncSeen();
      },
    }),
    [unreadOrders, loading, refresh, orders, syncSeen],
  );

  return (
    <UnreadOrdersContext.Provider value={value}>{children}</UnreadOrdersContext.Provider>
  );
}

export function useUnreadOrders() {
  const ctx = useContext(UnreadOrdersContext);
  if (!ctx) {
    return {
      unreadCount: 0,
      unreadOrders: [] as UnreadOrderNotice[],
      loading: false,
      refresh: async () => undefined,
      markSeen: (_orderId: string) => undefined,
      markAllSeen: () => undefined,
    } satisfies UnreadOrdersValue;
  }
  return ctx;
}
