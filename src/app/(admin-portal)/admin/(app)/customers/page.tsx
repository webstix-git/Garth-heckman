"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { mailtoHref, telHref } from "@/lib/links";
import { replaceQuery } from "@/lib/query-url";
import { downloadAdminExport } from "@/lib/download-export";
import { toast } from "sonner";
import { listCustomers } from "@/services/customers";
import type { Customer, CustomerStatus } from "@/types";

export default function CustomersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const status = (searchParams.get("status") as CustomerStatus | null) ?? "all";
  const [page, setPage] = useState(1);
  const list = useAsyncData(
    () => listCustomers({ search, status, page, pageSize: 10 }),
    `${search}:${status}:${page}`,
  );

  const columns: DataTableColumn<Customer>[] = [
    {
      id: "name",
      header: "Name",
      cell: (row) => (
        <Link href={`/admin/customers/${row.id}`} className="font-medium hover:underline">
          {row.firstName} {row.lastName}
        </Link>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: (row) =>
        row.email ? (
          <a href={mailtoHref(row.email)} className="hover:underline" onClick={(e) => e.stopPropagation()}>
            {row.email}
          </a>
        ) : (
          "—"
        ),
    },
    {
      id: "phone",
      header: "Phone",
      cell: (row) =>
        row.phone ? (
          <a href={telHref(row.phone)} className="hover:underline" onClick={(e) => e.stopPropagation()}>
            {row.phone}
          </a>
        ) : (
          "—"
        ),
    },
    { id: "orders", header: "Orders", cell: (row) => row.orderCount },
    {
      id: "spent",
      header: "Total spent",
      cell: (row) => formatCurrency(row.totalSpent),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "joined",
      header: "Joined",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <Button variant="ghost" size="sm" render={<Link href={`/admin/customers/${row.id}`} />}>
          View
        </Button>
      ),
    },
  ];

  if (list.error) return <ErrorState description={list.error} onRetry={() => void list.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" actions={<Button variant="outline" onClick={() => void downloadAdminExport("customers").catch((error) => toast.error(error.message))}><Download /> Export</Button>} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search name, email, phone…"
          className="sm:max-w-xs"
        />
        <FilterDropdown
          value={status}
          onChange={(value) => {
            setPage(1);
            router.replace(replaceQuery(pathname, searchParams, { status: value }));
          }}
          options={[
            { label: "All statuses", value: "all" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
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
        emptyTitle="No customers"
      />
    </div>
  );
}
