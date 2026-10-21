"use client";

import {
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  DataTable,
  type DataTableColumn,
  useSelection,
} from "@/components/shared/data-table";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
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
import { isProtectedCatalogProduct } from "@/lib/catalog-reserved";
import { replaceQuery } from "@/lib/query-url";
import { downloadAdminExport } from "@/lib/download-export";
import { TRASH_RETENTION_DAYS, trashDaysRemaining } from "@/lib/trash-retention";
import { listCategories } from "@/services/categories";
import {
  listProducts,
  permanentlyDeleteProduct,
  restoreProduct,
  setProductsStatus,
  trashProduct,
  trashProducts,
  countTrashProducts,
} from "@/services/products";
import { ADMIN_PRODUCT_TYPES, PRODUCT_TYPE_LABELS, PRODUCT_TYPES } from "@/types";
import type { Product, ProductStatus, ProductType } from "@/types";

function InventoryCell({ product }: { product: Product }) {
  const inventory = product.inventory;

  if (!inventory?.trackInventory) {
    return <span className="text-sm text-muted-foreground">Not tracked</span>;
  }

  const quantity = inventory.quantity ?? 0;
  const available = inventory.stockStatus === "in_stock" || inventory.allowBackorder;
  const availabilityLabel =
    quantity <= 0 && inventory.allowBackorder
      ? "Backorder"
      : available
        ? "In stock"
        : "Out of stock";

  return (
    <div className="flex flex-col leading-tight">
      <span className="font-medium tabular-nums">
        {quantity} {quantity === 1 ? "unit" : "units"}
      </span>
      <span
        className={
          available ? "mt-0.5 text-xs text-emerald-700" : "mt-0.5 text-xs text-destructive"
        }
      >
        {availabilityLabel}
      </span>
    </div>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewTrash = searchParams.get("view") === "trash";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const typeParam = searchParams.get("type");
  const type: ProductType | "all" =
    typeParam && PRODUCT_TYPES.includes(typeParam as ProductType)
      ? (typeParam as ProductType)
      : "all";
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [bulkTrashOpen, setBulkTrashOpen] = useState(false);
  const [bulkPermanentOpen, setBulkPermanentOpen] = useState(false);
  const [trashTargetId, setTrashTargetId] = useState<string | null>(null);
  const [permanentTargetId, setPermanentTargetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selection = useSelection();

  const categories = useAsyncData(() => listCategories());
  const list = useAsyncData(
    () =>
      listProducts({
        search,
        status: viewTrash ? "all" : status,
        type,
        categoryId,
        page,
        pageSize: 10,
        sortBy: sortBy as keyof Product,
        sortDir,
        trash: viewTrash,
        fulfillment: viewTrash ? "all" : "non_printify",
      }),
    `${viewTrash}:${search}:${status}:${type}:${categoryId}:${page}:${sortBy}:${sortDir}`,
  );
  const trashCount = useAsyncData(() => countTrashProducts(), "products-trash-count");

  const categoryName = useMemo(() => {
    const map = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [categories.data]);

  const columns: DataTableColumn<Product>[] = useMemo(() => {
    const base: DataTableColumn<Product>[] = [
      {
        id: "name",
        header: "Product",
        headerClassName: "w-[200px]",
        className: "max-w-0 overflow-hidden",
        cell: (row) => (
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={row.images[0] || "/images/catalog-placeholder.svg"}
              alt=""
              className="size-10 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1 overflow-hidden">
              {viewTrash ? (
                <span className="block truncate font-medium" title={row.name}>
                  {row.name}
                </span>
              ) : (
                <Link
                  href={`/admin/products/${row.slug}/edit`}
                  className="block truncate font-medium hover:underline"
                  title={row.name}
                >
                  {row.name}
                </Link>
              )}
            </div>
          </div>
        ),
      },
      {
        id: "sku",
        header: "SKU",
        headerClassName: "w-[125px]",
        cell: (row) => (
          <span className="block truncate text-muted-foreground" title={row.sku}>
            {row.sku || "—"}
          </span>
        ),
      },
    ];

    if (viewTrash) {
      base.push({
        id: "deletedAt",
        header: "Auto-delete",
        headerClassName: "w-[130px]",
        cell: (row) => (
          <span className="text-sm text-muted-foreground tabular-nums">
            {row.deletedAt
              ? `${trashDaysRemaining(row.deletedAt)} day${trashDaysRemaining(row.deletedAt) === 1 ? "" : "s"}`
              : "—"}
          </span>
        ),
      });
    } else {
      base.push(
        {
          id: "status",
          header: "Status",
          headerClassName: "w-[105px]",
          cell: (row) => (
            <StatusBadge status={row.status === "active" ? "published" : row.status} />
          ),
        },
        {
          id: "categoryId",
          header: "Category",
          headerClassName: "w-[180px]",
          className: "max-w-0 overflow-hidden",
          cell: (row) => (
            <span className="block truncate" title={categoryName(row.categoryId)}>
              {categoryName(row.categoryId)}
            </span>
          ),
        },
        {
          id: "type",
          header: "Product type",
          headerClassName: "w-[140px]",
          className: "max-w-0 overflow-hidden",
          cell: (row) => (
            <span className="block truncate" title={PRODUCT_TYPE_LABELS[row.type] ?? row.type}>
              {PRODUCT_TYPE_LABELS[row.type] ?? row.type}
            </span>
          ),
        },
        {
          id: "inventory",
          header: "Inventory",
          headerClassName: "w-[115px]",
          cell: (row) => <InventoryCell product={row} />,
        },
      );
    }

    base.push({
      id: "actions",
      header: "Actions",
      headerClassName: "w-16 text-right",
      className: "w-16 text-right",
      cell: (row) => {
        const protectedProduct = isProtectedCatalogProduct(row);
        return (
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
                          await restoreProduct(row.slug);
                          toast.success("Product restored");
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
                      disabled={protectedProduct}
                      onClick={() => {
                        if (protectedProduct) {
                          toast.error("This catalog product is protected");
                          return;
                        }
                        setPermanentTargetId(row.id);
                      }}
                    >
                      <Trash2 /> Delete permanently
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem render={<Link href={`/admin/products/${row.slug}/edit`} />}>
                      <Pencil /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={row.status === "active"}
                      onClick={() => void setRowStatus(row, "active", "Product published")}
                    >
                      Publish
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={row.status !== "active"}
                      onClick={() => void setRowStatus(row, "draft", "Product unpublished")}
                    >
                      Unpublish
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={row.status === "draft"}
                      onClick={() => void setRowStatus(row, "draft", "Marked as draft")}
                    >
                      Draft
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={protectedProduct}
                      onClick={() => {
                        if (protectedProduct) {
                          toast.error("This catalog product is protected and cannot be deleted");
                          return;
                        }
                        setTrashTargetId(row.id);
                      }}
                    >
                      <Trash2 /> Move to trash
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    });

    return base;
  }, [categoryName, list, viewTrash]);

  async function setRowStatus(row: Product, status: ProductStatus, message: string) {
    setBusy(true);
    try {
      await setProductsStatus([row.id], status);
      toast.success(message);
      void list.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  }

  async function runBulk(
    action: "publish" | "unpublish" | "draft" | "trash" | "restore" | "permanent",
  ) {
    setBusy(true);
    try {
      const ids =
        action === "trash" || action === "permanent"
          ? selection.selectedIds.filter((id) => {
              const row = list.data?.items.find((p) => p.id === id);
              return row ? !isProtectedCatalogProduct(row) : true;
            })
          : selection.selectedIds;
      if ((action === "trash" || action === "permanent") && !ids.length) {
        toast.error("Selected catalog products are protected and cannot be deleted");
        return;
      }
      if (action === "trash") {
        await trashProducts(ids);
        toast.success("Moved to trash");
      } else if (action === "permanent") {
        for (const id of ids) {
          const row = list.data?.items.find((p) => p.id === id);
          if (row) await permanentlyDeleteProduct(row.slug);
        }
        toast.success("Permanently deleted");
      } else if (action === "restore") {
        for (const id of ids) {
          const row = list.data?.items.find((p) => p.id === id);
          if (row) await restoreProduct(row.slug);
        }
        toast.success("Restored selected products");
      } else if (action === "publish") {
        await setProductsStatus(ids, "active");
        toast.success("Published selected products");
      } else if (action === "unpublish" || action === "draft") {
        await setProductsStatus(ids, "draft");
        toast.success(
          action === "unpublish" ? "Unpublished selected products" : "Marked selected as draft",
        );
      }
      selection.clear();
      void list.reload();
      void trashCount.reload();
    } finally {
      setBusy(false);
    }
  }

  if (list.error) return <ErrorState description={list.error} onRetry={() => void list.reload()} />;

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-3.5rem)] space-y-6 bg-[#f6f6f7] px-4 py-6 lg:-mx-6 lg:px-6">
      <PageHeader
        title={viewTrash ? "Product trash" : "Products"}
        description={
          viewTrash
            ? `Items are permanently deleted after ${TRASH_RETENTION_DAYS} days in trash.`
            : undefined
        }
        actions={
          <>
            {viewTrash ? (
              <Button
                variant="outline"
                size="sm"
                className="border-[#d1d1d4] bg-[#f1f1f1] hover:bg-[#e6e6e8]"
                render={<Link href="/admin/products" />}
              >
                Back to products
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#d1d1d4] bg-[#f1f1f1] hover:bg-[#e6e6e8]"
                  render={<Link href="/admin/products?view=trash" />}
                >
                  <Trash2 /> Trash{trashCount.data ? ` (${trashCount.data})` : ""}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#d1d1d4] bg-[#f1f1f1] hover:bg-[#e6e6e8]"
                  onClick={() => void downloadAdminExport("products").catch((error) => toast.error(error.message))}
                >
                  <Download /> Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#d1d1d4] bg-[#f1f1f1] hover:bg-[#e6e6e8]"
                  onClick={() => toast.info("Import is coming soon")}
                >
                  <Upload /> Import
                </Button>
                <Button render={<Link href="/admin/products/new" />}>
                  <Plus /> Add product
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="overflow-hidden rounded-xl border border-[#dedee1] bg-card shadow-sm">
        {!viewTrash ? (
          <div className="border-b border-[#e1e1e3] px-3 py-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <FilterDropdown
                value={status}
                onChange={(value) => {
                  setStatus(value as ProductStatus | "all");
                  setPage(1);
                }}
                placeholder="Status"
                className="min-w-20 border-0 bg-transparent px-2 font-medium hover:bg-[#f1f1f1] sm:w-20"
                options={[
                  { label: "All", value: "all" },
                  { label: "Published", value: "active" },
                  { label: "Draft", value: "draft" },
                  { label: "Archived", value: "archived" },
                ]}
              />
              <SearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Search and filter"
                className="sm:w-72"
              />
              <FilterDropdown
                value={type}
                onChange={(value) => {
                  setPage(1);
                  router.replace(replaceQuery(pathname, searchParams, { type: value }));
                }}
                placeholder="Type"
                className="border-[#d6d6d9] bg-card sm:w-36"
                options={[
                  { label: "All types", value: "all" },
                  ...ADMIN_PRODUCT_TYPES.map((item) => ({
                    label: PRODUCT_TYPE_LABELS[item],
                    value: item,
                  })),
                ]}
              />
              <FilterDropdown
                value={categoryId}
                onChange={(value) => {
                  setCategoryId(value);
                  setPage(1);
                }}
                placeholder="Category"
                className="border-[#d6d6d9] bg-card sm:w-40"
                options={[
                  { label: "All categories", value: "all" },
                  ...(categories.data ?? []).map((c) => ({ label: c.name, value: c.id })),
                ]}
              />
            </div>
          </div>
        ) : (
          <div className="border-b border-[#e1e1e3] px-3 py-2">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search trash"
              className="sm:w-72"
            />
          </div>
        )}

        <DataTable
          data={list.data?.items ?? []}
          columns={columns}
          getRowId={(row) => row.id}
          selectable
          selectedIds={selection.selectedIds}
          onSelectionChange={selection.setSelectedIds}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={(id, dir) => {
            setSortBy(id);
            setSortDir(dir);
          }}
          page={page}
          pageSize={10}
          total={list.data?.total ?? 0}
          onPageChange={setPage}
          isLoading={list.loading}
          emptyTitle={viewTrash ? "Trash is empty" : "No products"}
          className="space-y-0"
          tableContainerClassName="rounded-none border-0"
          paginationClassName="border-t border-[#e1e1e3] bg-card px-3 py-2"
          bulkActions={
            viewTrash ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void runBulk("restore")}
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
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void runBulk("publish")}
                >
                  Publish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void runBulk("unpublish")}
                >
                  Unpublish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void runBulk("draft")}
                >
                  Draft
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setBulkTrashOpen(true)}
                >
                  Move to trash
                </Button>
              </>
            )
          }
        />
      </div>

      <DeleteDialog
        open={Boolean(trashTargetId)}
        onOpenChange={(openState) => !openState && setTrashTargetId(null)}
        title="Move product to trash"
        description={`This product will be hidden from your store and permanently deleted after ${TRASH_RETENTION_DAYS} days unless you restore it.`}
        confirmLabel="Move to trash"
        loading={busy}
        onConfirm={async () => {
          if (!trashTargetId) return;
          const product = list.data?.items.find((row) => row.id === trashTargetId);
          if (!product) return;
          setBusy(true);
          try {
            await trashProduct(product.slug);
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
        title="Delete product permanently"
        description="This cannot be undone."
        loading={busy}
        onConfirm={async () => {
          if (!permanentTargetId) return;
          const product = list.data?.items.find((row) => row.id === permanentTargetId);
          if (!product) return;
          setBusy(true);
          try {
            await permanentlyDeleteProduct(product.slug);
            toast.success("Product permanently deleted");
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
        description={`${selection.selectedIds.length} product${selection.selectedIds.length === 1 ? "" : "s"} will be permanently deleted after ${TRASH_RETENTION_DAYS} days unless restored.`}
        confirmLabel="Move to trash"
        loading={busy}
        onConfirm={async () => {
          await runBulk("trash");
          setBulkTrashOpen(false);
        }}
      />

      <DeleteDialog
        open={bulkPermanentOpen}
        onOpenChange={setBulkPermanentOpen}
        title="Delete selected permanently"
        description="This cannot be undone."
        loading={busy}
        onConfirm={async () => {
          await runBulk("permanent");
          setBulkPermanentOpen(false);
        }}
      />
    </div>
  );
}
