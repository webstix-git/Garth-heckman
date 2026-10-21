"use client";

import { useState } from "react";

import { PrintifyTabs } from "@/components/printify/printify-tabs";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatDateTime, titleCase } from "@/lib/format";
import { listPrintifyLogs } from "@/services/printify";
import type { PrintifySyncLog } from "@/types";

export default function PrintifyLogsPage() {
  const [page, setPage] = useState(1);
  const list = useAsyncData(() => listPrintifyLogs());
  const rows = list.data ?? [];
  const pageSize = 10;
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  const columns: DataTableColumn<PrintifySyncLog>[] = [
    { id: "type", header: "Type", cell: (row) => titleCase(row.type) },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    { id: "message", header: "Message", cell: (row) => row.message },
    { id: "date", header: "Date", cell: (row) => formatDateTime(row.createdAt) },
  ];

  if (list.error) return <ErrorState description={list.error} onRetry={() => void list.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Sync logs" />
      <PrintifyTabs />
      <DataTable
        data={paged}
        columns={columns}
        getRowId={(row) => row.id}
        page={page}
        pageSize={pageSize}
        total={rows.length}
        onPageChange={setPage}
        isLoading={list.loading}
        emptyTitle="No logs"
      />
    </div>
  );
}
