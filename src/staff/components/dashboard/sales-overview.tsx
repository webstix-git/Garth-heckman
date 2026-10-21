"use client";

import { format, subDays, subMonths } from "date-fns";
import { useMemo, useState } from "react";

import { SalesChart } from "@/components/dashboard/sales-chart";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionCard } from "@/components/shared/section-card";
import { useAsyncData } from "@/hooks/use-async-data";
import { SALES_MIN_DATE } from "@/lib/sales-dates";
import { getSalesOverview } from "@/services/dashboard";

const PERIODS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
] as const;

function rangeForPeriod(period: string, asOf: Date) {
  const min = new Date(`${SALES_MIN_DATE}T12:00:00`);
  const from =
    period === "30d"
      ? subDays(asOf, 29)
      : period === "90d"
        ? subDays(asOf, 89)
        : period === "6m"
          ? subMonths(asOf, 6)
          : subDays(asOf, 6);
  return {
    from: format(from < min ? min : from, "yyyy-MM-dd"),
    to: format(asOf, "yyyy-MM-dd"),
  };
}

export function SalesOverviewCard({ asOf }: { asOf: Date }) {
  const [period, setPeriod] = useState("7d");
  const range = useMemo(() => rangeForPeriod(period, asOf), [period, asOf]);
  const sales = useAsyncData(() => getSalesOverview(range), `${range.from}:${range.to}`);

  return (
    <SectionCard
      title="Sales overview"
      className="xl:col-span-2"
      contentClassName="pt-5 pb-4"
      action={
        <FilterDropdown
          value={period}
          onChange={setPeriod}
          options={[...PERIODS]}
          aria-label="Sales period"
          className="w-40"
        />
      }
    >
      {sales.loading || !sales.data ? (
        <LoadingState className="h-72 py-0" />
      ) : (
        <SalesChart data={sales.data.points} />
      )}
    </SectionCard>
  );
}
