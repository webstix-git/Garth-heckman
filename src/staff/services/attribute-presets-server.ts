import "server-only";

import { fetchAttributeOptionPresets } from "@/lib/catalog-settings-supabase";
import type { AttributeOptionPresets } from "@/lib/attribute-option-presets";

export async function getAttributeOptionPresets(): Promise<AttributeOptionPresets> {
  const result = await fetchAttributeOptionPresets();
  if (!result.ok) {
    throw new Error(result.error || "Failed to load attribute presets");
  }
  return result.presets;
}
