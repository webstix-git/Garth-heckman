"use client";

import { Copy, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
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
import { formatDate } from "@/lib/format";
import { replaceQuery } from "@/lib/query-url";
import { TRASH_RETENTION_DAYS, trashDaysRemaining } from "@/lib/trash-retention";
import {
  countTrashPosts,
  duplicatePost,
  listPosts,
  permanentlyDeletePost,
  restorePost,
  setPostStatus,
  trashPost,
} from "@/services/blog";
import { listBlogCategories } from "@/services/blog-categories";
import type { BlogPost, BlogPostStatus } from "@/types";

export default function BlogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewTrash = searchParams.get("view") === "trash";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BlogPostStatus | "all">("all");
  const category = searchParams.get("category") ?? "all";
  const tag = searchParams.get("tag") ?? "all";
  const [page, setPage] = useState(1);
  const [trashTargetId, setTrashTargetId] = useState<string | null>(null);
  const [permanentTargetId, setPermanentTargetId] = useState<string | null>(null);
  const [bulkTrashOpen, setBulkTrashOpen] = useState(false);
  const [bulkPermanentOpen, setBulkPermanentOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const selection = useSelection();

  const list = useAsyncData(
    () =>
      listPosts({
        search,
        status: viewTrash ? "all" : status,
        category,
        tag,
        page,
        pageSize: 10,
        trash: viewTrash,
      }),
    `${viewTrash}:${search}:${status}:${category}:${tag}:${page}`,
  );
  const trashCount = useAsyncData(() => countTrashPosts(), "blog-trash-count");
  const categories = useAsyncData(() => listBlogCategories(), "blog-category-filter");

  const columns: DataTableColumn<BlogPost>[] = useMemo(() => {
    const base: DataTableColumn<BlogPost>[] = [
      {
        id: "title",
        header: "Post",
        headerClassName: "w-[42%]",
        className: "whitespace-normal",
        cell: (row) => (
          <div className="flex min-w-0 items-center gap-3">
            {row.featuredImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.featuredImage}
                alt=""
                className="size-10 shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="size-10 shrink-0 rounded-md bg-muted" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              {viewTrash ? (
                <span className="block truncate font-medium">{row.title}</span>
              ) : (
                <Link
                  href={`/admin/blog/${row.id}/edit`}
                  className="block truncate font-medium hover:underline"
                >
                  {row.title}
                </Link>
              )}
              <p className="truncate text-xs text-muted-foreground">{row.excerpt}</p>
              <p className="mt-0.5 text-xs text-muted-foreground xl:hidden">{row.author}</p>
            </div>
          </div>
        ),
      },
      {
        id: "author",
        header: "Author",
        headerClassName: "hidden w-[14%] xl:table-cell",
        className: "hidden max-w-0 xl:table-cell",
        cell: (row) => <span className="block truncate">{row.author}</span>,
      },
      {
        id: "category",
        header: "Category",
        headerClassName: "w-[14%]",
        className: "max-w-0",
        cell: (row) => <span className="block truncate">{row.category}</span>,
      },
    ];

    if (viewTrash) {
      base.push({
        id: "deletedAt",
        header: "Auto-delete",
        headerClassName: "w-[120px]",
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
          headerClassName: "w-[12%]",
          cell: (row) => <StatusBadge status={row.status} />,
        },
        {
          id: "publishedAt",
          header: "Published",
          headerClassName: "w-[14%]",
          className: "max-w-0",
          cell: (row) => (
            <span className="block truncate text-muted-foreground">
              {row.publishedAt ? formatDate(row.publishedAt) : "—"}
            </span>
          ),
        },
      );
    }

    base.push({
      id: "actions",
      header: "Actions",
      headerClassName: "w-20 text-right",
      className: "w-20 text-right",
      cell: (row) => (
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
                        await restorePost(row.id);
                        toast.success("Post restored");
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
                    onClick={() => setPermanentTargetId(row.id)}
                  >
                    <Trash2 /> Delete permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem render={<Link href={`/admin/blog/${row.id}/edit`} />}>
                    <Pencil /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await duplicatePost(row.id);
                        toast.success("Post duplicated");
                        void list.reload();
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Could not duplicate",
                        );
                      }
                    }}
                  >
                    <Copy /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await setPostStatus(row.id, row.status === "published" ? "draft" : "published");
                      toast.success(row.status === "published" ? "Unpublished" : "Published");
                      void list.reload();
                    }}
                  >
                    {row.status === "published" ? "Unpublish" : "Publish"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTrashTargetId(row.id)}>
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
  }, [list, trashCount, viewTrash]);

  async function runBulk(action: "trash" | "restore" | "permanent") {
    setBusy(true);
    try {
      if (action === "trash") {
        await Promise.all(selection.selectedIds.map((id) => trashPost(id)));
        toast.success("Moved to trash");
      } else if (action === "restore") {
        await Promise.all(selection.selectedIds.map((id) => restorePost(id)));
        toast.success("Restored selected posts");
      } else {
        await Promise.all(selection.selectedIds.map((id) => permanentlyDeletePost(id)));
        toast.success("Permanently deleted");
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
    <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
      <PageHeader
        title={viewTrash ? "Blog trash" : "Blog"}
        description={
          viewTrash
            ? `Items are permanently deleted after ${TRASH_RETENTION_DAYS} days in trash.`
            : undefined
        }
        actions={
          viewTrash ? (
            <Button variant="outline" render={<Link href="/admin/blog" />}>
              Back to blog
            </Button>
          ) : (
            <>
              <Button variant="outline" render={<Link href="/admin/blog?view=trash" />}>
                <Trash2 /> Trash{trashCount.data ? ` (${trashCount.data})` : ""}
              </Button>
              <Button render={<Link href="/admin/blog/new" />}>
                <Plus /> New post
              </Button>
            </>
          )
        }
      />

      {!viewTrash ? (
        <div className="flex min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search posts…"
            className="w-full sm:max-w-xs"
          />
          <FilterDropdown
            value={status}
            onChange={(value) => {
              setStatus(value as BlogPostStatus | "all");
              setPage(1);
            }}
            options={[
              { label: "All statuses", value: "all" },
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" },
            ]}
          />
          <FilterDropdown
            value={category}
            onChange={(value) => {
              setPage(1);
              router.replace(replaceQuery(pathname, searchParams, { category: value }));
            }}
            options={[
              { label: "All categories", value: "all" },
              ...(categories.data ?? []).map((item) => ({ label: item.name, value: item.name })),
            ]}
          />
        </div>
      ) : (
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search trash"
          className="w-full sm:max-w-xs"
        />
      )}

      <DataTable
        className="min-w-0 max-w-full"
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
        emptyTitle={viewTrash ? "Trash is empty" : "No posts"}
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

      <DeleteDialog
        open={Boolean(trashTargetId)}
        onOpenChange={(open) => !open && setTrashTargetId(null)}
        title="Move post to trash"
        description={`This post will be hidden from your site and permanently deleted after ${TRASH_RETENTION_DAYS} days unless you restore it.`}
        confirmLabel="Move to trash"
        loading={busy}
        onConfirm={async () => {
          if (!trashTargetId) return;
          setBusy(true);
          try {
            await trashPost(trashTargetId);
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
        onOpenChange={(open) => !open && setPermanentTargetId(null)}
        title="Delete post permanently"
        description="This cannot be undone."
        loading={busy}
        onConfirm={async () => {
          if (!permanentTargetId) return;
          setBusy(true);
          try {
            await permanentlyDeletePost(permanentTargetId);
            toast.success("Post permanently deleted");
            setPermanentTargetId(null);
            void list.reload();
            void trashCount.reload();
          } finally {
            setBusy(false);
          }
        }}
      />

      <DeleteDialog
        open={bulkTrashOpen}
        onOpenChange={setBulkTrashOpen}
        title="Move selected to trash"
        description={`${selection.selectedIds.length} post${selection.selectedIds.length === 1 ? "" : "s"} will be permanently deleted after ${TRASH_RETENTION_DAYS} days unless restored.`}
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
