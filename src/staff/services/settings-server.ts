import "server-only";

import { fetchStoreSettings, saveStoreSettings } from "@/lib/settings-supabase";
import { getCurrentAdminStoreId } from "@/lib/current-admin-store";
import type { StoreSettings } from "@/types";

export async function getSettings(): Promise<StoreSettings> {
  const result = await fetchStoreSettings(await getCurrentAdminStoreId());
  if (!result.ok) {
    throw new Error(result.error || "Failed to load settings");
  }
  return result.settings;
}

export async function saveSettings(next: StoreSettings): Promise<StoreSettings> {
  if (!next?.email || typeof next.email !== "object") {
    throw new Error("Email settings are required");
  }
  const result = await saveStoreSettings(next);
  if (!result.ok || !result.settings) {
    throw new Error(result.error || "Failed to save settings");
  }
  return result.settings;
}
