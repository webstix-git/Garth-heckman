import "server-only";

import {
  DEFAULT_ATTRIBUTE_OPTION_PRESETS,
  normalizeAttributeOptionPresets,
  type AttributeOptionPresets,
} from "@/lib/attribute-option-presets";
import { GARTH_STORE_ID } from "@/lib/products-supabase";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function fetchAttributeOptionPresets(): Promise<{
  ok: boolean;
  presets: AttributeOptionPresets;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      presets: structuredClone(DEFAULT_ATTRIBUTE_OPTION_PRESETS),
      error: "Database is not configured",
    };
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_settings")
      .select("catalog")
      .eq("store_id", GARTH_STORE_ID)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        presets: structuredClone(DEFAULT_ATTRIBUTE_OPTION_PRESETS),
        error: error.message,
      };
    }

    return {
      ok: true,
      presets: normalizeAttributeOptionPresets(data?.catalog ?? null),
    };
  } catch (err) {
    return {
      ok: false,
      presets: structuredClone(DEFAULT_ATTRIBUTE_OPTION_PRESETS),
      error: err instanceof Error ? err.message : "Failed to load attribute presets",
    };
  }
}
