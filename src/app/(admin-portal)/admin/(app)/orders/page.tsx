"use client";

import { Download, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable, useSelection, type DataTableColumn } from "@/components/shared/data-table";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { replaceQuery } from "@/lib/query-url";
import { downloadAdminExport } from "@/lib/download-export";
import { deleteOrder, deleteOrders, listOrders } from "@/services/orders";
import type { Order, OrderStatus, PaymentStatus } from "@/types";

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selection = useSelection();
  const [search, setSearch] = useState("");
  const paymentStatus = (searchParams.get("payment") as PaymentStatus | null) ?? "all";
  const fulfillmentStatus = (searchParams.get("status") as OrderStatus | null) ?? "all";
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function setFilter(patch: Record<string, string | null | undefined>) {
    setPage(1);
    router.replace(replaceQuery(pathname, searchParams, patch));
  }

  const list = useAsyncData(
    () =>
      listOrders({
        search,
        paymentStatus,
        fulfillmentStatus,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize: 10,
      }),
    `${search}:${paymentStatus}:${fulfillmentStatus}:${from}:${to}:${page}`,
  );

  const deleteTarget = list.data?.items.find((o) => o.id === deleteId);

  const columns: DataTableColumn<Order>[] = [
    {
      id: "number",
      header: "Order",
      cell: (row) => (
        <Link href={`/admin/orders/${row.id}`} className="font-medium hover:underline">
          {row.number}
        </Link>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: (row) => (
        <div>
          <div>{row.customerName}</div>
          <div className="text-xs text-muted-foreground">{row.customerEmail}</div>
        </div>
      ),
    },
    {
      id: "items",
      header: "Items",
      cell: (row) => row.items.reduce((sum, item) => sum + item.quantity, 0),
    },
    {
      id: "total",
      header: "Total",
      cell: (row) => <span className="tabular-nums">{formatCurrency(row.total)}</span>,
    },
    {
      id: "payment",
      header: "Payment",
      cell: (row) => <PaymentStatusBadge status={row.paymentStatus} />,
    },
    {
      id: "status",
      header: "Fulfillment",
      cell: (row) => <OrderStatusBadge status={row.fulfillmentStatus} />,
    },
    {
      id: "date",
      header: "Date",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
    {
      id: "actions",
      header: "",
      headerClassName: "w-12",
      className: "w-12",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal />
            <span className="sr-only">Actions</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/admin/orders/${row.id}`} />}>
              <Eye /> View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteId(row.id)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (list.error) return <ErrorState description={list.error} onRetry={() => void list.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" actions={<Button variant="outline" onClick={() => void downloadAdminExport("orders").catch((error) => toast.error(error.message))}><Download /> Export</Button>} />
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search order or customer…"
          className="lg:max-w-xs lg:flex-1"
        />
        <FilterDropdown
          value={paymentStatus}
          onChange={(value) => setFilter({ payment: value })}
          options={[
            { label: "All payments", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "Paid", value: "paid" },
            { label: "Failed", value: "failed" },
            { label: "Refunded", value: "refunded" },
          ]}
        />
        <FilterDropdown
          value={fulfillmentStatus}
          onChange={(value) => setFilter({ status: value })}
          options={[
            { label: "All statuses", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "Processing", value: "processing" },
            { label: "Fulfilled", value: "fulfilled" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ]}
        />
        <Input
          type="date"
          aria-label="From date"
          value={from}
          className="w-full lg:w-40"
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          aria-label="To date"
          value={to}
          className="w-full lg:w-40"
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <DataTable
        data={list.data?.items ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        selectable
        selectedIds={selection.selectedIds}
        onSelectionChange={selection.setSelectedIds}
        page={page}
        pageSize={10}
        total={list.data?.total ?? 0}
        onPageChange={setPage}
        isLoading={list.loading}
        emptyTitle="No orders"
        bulkActions={
          <Button
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => setBulkDeleteOpen(true)}
          >
            Delete
          </Button>
        }
      />

      <DeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete order"
        description={
          deleteTarget
            ? `Delete order ${deleteTarget.number}? This cannot be undone.`
            : "This order will be removed. This cannot be undone."
        }
        loading={busy}
        onConfirm={async () => {
          if (!deleteId) return;
          setBusy(true);
          try {
            await deleteOrder(deleteId);
            toast.success("Order deleted");
            selection.clear();
            setDeleteId(null);
            void list.reload();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not delete order");
          } finally {
            setBusy(false);
          }
        }}
      />
      <DeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete selected orders"
        description={`Delete ${selection.selectedIds.length} order${selection.selectedIds.length === 1 ? "" : "s"}? This cannot be undone.`}
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await deleteOrders(selection.selectedIds);
            toast.success("Selected orders deleted");
            selection.clear();
            setBulkDeleteOpen(false);
            void list.reload();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not delete orders");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
