"use client";

import { MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DeleteDialog } from "@/components/shared/delete-dialog";
import { DataTable, type DataTableColumn, useSelection } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FormField } from "@/components/shared/form-field";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAsyncData } from "@/hooks/use-async-data";
import { slugify } from "@/lib/format";
import { TRASH_RETENTION_DAYS, trashDaysRemaining } from "@/lib/trash-retention";
import {
  countTrashedBlogCategories,
  createBlogCategory,
  listBlogCategories,
  permanentlyDeleteBlogCategory,
  restoreBlogCategory,
  trashBlogCategory,
  updateBlogCategory,
  type BlogCategoryWithCount,
} from "@/services/blog-categories";

const empty = {
  name: "",
  slug: "",
  description: "",
};

export default function BlogCategoriesPage() {
  const searchParams = useSearchParams();
  const viewTrash = searchParams.get("view") === "trash";
  const list = useAsyncData(
    () => listBlogCategories({ trash: viewTrash }),
    `blog-categories:${viewTrash}`,
  );
  const [search, setSearch] = useState("");
  const trashCount = useAsyncData(() => countTrashedBlogCategories(), "blog-categories-trash-count");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogCategoryWithCount | null>(null);
  const [form, setForm] = useState(empty);
  const [trashTargetId, setTrashTargetId] = useState<string | null>(null);
  const [permanentTargetId, setPermanentTargetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selection = useSelection();
  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (list.data ?? []).filter(
      (category) =>
        !query ||
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query),
    );
  }, [list.data, search]);

  const columns: DataTableColumn<BlogCategoryWithCount>[] = useMemo(() => [
    {
      id: "name",
      header: "Category",
      headerClassName: "w-[320px]",
      cell: (category) => (
        <div className="min-w-0">
          {viewTrash ? (
            <span className="block truncate font-medium">{category.name}</span>
          ) : (
            <Link href={`/admin/blog/categories/${category.id}/edit`} className="block truncate font-medium hover:underline">
              {category.name}
            </Link>
          )}
          <p className="truncate text-xs text-muted-foreground">/{category.slug}</p>
        </div>
      ),
    },
    {
      id: "description",
      header: "Description",
      className: "max-w-0",
      cell: (category) => <span className="block truncate text-muted-foreground">{category.description || "—"}</span>,
    },
    viewTrash
      ? {
          id: "deletedAt",
          header: "Auto-delete",
          headerClassName: "w-[130px]",
          cell: (category) => <span className="tabular-nums text-muted-foreground">{category.deletedAt ? `${trashDaysRemaining(category.deletedAt)} days` : "—"}</span>,
        }
      : {
          id: "postCount",
          header: "Posts",
          headerClassName: "w-[100px]",
          cell: (category) => <span className="tabular-nums">{category.postCount}</span>,
        },
    {
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
                  <DropdownMenuItem onClick={async () => {
                    setBusy(true);
                    try { await restoreBlogCategory(category.id); toast.success("Category restored"); void list.reload(); void trashCount.reload(); }
                    catch (error) { toast.error(error instanceof Error ? error.message : "Could not restore"); }
                    finally { setBusy(false); }
                  }}><RotateCcw /> Restore</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setPermanentTargetId(category.id)}><Trash2 /> Delete permanently</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem render={<Link href={`/admin/blog/categories/${category.id}/edit`} />}><Pencil /> Edit</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTrashTargetId(category.id)}><Trash2 /> Move to trash</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [viewTrash, list, trashCount]);

  function startCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await updateBlogCategory(editing.id, form);
        toast.success("Category updated");
      } else {
        await createBlogCategory({
          ...form,
          slug: form.slug || slugify(form.name),
        });
        toast.success("Category created");
      }
      setOpen(false);
      void list.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  if (list.error) return <ErrorState description={list.error} onRetry={() => void list.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={viewTrash ? "Blog category trash" : "Blog categories"}
        description={
          viewTrash
            ? `Items are permanently deleted after ${TRASH_RETENTION_DAYS} days in trash.`
            : undefined
        }
        actions={
          viewTrash ? (
            <Button variant="outline" render={<Link href="/admin/blog/categories" />}>
              Back to categories
            </Button>
          ) : (
            <>
              <Button variant="outline" render={<Link href="/admin/blog/categories?view=trash" />}>
                <Trash2 /> Trash{trashCount.data ? ` (${trashCount.data})` : ""}
              </Button>
              <Button onClick={startCreate}>
                <Plus /> Add category
              </Button>
            </>
          )
        }
      />
      {list.loading && !list.data ? (
        <LoadingState />
      ) : (
        <div className="admin-table-panel">
          <div className="border-b border-[#e1e1e3] px-3 py-2">
            <SearchInput value={search} onChange={setSearch} placeholder={viewTrash ? "Search trash" : "Search and filter"} className="sm:w-80" />
          </div>
          <DataTable
            data={visibleCategories}
            columns={columns}
            getRowId={(category) => category.id}
            selectable
            selectedIds={selection.selectedIds}
            onSelectionChange={selection.setSelectedIds}
            page={1}
            pageSize={visibleCategories.length || 1}
            total={visibleCategories.length}
            onPageChange={() => undefined}
            isLoading={list.loading}
            emptyTitle={viewTrash ? "Trash is empty" : "No categories"}
            className="space-y-0"
            tableContainerClassName="rounded-none border-0 bg-white"
            paginationClassName="border-t border-[#e1e1e3] bg-white px-3 py-2"
          />
        </div>
      )}

      {!viewTrash ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <FormField label="Name" htmlFor="blog-cat-name">
                <Input
                  id="blog-cat-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      name: e.target.value,
                      slug: editing ? current.slug : slugify(e.target.value),
                    }))
                  }
                />
              </FormField>
              <FormField label="Slug" htmlFor="blog-cat-slug">
                <Input
                  id="blog-cat-slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, slug: slugify(e.target.value) }))
                  }
                />
              </FormField>
              <FormField label="Description" htmlFor="blog-cat-desc">
                <Textarea
                  id="blog-cat-desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, description: e.target.value }))
                  }
                />
              </FormField>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void save()} disabled={busy}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <DeleteDialog
        open={Boolean(trashTargetId)}
        onOpenChange={(openState) => !openState && setTrashTargetId(null)}
        title="Move category to trash"
        description={`This category will be hidden from your blog filters and permanently deleted after ${TRASH_RETENTION_DAYS} days unless you restore it.`}
        confirmLabel="Move to trash"
        loading={busy}
        onConfirm={async () => {
          if (!trashTargetId) return;
          setBusy(true);
          try {
            await trashBlogCategory(trashTargetId);
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
        description="Posts in this category will be reassigned to another category. This cannot be undone."
        loading={busy}
        onConfirm={async () => {
          if (!permanentTargetId) return;
          setBusy(true);
          try {
            await permanentlyDeleteBlogCategory(permanentTargetId);
            toast.success("Category permanently deleted");
            setPermanentTargetId(null);
            void list.reload();
            void trashCount.reload();
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
