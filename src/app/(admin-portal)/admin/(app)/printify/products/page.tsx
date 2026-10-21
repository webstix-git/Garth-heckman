"use client";

import Link from "next/link";
import { useState } from "react";

import { PrintifyTabs } from "@/components/printify/printify-tabs";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { listProducts } from "@/services/products";
import type { Product } from "@/types";

function InventoryValue({ product }: { product: Product }) {
  if (!product.inventory?.trackInventory) {
    return <span className="text-muted-foreground">Not tracked</span>;
  }

  const quantity = product.inventory.quantity ?? 0;
  return <span className="tabular-nums">{quantity} {quantity === 1 ? "unit" : "units"}</span>;
}

export default function PrintifyProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const list = useAsyncData(
    () =>
      listProducts({
        search,
        fulfillment: "printify",
        page: 1,
        pageSize: 100,
        sortBy: "updatedAt",
        sortDir: "desc",
      }),
    search,
  );
  const rows = list.data?.items ?? [];
  const pageSize = 10;
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  const columns: DataTableColumn<Product>[] = [
    {
      id: "name",
      header: "Product",
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={row.images[0] || "/images/catalog-placeholder.svg"}
            alt=""
            className="size-10 shrink-0 rounded-md object-cover"
          />
          <Link href={`/admin/products/${row.slug}/edit`} className="truncate font-medium hover:underline">
            {row.name}
          </Link>
        </div>
      ),
    },
    { id: "sku", header: "SKU", cell: (row) => row.sku || "—" },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status === "active" ? "published" : row.status} />,
    },
    { id: "inventory", header: "Inventory", cell: (row) => <InventoryValue product={row} /> },
  ];

  if (list.error) return <ErrorState description={list.error} onRetry={() => void list.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Printify products" />
      <PrintifyTabs />
      <SearchInput
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search Printify products…"
        className="max-w-xs"
      />
      <DataTable
        data={paged}
        columns={columns}
        getRowId={(row) => row.id}
        page={page}
        pageSize={pageSize}
        total={rows.length}
        onPageChange={setPage}
        isLoading={list.loading}
        emptyTitle="No Printify products"
        emptyDescription="Products fulfilled by Printify will appear here."
      />
    </div>
  );
}
