/** Simulated network latency so loading states are visible. Replace with real HTTP later. */
export function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 10,
): { items: T[]; total: number; page: number; pageSize: number } {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page: safePage,
    pageSize,
  };
}

export function matchesSearch(haystack: string, query?: string) {
  if (!query?.trim()) return true;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

export function sortByKey<T>(
  items: T[],
  key: keyof T,
  dir: "asc" | "desc" = "asc",
) {
  return [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { numeric: true });
    return dir === "asc" ? cmp : -cmp;
  });
}
