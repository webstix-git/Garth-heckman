"use client";

import { Check, Copy, ExternalLink, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { DeleteDialog } from "@/components/shared/delete-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatDate, formatFileSize } from "@/lib/format";
import { createMedia, deleteMedia, listMedia } from "@/services/media";
import type { MediaAsset, MediaType } from "@/types";
import { cn } from "@/lib/utils";

function InfoRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[72px_1fr] items-start gap-2 border-b border-border/50 py-2 last:border-0">
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="flex min-w-0 items-start gap-1.5">
        <span
          className={cn(
            "min-w-0 flex-1 break-all text-xs leading-snug",
            mono && "font-mono text-[11px]",
          )}
          title={value}
        >
          {value}
        </span>
        {copyable ? (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="mt-[-2px] size-6 shrink-0"
            aria-label={`Copy ${label}`}
            onClick={async () => {
              await navigator.clipboard.writeText(value);
              toast.success(`${label} copied`);
            }}
          >
            <Copy className="size-3" />
          </Button>
        ) : null}
      </dd>
    </div>
  );
}

function MediaPreviewDialog({
  asset,
  open,
  onOpenChange,
  onDelete,
}: {
  asset: MediaAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}) {
  if (!asset) return null;

  const location =
    asset.locationLabel ||
    (typeof asset.metadata?.locationLabel === "string"
      ? asset.metadata.locationLabel
      : "Dashboard › Media › Library");
  const locationHref =
    asset.locationHref ||
    (typeof asset.metadata?.locationHref === "string"
      ? asset.metadata.locationHref
      : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(88vh,640px)] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-3 pr-12">
          <DialogTitle className="truncate text-sm">{asset.name}</DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-2 overflow-hidden">
          <div className="flex min-h-[220px] items-center justify-center bg-muted/80 sm:min-h-[280px]">
            {asset.type === "image" && asset.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset.url}
                alt={asset.name}
                className="max-h-[min(48vh,360px)] w-auto max-w-full object-contain p-3"
              />
            ) : asset.type === "video" && asset.url ? (
              <video
                src={asset.url}
                controls
                className="max-h-[min(48vh,360px)] w-full bg-black"
              />
            ) : (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                {asset.type} · no visual preview
              </div>
            )}
          </div>

          <div className="min-h-0 overflow-y-auto border-l">
            <dl className="px-3 py-1 sm:px-4">
              <div className="grid grid-cols-[72px_1fr] items-start gap-2 border-b border-border/50 py-2">
                <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Location
                </dt>
                <dd className="min-w-0 space-y-1.5">
                  <p className="break-words text-xs leading-snug">{location}</p>
                  {locationHref ? (
                    <Link
                      href={locationHref}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Open in dashboard <ExternalLink className="size-3" />
                    </Link>
                  ) : null}
                </dd>
              </div>
              <InfoRow label="Filename" value={asset.originalFileName || asset.name} copyable />
              <InfoRow label="Type" value={`${asset.type} · ${asset.mimeType}`} />
              <InfoRow
                label="Size / date"
                value={`${formatFileSize(asset.size)} · ${formatDate(asset.createdAt)}`}
              />
            </dl>
          </div>
        </div>

        <DialogFooter className="m-0 shrink-0 rounded-none border-t px-4 py-3 sm:justify-between">
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onDelete(asset.id);
            }}
          >
            <Trash2 /> Delete
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!asset.url) return;
                await navigator.clipboard.writeText(asset.url);
                toast.success("URL copied");
              }}
            >
              <Copy /> Copy URL
            </Button>
            <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MediaPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<MediaType | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const list = useAsyncData(() => listMedia(search, type), `${search}:${type}`);

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    try {
      for (const file of Array.from(files)) {
        await createMedia(file, { module: "media", area: "library" });
      }
      toast.success(files.length === 1 ? "Uploaded" : `${files.length} files uploaded`);
      void list.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  if (list.error) return <ErrorState description={list.error} onRetry={() => void list.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media"
        description="Files for this store only. Other stores cannot see these assets."
        actions={
          <Button onClick={() => inputRef.current?.click()}>
            <Upload /> Upload
          </Button>
        }
      />
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        multiple
        onChange={(e) => void onUpload(e.target.files)}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search files…" className="sm:max-w-xs" />
        <FilterDropdown
          value={type}
          onChange={(value) => setType(value as MediaType | "all")}
          options={[
            { label: "All types", value: "all" },
            { label: "Images", value: "image" },
            { label: "Video", value: "video" },
            { label: "Documents", value: "document" },
          ]}
        />
      </div>
      {list.loading ? (
        <LoadingState />
      ) : (list.data ?? []).length === 0 ? (
        <EmptyState
          title="No media for this store"
          description="Upload images or files for this dashboard. They stay private to this store."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {(list.data ?? []).map((asset) => {
            const isSelected = selected.includes(asset.id);
            return (
              <div
                key={asset.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border",
                  isSelected && "ring-2 ring-ring",
                )}
              >
                <button
                  type="button"
                  className="block aspect-square w-full bg-muted"
                  onClick={() => setPreview(asset)}
                >
                  {asset.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.url} alt={asset.name} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                      {asset.type}
                    </div>
                  )}
                </button>
                <div className="flex items-start justify-between gap-2 p-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{asset.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatFileSize(asset.size)} · {formatDate(asset.createdAt)}
                    </p>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      setSelected((current) =>
                        checked === true
                          ? [...current, asset.id]
                          : current.filter((id) => id !== asset.id),
                      )
                    }
                    aria-label={`Select ${asset.name}`}
                  />
                </div>
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100">
                  <Button
                    size="icon-xs"
                    variant="secondary"
                    aria-label="Copy URL"
                    onClick={async () => {
                      await navigator.clipboard.writeText(asset.url);
                      toast.success("URL copied");
                    }}
                  >
                    <Copy />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="secondary"
                    aria-label="Delete"
                    onClick={() => setDeleteId(asset.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                {isSelected ? (
                  <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <MediaPreviewDialog
        asset={preview}
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        onDelete={(id) => setDeleteId(id)}
      />

      <DeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete file"
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteMedia(deleteId);
          setDeleteId(null);
          setPreview(null);
          toast.success("Deleted");
          void list.reload();
        }}
      />
    </div>
  );
}
