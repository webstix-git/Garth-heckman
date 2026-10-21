"use client";

import { useMemo, useState } from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import type { PieSectorShapeProps } from "recharts/types/polar/Pie";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { SectionCard } from "@/components/shared/section-card";
import { titleCase } from "@/lib/format";
import type { OrderStatusCount } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  processing: "#1d4ed8",
  completed: "#2563eb",
  pending: "#3b82f6",
  cancelled: "#60a5fa",
  fulfilled: "#93c5fd",
};

const LEGEND_ORDER = ["processing", "completed", "pending", "cancelled", "fulfilled"];

export function OrdersOverviewCard({ data }: { data: OrderStatusCount[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const rows = useMemo(
    () => [...data].sort((a, b) => LEGEND_ORDER.indexOf(a.status) - LEGEND_ORDER.indexOf(b.status)),
    [data],
  );
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const chartData = rows.map((row) => ({
    status: row.status,
    orders: row.count,
    fill: STATUS_COLORS[row.status] ?? "#a3a3a3",
  }));
  const chartConfig = {
    orders: { label: "Orders" },
    ...Object.fromEntries(rows.map((row) => [row.status, { label: titleCase(row.status), color: STATUS_COLORS[row.status] ?? "#a3a3a3" }])),
  } satisfies ChartConfig;

  return (
    <SectionCard title="Orders overview">
      {total === 0 ? (
        <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-5">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-56 max-h-56 w-full max-w-[240px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="orders"
                nameKey="status"
                innerRadius={62}
                strokeWidth={5}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                shape={(props: PieSectorShapeProps) => {
                  const { index, outerRadius = 0, ...sectorProps } = props;
                  return <Sector {...sectorProps} outerRadius={index === activeIndex ? outerRadius + 9 : outerRadius} />;
                }}
              >
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">{total}</tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">Total orders</tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {rows.map((row, index) => (
              <li key={row.status} className="flex cursor-default items-center gap-2 text-sm text-muted-foreground" onMouseEnter={() => setActiveIndex(index)}>
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[row.status] ?? "#a3a3a3" }} />
                <span>{titleCase(row.status)}</span>
                <span className="tabular-nums">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
