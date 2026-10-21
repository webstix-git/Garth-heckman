"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionCard } from "@/components/shared/section-card";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatCurrency } from "@/lib/format";
import { BEST_SELLER_PERIODS, rangeForBestSellerPeriod } from "@/lib/sales-dates";
import { getTopProducts } from "@/services/dashboard";

export function BestSellingProductsCard({ asOf }: { asOf: Date }) {
  const [period, setPeriod] = useState("today");
  const range = useMemo(() => rangeForBestSellerPeriod(period, asOf), [period, asOf]);
  const products = useAsyncData(() => getTopProducts(range), `${range.from}:${range.to}`);

  return (
    <SectionCard
      title="Best selling products"
      className="min-w-0"
      contentClassName="space-y-3 pt-4 pb-4"
      action={
        <FilterDropdown
          value={period}
          onChange={setPeriod}
          options={[...BEST_SELLER_PERIODS]}
          aria-label="Sort by period"
          size="sm"
          className="h-8 w-auto min-w-[9.5rem] shrink-0 sm:w-auto"
        />
      }
    >
      {products.loading || !products.data ? (
        <LoadingState className="h-48 py-0" />
      ) : products.data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No sales in this period.</p>
      ) : (
        products.data.map((product) => (
          <Link
            key={product.id}
            href={`/admin/products/${product.slug || product.id}/edit`}
            className="flex items-center gap-3 rounded-lg p-1 hover:bg-muted/60"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image} alt="" className="size-10 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.sold} sold</p>
            </div>
            <p className="text-sm tabular-nums">{formatCurrency(product.revenue)}</p>
          </Link>
        ))
      )}
    </SectionCard>
  );
}
