import "server-only";

import type { MediaAsset, MediaType } from "@/types";
import { LEGACY_GARTH_STORE_UUID } from "@/lib/store-id";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentAdminStoreId } from "@/lib/current-admin-store";

const BUCKET = "store-media";
const MAX_BYTES = 10 * 1024 * 1024;

type DbMedia = {
  id: string;
  store_id: string;
  file_name: string;
  original_file_name: string | null;
  storage_bucket: string;
  storage_path: string;
  public_url: string | null;
  mime_type: string;
  media_type: string;
  file_size: number;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function belongsToStore(row: Pick<DbMedia, "store_id" | "storage_path">, storeId: string) {
  if (row.store_id !== storeId) return false;
  // Storage paths are `{storeId}/...`. The legacy UUID prefix is accepted only
  // for Garth's migrated files, never as a cross-store fallback.
  if (
    row.storage_path &&
    !row.storage_path.startsWith(`${storeId}/`) &&
    !(storeId === "0001" && row.storage_path.startsWith(`${LEGACY_GARTH_STORE_UUID}/`))
  ) {
    return false;
  }
  return true;
}

export async function ensureStoreMediaBucket() {
  const supabase = createSupabaseAdmin();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets || []).some((b) => b.name === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "video/mp4",
        "video/webm",
        "application/pdf",
      ],
    });
  }
  return supabase;
}

function mediaTypeFromMime(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime === "application/pdf" ||
    mime.includes("document") ||
    mime.includes("msword") ||
    mime.includes("officedocument")
  ) {
    return "document";
  }
  return "file";
}

function toUiType(dbType: string): MediaType {
  if (dbType === "image" || dbType === "video" || dbType === "document") return dbType;
  return "document";
}

function normalizePublicUrl(url: string | null | undefined, storeId: string): string {
  if (!url) return "";
  if (storeId !== "0001") return url;
  return url.replace(
    `/store-media/${LEGACY_GARTH_STORE_UUID}/`,
    `/store-media/${storeId}/`,
  );
}

function normalizeStoragePath(path: string | null | undefined, storeId: string): string {
  if (!path) return "";
  if (storeId === "0001" && path.startsWith(`${LEGACY_GARTH_STORE_UUID}/`)) {
    return `${storeId}/${path.slice(LEGACY_GARTH_STORE_UUID.length + 1)}`;
  }
  return path;
}

function mapRow(row: DbMedia, storeId: string): MediaAsset {
  const meta = row.metadata || {};
  const locationLabel =
    typeof meta.locationLabel === "string" ? meta.locationLabel : undefined;
  const locationHref =
    typeof meta.locationHref === "string" ? meta.locationHref : undefined;

  return {
    id: row.id,
    name: row.original_file_name || row.file_name,
    url: normalizePublicUrl(row.public_url, storeId),
    type: toUiType(row.media_type),
    mimeType: row.mime_type,
    size: Number(row.file_size || 0),
    createdAt: row.created_at,
    storeId: row.store_id,
    storageBucket: row.storage_bucket,
    storagePath: normalizeStoragePath(row.storage_path, storeId),
    fileName: row.file_name,
    originalFileName: row.original_file_name,
    metadata: row.metadata,
    locationLabel,
    locationHref,
  };
}

function extensionForMime(mime: string, originalName: string) {
  const fromName = originalName.includes(".")
    ? originalName.split(".").pop()?.toLowerCase()
    : "";
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/webm") return "webm";
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/jpeg") return "jpg";
  return "bin";
}

function safeFileStem(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "file"
  );
}

const MEDIA_SELECT =
  "id, store_id, file_name, original_file_name, storage_bucket, storage_path, public_url, mime_type, media_type, file_size, created_at, metadata";

/**
 * Index storage objects that exist under this store but have no `media` row.
 * Keeps the Media page in sync when logo/avatar/other uploads wrote files only.
 */
export async function syncStoreStorageIntoMedia(requestedStoreId?: string): Promise<{
  ok: boolean;
  added: number;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, added: 0, error: "Database is not configured" };
  }

  const storeId = requestedStoreId ?? (await getCurrentAdminStoreId());

  try {
    const supabase = await ensureStoreMediaBucket();
    const { data: existing, error: existingError } = await supabase
      .from("media")
      .select("storage_path")
      .eq("store_id", storeId);

    if (existingError) {
      return { ok: false, added: 0, error: existingError.message };
    }

    const known = new Set(
      ((existing || []) as { storage_path: string }[])
        .map((row) => row.storage_path)
        .filter(Boolean),
    );

    const { data: topLevel, error: listError } = await supabase.storage
      .from(BUCKET)
      .list(storeId, { limit: 100 });

    if (listError) {
      return { ok: false, added: 0, error: listError.message };
    }

    type StorageEntry = {
      id?: string | null;
      name: string;
      metadata?: { size?: number; mimetype?: string } | null;
    };

    const orphans: {
      storagePath: string;
      originalFileName: string;
      mimeType: string;
      fileSize: number;
      title: string;
      metadata: Record<string, unknown>;
    }[] = [];

    for (const entry of (topLevel || []) as StorageEntry[]) {
      // Folder (no object id) — list one level deep (library, branding, avatars, …).
      if (!entry.id) {
        const folder = entry.name;
        const { data: files } = await supabase.storage
          .from(BUCKET)
          .list(`${storeId}/${folder}`, { limit: 200 });

        for (const file of (files || []) as StorageEntry[]) {
          if (!file.id || !file.name || file.name.endsWith("/")) continue;
          const storagePath = `${storeId}/${folder}/${file.name}`;
          if (known.has(storagePath)) continue;
          const mime =
            file.metadata?.mimetype ||
            (/\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)
              ? "image/jpeg"
              : "application/octet-stream");
          orphans.push({
            storagePath,
            originalFileName: file.name,
            mimeType: mime,
            fileSize: Number(file.metadata?.size || 0),
            title: file.name,
            metadata: { source: "storage-sync", folder },
          });
        }
        continue;
      }

      // Rare: file directly under storeId/
      if (!entry.name || entry.name.endsWith("/")) continue;
      const storagePath = `${storeId}/${entry.name}`;
      if (known.has(storagePath)) continue;
      const mime =
        entry.metadata?.mimetype ||
        (/\.(png|jpe?g|gif|webp|svg)$/i.test(entry.name)
          ? "image/jpeg"
          : "application/octet-stream");
      orphans.push({
        storagePath,
        originalFileName: entry.name,
        mimeType: mime,
        fileSize: Number(entry.metadata?.size || 0),
        title: entry.name,
        metadata: { source: "storage-sync", folder: "root" },
      });
    }

    let added = 0;
    for (const orphan of orphans) {
      const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(orphan.storagePath);
      if (!publicData?.publicUrl) continue;

      const registered = await registerMediaAsset({
        storagePath: orphan.storagePath,
        publicUrl: publicData.publicUrl,
        originalFileName: orphan.originalFileName,
        mimeType: orphan.mimeType,
        fileSize: orphan.fileSize,
        title: orphan.title,
        metadata: orphan.metadata,
      }, storeId);
      if (registered.ok) added += 1;
    }

    return { ok: true, added };
  } catch (err) {
    return {
      ok: false,
      added: 0,
      error: err instanceof Error ? err.message : "Failed to sync storage media",
    };
  }
}

export async function listMediaAssets(options?: {
  search?: string;
  type?: MediaType | "all";
  limit?: number;
}): Promise<{ ok: boolean; items: MediaAsset[]; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, items: [], error: "Database is not configured" };
  }
  const storeId = await getCurrentAdminStoreId();
  try {
    // Best-effort: pick up files that landed in storage without a media row.
    await syncStoreStorageIntoMedia(storeId);

    const supabase = createSupabaseAdmin();
    let query = supabase
      .from("media")
      .select(MEDIA_SELECT)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (options?.type && options.type !== "all") {
      query = query.eq("media_type", options.type);
    }
    if (options?.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) return { ok: false, items: [], error: error.message };

    const search = options?.search?.trim().toLowerCase();
    const items = ((data || []) as DbMedia[])
      .filter((row) => belongsToStore(row, storeId))
      .map((row) => mapRow(row, storeId))
      .filter((item) => {
        if (!search) return true;
        return `${item.name} ${item.mimeType}`.toLowerCase().includes(search);
      });

    return { ok: true, items };
  } catch (err) {
    return {
      ok: false,
      items: [],
      error: err instanceof Error ? err.message : "Failed to load media",
    };
  }
}

export async function countMediaAssets(): Promise<{
  ok: boolean;
  count: number;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, count: 0, error: "Database is not configured" };
  }
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const { count, error } = await supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId);

    if (error) return { ok: false, count: 0, error: error.message };
    return { ok: true, count: count ?? 0 };
  } catch (err) {
    return {
      ok: false,
      count: 0,
      error: err instanceof Error ? err.message : "Failed to count media",
    };
  }
}

export async function uploadMediaAsset(
  file: File,
  options?: {
    folder?: string;
    uploadedBy?: string | null;
    title?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{ ok: boolean; asset?: MediaAsset; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File must be 10MB or smaller" };
  }

  const storeId = await getCurrentAdminStoreId();
  const mime = file.type || "application/octet-stream";
  const originalName = file.name || "upload";
  const ext = extensionForMime(mime, originalName);
  const folder = (options?.folder || "library").replace(/^\/+|\/+$/g, "");
  // Short path: 0001/library/<base36time>-name.ext (no long UUID)
  const stamp = Date.now().toString(36);
  const path = `${storeId}/${folder}/${stamp}-${safeFileStem(originalName)}.${ext}`;

  try {
    const supabase = await ensureStoreMediaBucket();
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (uploadError) {
      return { ok: false, error: uploadError.message };
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) {
      return { ok: false, error: "Upload succeeded but public URL was missing" };
    }

    const mediaType = mediaTypeFromMime(mime);
    const { data, error } = await supabase
      .from("media")
      .insert({
        store_id: storeId,
        uploaded_by: options?.uploadedBy || null,
        file_name: path.split("/").pop() || originalName,
        original_file_name: originalName,
        storage_bucket: BUCKET,
        storage_path: path,
        public_url: publicUrl,
        mime_type: mime,
        media_type: mediaType,
        file_size: file.size,
        title: options?.title || originalName,
        is_public: true,
        metadata: {
          ...(options?.metadata || {}),
          storeId,
          scope: "store",
        },
      })
      .select(MEDIA_SELECT)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message || "Failed to save media record" };
    }

    const row = data as DbMedia;
    if (!belongsToStore(row, storeId)) {
      return { ok: false, error: "Media was saved to the wrong store" };
    }

    return { ok: true, asset: mapRow(row, storeId) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}

/** Register an already-uploaded storage object in this store's media library only. */
export async function registerMediaAsset(input: {
  storagePath: string;
  publicUrl: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: string | null;
  title?: string;
  metadata?: Record<string, unknown>;
}, requestedStoreId?: string): Promise<{ ok: boolean; asset?: MediaAsset; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }

  const storeId = requestedStoreId ?? (await getCurrentAdminStoreId());
  if (!input.storagePath.startsWith(`${storeId}/`)) {
    return {
      ok: false,
      error: "Storage path must belong to this store",
    };
  }

  try {
    const supabase = createSupabaseAdmin();
    const mediaType = mediaTypeFromMime(input.mimeType);
    const { data, error } = await supabase
      .from("media")
      .insert({
        store_id: storeId,
        uploaded_by: input.uploadedBy || null,
        file_name: input.storagePath.split("/").pop() || input.originalFileName,
        original_file_name: input.originalFileName,
        storage_bucket: BUCKET,
        storage_path: input.storagePath,
        public_url: input.publicUrl,
        mime_type: input.mimeType,
        media_type: mediaType,
        file_size: input.fileSize,
        title: input.title || input.originalFileName,
        is_public: true,
        metadata: {
          ...(input.metadata || {}),
          storeId,
          scope: "store",
        },
      })
      .select(MEDIA_SELECT)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message || "Failed to register media" };
    }

    const row = data as DbMedia;
    if (!belongsToStore(row, storeId)) {
      return { ok: false, error: "Media was registered to the wrong store" };
    }

    return { ok: true, asset: mapRow(row, storeId) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to register media",
    };
  }
}

export async function deleteMediaAsset(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  const storeId = await getCurrentAdminStoreId();
  try {
    const supabase = createSupabaseAdmin();
    const { data: row, error: loadError } = await supabase
      .from("media")
      .select("id, store_id, storage_bucket, storage_path")
      .eq("store_id", storeId)
      .eq("id", id)
      .maybeSingle();

    if (loadError) return { ok: false, error: loadError.message };
    if (!row || !belongsToStore(row as DbMedia, storeId)) {
      return { ok: false, error: "Media not found for this store" };
    }

    // Only remove objects under this store's folder.
    if (row.storage_path?.startsWith(`${storeId}/`)) {
      await supabase.storage
        .from(row.storage_bucket || BUCKET)
        .remove([row.storage_path]);
    }

    const { error } = await supabase
      .from("media")
      .delete()
      .eq("store_id", storeId)
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete media",
    };
  }
}

/**
 * Attach exact dashboard usage paths (Blog / Products) by matching public URLs.
 * Upload metadata wins when present; otherwise scan blog + product content.
 */
export async function resolveMediaLocations(
  items: MediaAsset[],
): Promise<MediaAsset[]> {
  if (!items.length || !isSupabaseConfigured()) return items;

  const storeId = await getCurrentAdminStoreId();
  const supabase = createSupabaseAdmin();

  const [{ data: blogs }, { data: products }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("id, title, featured_image, content")
      .eq("store_id", storeId)
      .limit(500),
    supabase
      .from("products")
      .select("id, slug, name, description, metadata")
      .eq("store_id", storeId)
      .limit(500),
  ]);

  type Usage = { label: string; href?: string };
  const byUrl = new Map<string, Usage>();

  for (const post of blogs || []) {
    const title = post.title || "Untitled post";
    const href = `/admin/blog/${post.id}/edit`;
    if (post.featured_image) {
      byUrl.set(post.featured_image, {
        label: `Dashboard › Blog › ${title} › Featured image`,
        href,
      });
    }
    const content = post.content || "";
    if (content.includes("http")) {
      for (const item of items) {
        if (!item.url) continue;
        if (content.includes(item.url) && !byUrl.has(item.url)) {
          byUrl.set(item.url, {
            label: `Dashboard › Blog › ${title} › Post body`,
            href,
          });
        }
      }
    }
  }

  for (const product of products || []) {
    const name = product.name || "Untitled product";
    const href = `/admin/products/${product.slug || product.id}/edit`;
    const images = Array.isArray(product.metadata?.images)
      ? (product.metadata.images as unknown[]).filter((u): u is string => typeof u === "string")
      : [];
    for (const url of images) {
      if (!byUrl.has(url)) {
        byUrl.set(url, {
          label: `Dashboard › Products › ${name} › Product images`,
          href,
        });
      }
    }
    const description = product.description || "";
    for (const item of items) {
      if (!item.url) continue;
      if (description.includes(item.url) && !byUrl.has(item.url)) {
        byUrl.set(item.url, {
          label: `Dashboard › Products › ${name} › Description`,
          href,
        });
      }
    }
  }

  return items.map((item) => {
    if (item.locationLabel) return item;
    const metaLabel =
      item.metadata && typeof item.metadata.locationLabel === "string"
        ? item.metadata.locationLabel
        : null;
    const metaHref =
      item.metadata && typeof item.metadata.locationHref === "string"
        ? item.metadata.locationHref
        : undefined;
    if (metaLabel) {
      return { ...item, locationLabel: metaLabel, locationHref: metaHref || item.locationHref };
    }
    const usage = item.url ? byUrl.get(item.url) : undefined;
    if (usage) {
      return { ...item, locationLabel: usage.label, locationHref: usage.href };
    }
    // Fallback from storage folder only (no raw store id in label).
    const raw = (item.storagePath || "").replace(/^\/+|\/+$/g, "");
    const parts = raw.split("/").filter(Boolean);
    const withoutStore =
      parts.length >= 2 &&
      (parts[0] === storeId ||
        parts[0] === LEGACY_GARTH_STORE_UUID ||
        /^\d{4}$/.test(parts[0]) ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parts[0]))
        ? parts.slice(1)
        : parts;
    const folder = withoutStore[0];
    if (folder === "blog") {
      return { ...item, locationLabel: "Dashboard › Blog" };
    }
    if (folder === "products") {
      return { ...item, locationLabel: "Dashboard › Products" };
    }
    if (folder === "branding") {
      return { ...item, locationLabel: "Dashboard › Settings › Store logo" };
    }
    if (folder === "avatars") {
      return { ...item, locationLabel: "Dashboard › Settings › Avatar" };
    }
    return { ...item, locationLabel: "Dashboard › Media › Library" };
  });
}

export { BUCKET as STORE_MEDIA_BUCKET };
