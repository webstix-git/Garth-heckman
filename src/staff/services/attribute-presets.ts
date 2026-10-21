"use client";

import type { AttributeOptionPresets } from "@/lib/attribute-option-presets";

export async function getAttributeOptionPresets(): Promise<AttributeOptionPresets> {
  const res = await fetch("/api/store/attribute-presets", { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to load attribute presets");
  }
  const json = (await res.json()) as { data: AttributeOptionPresets };
  return json.data;
}
