"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAsyncData } from "@/hooks/use-async-data";
import { cn } from "@/lib/utils";
import { listMedia } from "@/services/media";
import type { MediaAsset } from "@/types";

interface ImagePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: MediaAsset) => void;
}

export function ImagePicker({ open, onOpenChange, onSelect }: ImagePickerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const list = useAsyncData(
    () => (open ? listMedia(search, "image") : Promise.resolve([])),
    `${open}:${search}`,
  );
  const assets = list.data ?? [];
  const current = assets.find((a) => a.id === selected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose image</DialogTitle>
          <DialogDescription>
            Select from the media library. Ready for S3 or Cloudinary later.
          </DialogDescription>
        </DialogHeader>
        <SearchInput value={search} onChange={setSearch} placeholder="Search media…" />
        {list.loading ? (
          <LoadingState />
        ) : assets.length === 0 ? (
          <EmptyState title="No images" description="Upload files from the Media page." />
        ) : (
          <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelected(asset.id)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg border focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  selected === asset.id && "ring-2 ring-ring",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.name} className="size-full object-cover" />
                {selected === asset.id ? (
                  <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!current}
            onClick={() => {
              if (!current) return;
              onSelect(current);
              onOpenChange(false);
            }}
          >
            Use image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
