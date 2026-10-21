import "server-only";

import {
  deleteMediaAsset,
  listMediaAssets,
  uploadMediaAsset,
  resolveMediaLocations,
} from "@/lib/media-supabase";
import type { MediaAsset, MediaType, MediaUploadContext } from "@/types";

export async function listMedia(
  search?: string,
  type?: MediaType | "all",
): Promise<MediaAsset[]> {
  const result = await listMediaAssets({ search, type });
  if (!result.ok) {
    throw new Error(result.error || "Failed to load media");
  }
  return resolveMediaLocations(result.items);
}

function folderForContext(context?: MediaUploadContext | null): string {
  if (!context) return "library";
  if (context.module === "blog") return "blog";
  if (context.module === "product") return "products";
  if (context.module === "settings") {
    if (context.area === "logo") return "branding";
    if (context.area === "avatar") return "avatars";
    return "settings";
  }
  return "library";
}

function labelForContext(context?: MediaUploadContext | null): string | undefined {
  if (!context) return undefined;
  const parts = ["Dashboard"];
  if (context.module === "blog") {
    parts.push("Blog");
    if (context.entityTitle) parts.push(context.entityTitle);
    if (context.area === "featured") parts.push("Featured image");
    else if (context.area === "body") parts.push("Post body");
    else parts.push("Upload");
  } else if (context.module === "product") {
    parts.push("Products");
    if (context.entityTitle) parts.push(context.entityTitle);
    if (context.area === "cover") parts.push("Product image");
    else if (context.area === "gallery") parts.push("Product gallery");
    else if (context.area === "body") parts.push("Description");
    else parts.push("Upload");
  } else if (context.module === "media") {
    parts.push("Media", "Library");
  } else if (context.module === "settings") {
    parts.push("Settings");
    if (context.area === "logo") parts.push("Store logo");
    else if (context.area === "avatar") parts.push("Avatar");
  } else {
    parts.push("Media");
  }
  return parts.join(" › ");
}

function hrefForContext(context?: MediaUploadContext | null): string | undefined {
  if (!context?.entityId) return undefined;
  if (context.module === "blog") return `/admin/blog/${context.entityId}/edit`;
  if (context.module === "product") {
    return `/admin/products/${context.entityId}/edit`;
  }
  return undefined;
}

export async function createMediaFromFile(
  file: File,
  uploadedBy?: string | null,
  context?: MediaUploadContext | null,
): Promise<MediaAsset> {
  const folder = folderForContext(context);
  const locationLabel = labelForContext(context) || "Dashboard › Media › Library";
  const locationHref = hrefForContext(context);

  const result = await uploadMediaAsset(file, {
    folder,
    uploadedBy,
    metadata: {
      source: context?.module ? `${context.module}-upload` : "media-library",
      module: context?.module || "media",
      area: context?.area || "library",
      entityId: context?.entityId || null,
      entityTitle: context?.entityTitle || null,
      locationLabel,
      locationHref: locationHref || null,
    },
  });
  if (!result.ok || !result.asset) {
    throw new Error(result.error || "Upload failed");
  }
  return {
    ...result.asset,
    locationLabel,
    locationHref,
  };
}

export async function deleteMedia(id: string): Promise<void> {
  const result = await deleteMediaAsset(id);
  if (!result.ok) {
    throw new Error(result.error || "Delete failed");
  }
}
