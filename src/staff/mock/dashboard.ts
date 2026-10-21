import { differenceInCalendarDays, eachDayOfInterval, format, parseISO } from "date-fns";

import type {
  DashboardStats,
  OrderStatusCount,
  SalesOverview,
  SalesPoint,
  SalesRange,
  TopProduct,
} from "@/types";
import { SALES_MAX_DATE, SALES_MIN_DATE } from "@/lib/sales-dates";

export { SALES_MAX_DATE, SALES_MIN_DATE };

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  }
  return (h >>> 0) / 2 ** 32;
}

function metricsForDay(iso: string) {
  const date = parseISO(`${iso}T12:00:00`);
  const noise = hash(iso);
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  const seasonal = 1 + 0.22 * Math.sin((date.getMonth() / 12) * Math.PI * 2);
  const orders = weekend
    ? noise < 0.42
      ? 0
      : Math.round(1 + noise * 3)
    : Math.round((2 + noise * 6) * seasonal);
  const average = 26 + noise * 24;
  return {
    date: iso,
    orders,
    revenue: Math.round(orders * average * 100) / 100,
  } satisfies SalesPoint;
}

export const mockDailySales: SalesPoint[] = eachDayOfInterval({
  start: parseISO(`${SALES_MIN_DATE}T12:00:00`),
  end: parseISO(`${SALES_MAX_DATE}T12:00:00`),
}).map((day) => metricsForDay(format(day, "yyyy-MM-dd")));

function summarize(points: SalesPoint[]) {
  const revenue = points.reduce((sum, point) => sum + point.revenue, 0);
  const orders = points.reduce((sum, point) => sum + point.orders, 0);
  return {
    revenue,
    orders,
    averageOrder: orders ? revenue / orders : 0,
  };
}

function bucket(points: SalesPoint[], range: SalesRange): SalesPoint[] {
  const days = differenceInCalendarDays(parseISO(range.to), parseISO(range.from)) + 1;
  if (days <= 45) {
    return points.map((point) => ({
      ...point,
      date: format(parseISO(`${point.date}T12:00:00`), "MMM d"),
    }));
  }

  const months = new Map<string, SalesPoint>();
  for (const point of points) {
    const key = format(parseISO(`${point.date}T12:00:00`), "yyyy-MM");
    const current = months.get(key) ?? {
      date: format(parseISO(`${point.date}T12:00:00`), "MMM yyyy"),
      orders: 0,
      revenue: 0,
    };
    current.orders += point.orders;
    current.revenue += point.revenue;
    months.set(key, current);
  }
  return [...months.values()].map((point) => ({
    ...point,
    revenue: Math.round(point.revenue * 100) / 100,
  }));
}

export function getSalesForRange(from: string, to: string): SalesOverview {
  const start = from < to ? from : to;
  const end = from < to ? to : from;
  const clampedStart = start < SALES_MIN_DATE ? SALES_MIN_DATE : start;
  const clampedEnd = end > SALES_MAX_DATE ? SALES_MAX_DATE : end;
  const range = { from: clampedStart, to: clampedEnd };
  const filtered = mockDailySales.filter(
    (point) => point.date >= range.from && point.date <= range.to,
  );
  const points = bucket(filtered, range);
  return { range, points, totals: summarize(filtered) };
}

export const mockSalesSeries: SalesPoint[] = getSalesForRange("2026-03-01", "2026-08-15").points;

export const mockDashboardStats: DashboardStats = {
  products: 12,
  orders: 12,
  customers: 8,
  blogPosts: 8,
  contactSubmissions: 10,
  media: 14,
  revenue: 891.9,
};

export const mockOrderStatusCounts: OrderStatusCount[] = [
  { status: "pending", count: 2 },
  { status: "processing", count: 3 },
  { status: "fulfilled", count: 2 },
  { status: "completed", count: 4 },
  { status: "cancelled", count: 1 },
];

export const mockTopProducts: TopProduct[] = [
  { id: "prod_wtfu", name: "WTFU Book", image: "https://picsum.photos/seed/wtfu-book/80/80", sold: 48, revenue: 1296 },
  { id: "prod_tee", name: "WTFU Wordmark Tee", image: "https://picsum.photos/seed/wtfu-tee/80/80", sold: 31, revenue: 992 },
  { id: "prod_deck", name: "Generations Training Deck", image: "https://picsum.photos/seed/gen-deck/80/80", sold: 18, revenue: 1422 },
  { id: "prod_burn", name: "Burn This Book PDF", image: "https://picsum.photos/seed/burn-pdf/80/80", sold: 27, revenue: 486 },
  { id: "prod_audio", name: "WTFU Audio Book", image: "https://picsum.photos/seed/wtfu-audio/80/80", sold: 22, revenue: 484 },
];
