import "server-only";

import { registerMediaAsset, STORE_MEDIA_BUCKET, ensureStoreMediaBucket } from "@/lib/media-supabase";
import { getCurrentAdminStoreId } from "@/lib/current-admin-store";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function uploadStoreLogo(file: File): Promise<{
  ok: boolean;
  url?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }

  const mime = file.type || "image/png";
  if (!mime.startsWith("image/")) {
    return { ok: false, error: "Please upload an image file" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Logo must be 5MB or smaller" };
  }

  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = await ensureStoreMediaBucket();
    const ext =
      mime === "image/png"
        ? "png"
        : mime === "image/webp"
          ? "webp"
          : mime === "image/gif"
            ? "gif"
            : mime === "image/svg+xml"
              ? "svg"
              : "jpg";
    const path = `${storeId}/branding/logo-${Date.now()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(STORE_MEDIA_BUCKET)
      .upload(path, bytes, {
        contentType: mime,
        upsert: true,
      });
    if (uploadError) {
      return { ok: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from(STORE_MEDIA_BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) {
      return { ok: false, error: "Upload succeeded but public URL was missing" };
    }

    // Register in Media library first so dashboard Media always lists uploads.
    const registered = await registerMediaAsset({
      storagePath: path,
      publicUrl: data.publicUrl,
      originalFileName: file.name || `logo.${ext}`,
      mimeType: mime,
      fileSize: file.size,
      title: "Store logo",
      metadata: { source: "store-logo" },
    }, storeId);
    if (!registered.ok) {
      return {
        ok: false,
        error: registered.error || "Uploaded but failed to add to Media library",
      };
    }

    // Persist logo URL into store_settings immediately so login can use it.
    const { data: existing } = await supabase
      .from("store_settings")
      .select("general, localization, notifications")
      .eq("store_id", storeId)
      .maybeSingle();

    const general = {
      ...((existing?.general as Record<string, unknown>) || {}),
      logoUrl: data.publicUrl,
    };

    await supabase.from("store_settings").upsert(
      {
        store_id: storeId,
        general,
        localization: existing?.localization ?? {},
        notifications: existing?.notifications ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_id" },
    );

    return { ok: true, url: data.publicUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Logo upload failed",
    };
  }
}
