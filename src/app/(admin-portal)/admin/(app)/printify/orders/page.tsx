"use client";

import { useState } from "react";

import { PrintifyTabs } from "@/components/printify/printify-tabs";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatDateTime } from "@/lib/format";
import { listPrintifyOrders } from "@/services/printify";
import type { PrintifyOrder } from "@/types";

export default function PrintifyOrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const list = useAsyncData(() => listPrintifyOrders(search), search);
  const rows = list.data ?? [];
  const pageSize = 10;
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  const columns: DataTableColumn<PrintifyOrder>[] = [
    { id: "local", header: "Local order", cell: (row) => row.localOrderNumber },
    { id: "printify", header: "Printify ID", cell: (row) => row.printifyOrderId },
    { id: "customer", header: "Customer", cell: (row) => row.customerName },
    { id: "product", header: "Product", cell: (row) => row.productName },
    {
      id: "status",
      header: "Fulfillment",
      cell: (row) => <StatusBadge status={row.fulfillmentStatus} />,
    },
    { id: "tracking", header: "Tracking", cell: (row) => row.trackingNumber ?? "—" },
    {
      id: "date",
      header: "Date",
      cell: (row) => formatDateTime(row.createdAt),
    },
  ];

  if (list.error) return <ErrorState description={list.error} onRetry={() => void list.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Printify orders" />
      <PrintifyTabs />
      <SearchInput
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search Printify orders…"
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
        emptyTitle="No Printify orders"
      />
    </div>
  );
}
