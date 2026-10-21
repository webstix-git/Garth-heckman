"use client";

import type { MediaAsset, MediaType, MediaUploadContext } from "@/types";

export async function listMedia(
  search?: string,
  type?: MediaType | "all",
): Promise<MediaAsset[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (type && type !== "all") params.set("type", type);
  const q = params.toString();
  const res = await fetch(`/api/store/media${q ? `?${q}` : ""}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to load media");
  }
  const json = (await res.json()) as { data: MediaAsset[] };
  return json.data;
}

export async function createMedia(
  file: File,
  context?: MediaUploadContext,
): Promise<MediaAsset> {
  const body = new FormData();
  body.append("file", file);
  if (context) {
    body.append("context", JSON.stringify(context));
  }
  const res = await fetch("/api/store/media", { method: "POST", body });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Upload failed");
  }
  const json = (await res.json()) as { data: MediaAsset };
  return json.data;
}

export async function deleteMedia(id: string): Promise<void> {
  const res = await fetch(`/api/store/media/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Delete failed");
  }
}
