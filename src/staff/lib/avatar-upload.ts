import "server-only";

import { registerMediaAsset, STORE_MEDIA_BUCKET, ensureStoreMediaBucket } from "@/lib/media-supabase";
import { getCurrentAdminStoreId } from "@/lib/current-admin-store";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function uploadAdminAvatar(
  file: File,
  userId: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }

  const mime = file.type || "image/png";
  if (!mime.startsWith("image/")) {
    return { ok: false, error: "Please upload an image file" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Photo must be 5MB or smaller" };
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
            : "jpg";
    const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 36) || "admin";
    const path = `${storeId}/avatars/${safeUser}-${Date.now()}.${ext}`;
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

    const registered = await registerMediaAsset({
      storagePath: path,
      publicUrl: data.publicUrl,
      originalFileName: file.name || `avatar.${ext}`,
      mimeType: mime,
      fileSize: file.size,
      uploadedBy: userId,
      title: "Profile photo",
      metadata: { source: "admin-avatar", userId },
    }, storeId);
    if (!registered.ok) {
      return {
        ok: false,
        error: registered.error || "Uploaded but failed to add to Media library",
      };
    }

    return { ok: true, url: data.publicUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Avatar upload failed",
    };
  }
}
