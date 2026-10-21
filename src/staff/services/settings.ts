"use client";

import type { StoreSettings } from "@/types";

export async function getSettings(): Promise<StoreSettings> {
  const res = await fetch("/api/store/settings", { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to load settings");
  }
  const json = (await res.json()) as { data: StoreSettings };
  return json.data;
}

export async function saveSettings(next: StoreSettings): Promise<StoreSettings> {
  const res = await fetch("/api/store/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(next),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to save settings");
  }
  const json = (await res.json()) as { data: StoreSettings };
  return json.data;
}
