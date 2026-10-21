"use client";

import { MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  DataTable,
  type DataTableColumn,
  useSelection,
} from "@/components/shared/data-table";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsyncData } from "@/hooks/use-async-data";
import { TRASH_RETENTION_DAYS, trashDaysRemaining } from "@/lib/trash-retention";
import {
  listCategories,
  permanentlyDeleteCategory,
  restoreCategory,
  trashCategories,
  trashCategory,
  countTrashCategories,
} from "@/services/categories";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const viewTrash = searchParams.get("view") === "trash";
  const [search, setSearch] = useState("");
  const list = useAsyncData(
    () => listCategories(search, { trash: viewTrash }),
    `${viewTrash}:${search}`,
  );
  const trashCount = useAsyncData(() => countTrashCategories(), "categories-trash-count");
  const [bulkTrashOpen, setBulkTrashOpen] = useState(false);
  const [bulkPermanentOpen, setBulkPermanentOpen] = useState(false);
  const [trashTargetId, setTrashTargetId] = useState<string | null>(null);
  const [permanentTargetId, setPermanentTargetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selection = useSelection();

  const columns: DataTableColumn<Category>[] = useMemo(() => {
    const base: DataTableColumn<Category>[] = [
      {
        id: "name",
        header: "Category",
        headerClassName: "w-[330px]",
        cell: (category) => (
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={category.image || "/images/catalog-placeholder.svg"}
              alt=""
              className="size-10 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0">
              {viewTrash ? (
                <span className="block truncate font-medium">{category.name}</span>
              ) : (
                <Link
                  href={`/admin/categories/${category.id}/edit`}
                  className="block truncate font-medium hover:underline"
                >
                  {category.name}
                </Link>
              )}
              <p className="truncate text-xs text-muted-foreground">/{category.slug}</p>
            </div>
          </div>
        ),
      },
      {
        id: "description",
        header: "Description",
        headerClassName: "w-[300px]",
        className: "max-w-0",
        cell: (category) => (
          <span className="block truncate text-muted-foreground">{category.description || "—"}</span>
        ),
      },
    ];

    if (viewTrash) {
      base.push({
        id: "deletedAt",
        header: "Auto-delete",
        headerClassName: "w-[120px]",
        cell: (category) => (
          <span className="text-sm text-muted-foreground tabular-nums">
            {category.deletedAt
              ? `${trashDaysRemaining(category.deletedAt)} day${trashDaysRemaining(category.deletedAt) === 1 ? "" : "s"}`
              : "—"}
          </span>
        ),
      });
    } else {
      base.push(
        {
          id: "productCount",
          header: "Products",
          headerClassName: "w-[120px]",
          cell: (category) => <span className="tabular-nums">{category.productCount}</span>,
        },
        {
          id: "active",
          header: "Status",
          headerClassName: "w-[120px]",
          cell: (category) => <StatusBadge status={category.active ? "active" : "inactive"} />,
        },
      );
    }

    base.push({
      id: "actions",
      header: "Actions",
      headerClassName: "w-20 text-right",
      className: "w-20 text-right",
      cell: (category) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {viewTrash ? (
                <>
                  <DropdownMenuItem
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await restoreCategory(category.id);
                        toast.success("Category restored");
                        void list.reload();
                        void trashCount.reload();
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Could not restore",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <RotateCcw /> Restore
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setPermanentTargetId(category.id)}
                  >
                    <Trash2 /> Delete permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    render={<Link href={`/admin/categories/${category.id}/edit`} />}
                  >
                    <Pencil /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTrashTargetId(category.id)}>
                    <Trash2 /> Move to trash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    });

    return base;
  }, [list, viewTrash]);

  if (list.error) return <ErrorState description={list.error} onRetry={() => void list.reload()} />;

  return (
    <div className="admin-page-shell space-y-6">
      <PageHeader
        title={viewTrash ? "Category trash" : "Categories"}
        description={
          viewTrash
            ? `Items are permanently deleted after ${TRASH_RETENTION_DAYS} days in trash.`
            : undefined
        }
        actions={
          viewTrash ? (
            <Button variant="outline" render={<Link href="/admin/categories" />}>
              Back to categories
            </Button>
          ) : (
            <>
              <Button variant="outline" render={<Link href="/admin/categories?view=trash" />}>
                <Trash2 /> Trash{trashCount.data ? ` (${trashCount.data})` : ""}
              </Button>
              <Button render={<Link href="/admin/categories/new" />}>
                <Plus /> Add category
              </Button>
            </>
          )
        }
      />
      <div className="admin-table-panel">
        <div className="border-b border-[#e1e1e3] px-3 py-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={viewTrash ? "Search trash" : "Search and filter"}
            className="sm:w-80"
          />
        </div>
        <DataTable
          data={list.data ?? []}
          columns={columns}
          getRowId={(category) => category.id}
          selectable
          selectedIds={selection.selectedIds}
          onSelectionChange={selection.setSelectedIds}
          page={1}
          pageSize={list.data?.length || 1}
          total={list.data?.length ?? 0}
          onPageChange={() => undefined}
          isLoading={list.loading}
          emptyTitle={viewTrash ? "Trash is empty" : "No categories"}
          className="space-y-0"
          tableContainerClassName="rounded-none border-0 bg-white"
          paginationClassName="border-t border-[#e1e1e3] bg-white px-3 py-2"
          bulkActions={
            viewTrash ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await Promise.all(selection.selectedIds.map((id) => restoreCategory(id)));
                      toast.success("Restored selected categories");
                      selection.clear();
                      void list.reload();
                      void trashCount.reload();
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => setBulkPermanentOpen(true)}
                >
                  Delete permanently
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setBulkTrashOpen(true)}
              >
                Move to trash
              </Button>
            )
          }
        />
      </div>

      <DeleteDialog
        open={Boolean(trashTargetId)}
        onOpenChange={(openState) => !openState && setTrashTargetId(null)}
        title="Move category to trash"
        description={`This category will be hidden from your store and permanently deleted after ${TRASH_RETENTION_DAYS} days unless you restore it.`}
        confirmLabel="Move to trash"
        loading={busy}
        onConfirm={async () => {
          if (!trashTargetId) return;
          setBusy(true);
          try {
            await trashCategory(trashTargetId);
            toast.success("Moved to trash");
            setTrashTargetId(null);
            void list.reload();
            void trashCount.reload();
          } finally {
            setBusy(false);
          }
        }}
      />

      <DeleteDialog
        open={Boolean(permanentTargetId)}
        onOpenChange={(openState) => !openState && setPermanentTargetId(null)}
        title="Delete category permanently"
        description="This cannot be undone."
        loading={busy}
        onConfirm={async () => {
          if (!permanentTargetId) return;
          setBusy(true);
          try {
            await permanentlyDeleteCategory(permanentTargetId);
            toast.success("Category permanently deleted");
            setPermanentTargetId(null);
            void list.reload();
          } finally {
            setBusy(false);
          }
        }}
      />

      <DeleteDialog
        open={bulkTrashOpen}
        onOpenChange={setBulkTrashOpen}
        title="Move selected to trash"
        description={`${selection.selectedIds.length} categor${selection.selectedIds.length === 1 ? "y" : "ies"} will be permanently deleted after ${TRASH_RETENTION_DAYS} days unless restored.`}
        confirmLabel="Move to trash"
        loading={busy}
        onConfirm={async () => {
          if (!selection.selectedIds.length) return;
          setBusy(true);
          try {
            await trashCategories(selection.selectedIds);
            toast.success("Moved to trash");
            selection.clear();
            void list.reload();
            void trashCount.reload();
          } finally {
            setBusy(false);
            setBulkTrashOpen(false);
          }
        }}
      />

      <DeleteDialog
        open={bulkPermanentOpen}
        onOpenChange={setBulkPermanentOpen}
        title="Delete selected permanently"
        description="This cannot be undone."
        loading={busy}
        onConfirm={async () => {
          if (!selection.selectedIds.length) return;
          setBusy(true);
          try {
            await Promise.all(
              selection.selectedIds.map((id) => permanentlyDeleteCategory(id)),
            );
            toast.success("Permanently deleted");
            selection.clear();
            void list.reload();
          } finally {
            setBusy(false);
            setBulkPermanentOpen(false);
          }
        }}
      />
    </div>
  );
}
