"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatDateTime } from "@/lib/format";
import { deleteSubmission, listSubmissions } from "@/services/contact";
import type { ContactStatus, ContactSubmission } from "@/types";

export default function ContactSubmissionsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContactStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useAsyncData(
    () => listSubmissions({ search, status, page, pageSize: 10 }),
    `${search}:${status}:${page}`,
  );

  const columns: DataTableColumn<ContactSubmission>[] = [
    {
      id: "name",
      header: "From",
      cell: (row) => (
        <div>
          <Link href={`/admin/contact-submissions/${row.id}`} className="font-medium hover:underline">
            {row.name}
          </Link>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { id: "phone", header: "Phone", cell: (row) => row.phone },
    { id: "subject", header: "Subject", cell: (row) => row.subject },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "date",
      header: "Date",
      cell: (row) => (
        <span className="text-muted-foreground">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" render={<Link href={`/admin/contact-submissions/${row.id}`} />}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (list.error) return <ErrorState description={list.error} onRetry={() => void list.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Contact submissions" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search inbox…"
          className="sm:max-w-xs"
        />
        <FilterDropdown
          value={status}
          onChange={(value) => {
            setStatus(value as ContactStatus | "all");
            setPage(1);
          }}
          options={[
            { label: "All statuses", value: "all" },
            { label: "New", value: "new" },
            { label: "Read", value: "read" },
            { label: "Responded", value: "responded" },
            { label: "Archived", value: "archived" },
          ]}
        />
      </div>
      <DataTable
        data={list.data?.items ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        page={page}
        pageSize={10}
        total={list.data?.total ?? 0}
        onPageChange={setPage}
        isLoading={list.loading}
        emptyTitle="Inbox is empty"
      />
      <DeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete submission"
        loading={busy}
        onConfirm={async () => {
          if (!deleteId) return;
          setBusy(true);
          await deleteSubmission(deleteId);
          setBusy(false);
          setDeleteId(null);
          toast.success("Submission deleted");
          void list.reload();
        }}
      />
    </div>
  );
}
