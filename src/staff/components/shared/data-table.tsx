"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (id: string, dir: "asc" | "desc") => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  bulkActions?: ReactNode;
  className?: string;
  tableClassName?: string;
  tableContainerClassName?: string;
  paginationClassName?: string;
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  selectable,
  selectedIds = [],
  onSelectionChange,
  sortBy,
  sortDir,
  onSortChange,
  page,
  pageSize,
  total,
  onPageChange,
  isLoading,
  emptyTitle = "No results",
  emptyDescription = "Try adjusting search or filters.",
  bulkActions,
  className,
  tableClassName,
  tableContainerClassName,
  paginationClassName,
}: DataTableProps<T>) {
  const ids = useMemo(() => data.map(getRowId), [data, getRowId]);
  const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));

  function toggleAll(checked: boolean) {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(Array.from(new Set([...selectedIds, ...ids])));
    } else {
      const drop = new Set(ids);
      onSelectionChange(selectedIds.filter((id) => !drop.has(id)));
    }
  }

  function toggleOne(id: string, checked: boolean) {
    if (!onSelectionChange) return;
    if (checked) onSelectionChange([...selectedIds, id]);
    else onSelectionChange(selectedIds.filter((item) => item !== id));
  }

  return (
    <div className={cn("min-w-0 space-y-3", className)}>
      {selectable && selectedIds.length > 0 && bulkActions ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{selectedIds.length} selected</span>
          {bulkActions}
        </div>
      ) : null}
      <div className={cn("min-w-0 overflow-x-auto rounded-xl border bg-card", tableContainerClassName)}>
        {isLoading ? (
          <TableSkeleton />
        ) : data.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} className="border-0" />
        ) : (
          <Table className={cn("min-w-[900px] table-fixed bg-card", tableClassName)}>
            <TableHeader>
              <TableRow className="bg-[#f6f6f7] hover:bg-[#f6f6f7] dark:bg-muted/50 dark:hover:bg-muted/50">
                {selectable ? (
                  <TableHead className="w-12 min-w-12 max-w-12 overflow-visible px-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => toggleAll(checked === true)}
                      aria-label="Select all rows"
                      className="size-4 border-muted-foreground/50 shadow-none"
                    />
                  </TableHead>
                ) : null}
                {columns.map((column) => (
                  <TableHead key={column.id} className={cn(column.headerClassName)}>
                    {column.sortable && onSortChange ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => {
                          const nextDir =
                            sortBy === column.id && sortDir === "asc" ? "desc" : "asc";
                          onSortChange(column.id, nextDir);
                        }}
                      >
                        {column.header}
                        {sortBy === column.id ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const id = getRowId(row);
                const selected = selectedIds.includes(id);
                return (
                  <TableRow
                    key={id}
                    data-state={selected ? "selected" : undefined}
                    className="bg-card transition-colors hover:bg-muted/35"
                  >
                    {selectable ? (
                      <TableCell className="w-12 min-w-12 max-w-12 overflow-visible px-3">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) => toggleOne(id, checked === true)}
                          aria-label={`Select row ${id}`}
                          className="size-4 border-muted-foreground/50 shadow-none"
                        />
                      </TableCell>
                    ) : null}
                    {columns.map((column) => (
                      <TableCell key={column.id} className={column.className}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        className={paginationClassName}
      />
    </div>
  );
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

export function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
      {children}
    </Button>
  );
}

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return { selectedIds, setSelectedIds, clear: () => setSelectedIds([]) };
}
