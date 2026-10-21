"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createMedia } from "@/services/media";
import { cn } from "@/lib/utils";
import type { MediaAsset, MediaUploadContext } from "@/types";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[], assets?: MediaAsset[]) => void;
  max?: number;
  /** Max file size in bytes. Defaults to 20MB. */
  maxFileBytes?: number;
  className?: string;
  uploadContext?: MediaUploadContext;
}

const DEFAULT_MAX_FILE_BYTES = 20 * 1024 * 1024;

export function ImageUploader({
  value,
  onChange,
  max = 6,
  maxFileBytes = DEFAULT_MAX_FILE_BYTES,
  className,
  uploadContext,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const nextUrls = [...value];
      const nextAssets: MediaAsset[] = [];
      for (const file of Array.from(files)) {
        if (nextUrls.length >= max) break;
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > maxFileBytes) {
          const mb = Math.round(maxFileBytes / (1024 * 1024));
          toast.error(`${file.name} is too large. Max ${mb}MB per image.`);
          continue;
        }
        const asset = await createMedia(file, uploadContext);
        nextUrls.push(asset.url);
        nextAssets.push(asset);
      }
      onChange(nextUrls, nextAssets);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(
        /formdata/i.test(message)
          ? "Upload failed — try a smaller image (under 20MB)."
          : message,
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "grid gap-2",
          max === 1 ? "max-w-40 grid-cols-1" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
        )}
      >
        {value.map((url) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="size-full object-cover" />
            <Button
              type="button"
              size="icon-xs"
              variant="secondary"
              className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100"
              onClick={() => onChange(value.filter((item) => item !== url))}
              aria-label="Remove image"
            >
              <X />
            </Button>
          </div>
        ))}
        {value.length < max ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5" />
            )}
            <span className="text-xs">{uploading ? "Uploading…" : "Add image"}</span>
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => void addFiles(e.target.files)}
      />
    </div>
  );
}
