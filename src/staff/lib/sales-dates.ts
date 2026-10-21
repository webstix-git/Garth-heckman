import { endOfMonth, format, parseISO, startOfMonth, subDays, subMonths } from "date-fns";

import type { SalesRange } from "@/types";

export const SALES_MIN_DATE = "2025-01-01";
/** Rolling “today” so dashboard filters include current store data. */
export const SALES_MAX_DATE = format(new Date(), "yyyy-MM-dd");

export const BEST_SELLER_PERIODS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
] as const;

export type BestSellerPeriod = (typeof BEST_SELLER_PERIODS)[number]["value"];

export function rangeForBestSellerPeriod(period: string, asOf: Date): SalesRange {
  const min = parseISO(`${SALES_MIN_DATE}T12:00:00`);
  const clamp = (date: Date) => (date < min ? min : date);

  if (period === "yesterday") {
    const day = subDays(asOf, 1);
    return { from: format(clamp(day), "yyyy-MM-dd"), to: format(clamp(day), "yyyy-MM-dd") };
  }
  if (period === "7d") {
    return { from: format(clamp(subDays(asOf, 6)), "yyyy-MM-dd"), to: format(asOf, "yyyy-MM-dd") };
  }
  if (period === "30d") {
    return { from: format(clamp(subDays(asOf, 29)), "yyyy-MM-dd"), to: format(asOf, "yyyy-MM-dd") };
  }
  if (period === "this-month") {
    return { from: format(clamp(startOfMonth(asOf)), "yyyy-MM-dd"), to: format(asOf, "yyyy-MM-dd") };
  }
  if (period === "last-month") {
    const last = subMonths(asOf, 1);
    return {
      from: format(clamp(startOfMonth(last)), "yyyy-MM-dd"),
      to: format(endOfMonth(last), "yyyy-MM-dd"),
    };
  }

  return { from: format(asOf, "yyyy-MM-dd"), to: format(asOf, "yyyy-MM-dd") };
}
