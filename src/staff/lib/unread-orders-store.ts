const STORAGE_KEY = "gh.admin.orders.seen";
const EVENT = "gh-admin-orders-seen";

type SeenState = {
  /** Order IDs the admin has already viewed. */
  ids: string[];
  /** True after first baseline so existing orders don’t all count as unread. */
  seeded: boolean;
};

function emptyState(): SeenState {
  return { ids: [], seeded: false };
}

function readState(): SeenState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<SeenState>;
    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids.filter((id) => typeof id === "string") : [],
      seeded: Boolean(parsed.seeded),
    };
  } catch {
    return emptyState();
  }
}

function writeState(next: SeenState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeSeenOrders(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getSeenOrderIds(): string[] {
  return readState().ids;
}

export function isSeenOrdersSeeded(): boolean {
  return readState().seeded;
}

/** First load: mark every current order as seen so only future orders notify. */
export function seedSeenOrders(orderIds: string[]) {
  const current = readState();
  if (current.seeded) return;
  writeState({
    seeded: true,
    ids: Array.from(new Set([...current.ids, ...orderIds])),
  });
}

export function markOrdersSeen(orderIds: string[]) {
  if (!orderIds.length) return;
  const current = readState();
  writeState({
    seeded: true,
    ids: Array.from(new Set([...current.ids, ...orderIds])),
  });
}

export function markOrderSeen(orderId: string) {
  markOrdersSeen([orderId]);
}
