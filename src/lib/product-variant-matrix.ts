/** Shared helpers for WooCommerce-style product options → variant combinations. */

export type AttributeInput = {
  name: string;
  values: string[];
};

export type VariantCombo = Record<string, string>;

/** Case-insensitive key for matching combinations (deduping, generate). */
export function comboMatchKey(options: VariantCombo): string {
  const normalized = normalizeOptions(options);
  return Object.keys(normalized)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((name) => `${name.toLowerCase()}=${normalized[name].toLowerCase()}`)
    .join("|");
}

/** Stable key for a combination of option name → value (sorted). */
export function comboKey(options: VariantCombo): string {
  const normalized = normalizeOptions(options);
  return Object.keys(normalized)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => `${name}=${normalized[name]}`)
    .join("|");
}

export function optionValueSlug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

export function normalizeOptions(options: VariantCombo): VariantCombo {
  const out: VariantCombo = {};
  for (const [name, value] of Object.entries(options)) {
    const key = name.trim();
    const label = value.trim();
    if (key && label) out[key] = label;
  }
  return out;
}

/** Resolve display labels for a variant row (options map preferred, then legacy size/color). */
export function resolveVariantOptions(
  variant: {
    options?: VariantCombo;
    size?: string;
    color?: string;
  },
  attributeNames: string[],
): VariantCombo {
  const out =
    variant.options && Object.keys(variant.options).length
      ? normalizeOptions(variant.options)
      : {};

  const first = attributeNames[0]?.trim() || "Size";
  const second = attributeNames[1]?.trim() || "Color";

  if (!out[first] && variant.size?.trim()) out[first] = variant.size.trim();
  if (!out[second] && variant.color?.trim()) out[second] = variant.color.trim();

  if (!out.Size && variant.size?.trim()) out.Size = variant.size.trim();
  if (!out.Color && variant.color?.trim()) out.Color = variant.color.trim();

  return out;
}

/** Cartesian product of attributes → option maps using display labels as values. */
export function cartesianCombos(attributes: AttributeInput[]): VariantCombo[] {
  const seenNames = new Set<string>();
  const named = attributes
    .map((attr) => ({
      name: attr.name.trim(),
      values: [...new Set((attr.values || []).map((v) => v.trim()).filter(Boolean))],
    }))
    .filter((attr) => {
      if (!attr.name || !attr.values.length) return false;
      const key = attr.name.toLowerCase();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

  if (!named.length) return [];

  const combos = named.reduce<VariantCombo[]>((acc, attr) => {
    if (!acc.length) {
      return attr.values.map((value) => ({ [attr.name]: value }));
    }
    return acc.flatMap((combo) =>
      attr.values.map((value) => ({ ...combo, [attr.name]: value })),
    );
  }, []);

  const seenKeys = new Set<string>();
  return combos.filter((combo) => {
    const key = comboMatchKey(combo);
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
}

export function comboTitle(options: VariantCombo): string {
  return Object.keys(options)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => options[name])
    .join(" / ");
}

/** Map display labels → machine values for storefront matching. */
export function toMachineOptions(
  options: VariantCombo,
  labelToSlugByOption: Record<string, Record<string, string>>,
): VariantCombo {
  const out: VariantCombo = {};
  for (const [name, label] of Object.entries(options)) {
    out[name] = labelToSlugByOption[name]?.[label] ?? optionValueSlug(label);
  }
  return out;
}
