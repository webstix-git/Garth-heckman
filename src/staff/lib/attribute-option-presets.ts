import { MERCH_COLORS, MERCH_SIZES } from "@/lib/constants";

/** Preset attribute names → allowed values (maintained in code defaults + store_settings.catalog). */
export type AttributeOptionPresets = Record<string, string[]>;

export const DEFAULT_ATTRIBUTE_OPTION_PRESETS: AttributeOptionPresets = {
  Size: [...MERCH_SIZES],
  Color: [...MERCH_COLORS],
};

export function listPresetAttributeNames(presets: AttributeOptionPresets): string[] {
  return Object.keys(presets);
}

export function findPresetKey(presets: AttributeOptionPresets, name: string): string | undefined {
  const needle = name.trim().toLowerCase();
  return Object.keys(presets).find((key) => key.toLowerCase() === needle);
}

export function getPresetValues(presets: AttributeOptionPresets, name: string): string[] {
  const key = findPresetKey(presets, name);
  return key ? [...presets[key]] : [];
}

/** Merge DB overrides onto code defaults (DB wins per attribute name). */
export function normalizeAttributeOptionPresets(raw: unknown): AttributeOptionPresets {
  const merged: AttributeOptionPresets = {};
  for (const [name, values] of Object.entries(DEFAULT_ATTRIBUTE_OPTION_PRESETS)) {
    merged[name] = [...values];
  }

  if (!raw || typeof raw !== "object") return merged;

  const record = raw as Record<string, unknown>;
  const fromDb = record.attributePresets;
  if (!fromDb || typeof fromDb !== "object") return merged;

  for (const [name, values] of Object.entries(fromDb as Record<string, unknown>)) {
    if (!Array.isArray(values)) continue;
    const cleaned = values
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);
    if (cleaned.length) merged[name] = cleaned;
  }

  return merged;
}

export function mergePresetAndSelectedValues(
  presets: AttributeOptionPresets,
  attributeName: string,
  selected: string[],
): string[] {
  const preset = getPresetValues(presets, attributeName);
  const extras = selected.map((value) => value.trim()).filter(Boolean);
  return [...new Set([...preset, ...extras])];
}
