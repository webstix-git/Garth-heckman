"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import type { SalesPoint } from "@/types";

const chartConfig = {
  revenue: { label: "Revenue", color: "#2563eb" },
} satisfies ChartConfig;

function compactMoney(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value)}`;
}

export function SalesChart({ data }: { data: SalesPoint[] }) {
  if (!data.length) {
    return <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">No paid sales in this date range.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="h-72 w-full">
      <BarChart accessibilityLayer data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis dataKey="date" tick={{ fill: "#616161", fontSize: 12 }} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => String(value).slice(5)} />
        <YAxis tick={{ fill: "#616161", fontSize: 12 }} tickLine={false} axisLine={false} width={42} tickFormatter={(value) => compactMoney(Number(value))} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => String(value)}
              formatter={(value) => <span className="font-mono font-medium">{formatCurrency(Number(value))}</span>}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} maxBarSize={34} />
      </BarChart>
    </ChartContainer>
  );
}
