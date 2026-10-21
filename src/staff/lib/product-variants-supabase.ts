import "server-only";

import {
  comboKey,
  comboMatchKey,
  comboTitle,
  optionValueSlug,
  resolveVariantOptions,
} from "@/lib/product-variant-matrix";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getStoreId } from "@/lib/store-id";
import type {
  ProductAttribute,
  ProductVariant,
  ProductVariantStatus,
} from "@/types";
import type { ProductType } from "@/types";

const GARTH_STORE_ID = getStoreId();

type Sb = ReturnType<typeof createSupabaseAdmin>;

type DbOption = {
  id: string;
  product_id: string;
  name: string;
  display_type: string;
  position: number;
};

type DbOptionValue = {
  id: string;
  product_option_id: string;
  value: string;
  display_label: string | null;
  hex: string | null;
  position: number;
};

type DbVariant = {
  id: string;
  store_id: string;
  product_id: string;
  title: string | null;
  sku: string;
  price_cents: number;
  compare_at_cents: number | null;
  inventory_qty: number;
  status: string;
  position: number;
  metadata: Record<string, unknown> | null;
};

function dollarsToCents(n: number) {
  return Math.round(Number(n || 0) * 100);
}

function centsToDollars(cents: number | null | undefined) {
  if (cents == null) return 0;
  return Math.round(cents) / 100;
}

function normalizeVariantStatus(value: string | null | undefined): ProductVariantStatus {
  if (value === "inactive" || value === "archived") return value;
  return "active";
}

function legacyOptionsFromVariant(
  v: ProductVariant,
  attributeNames: string[],
): Record<string, string> {
  return resolveVariantOptions(v, attributeNames);
}

export async function loadProductVariantMatrix(
  productId: string,
  storeId = GARTH_STORE_ID,
): Promise<{ attributes: ProductAttribute[]; variants: ProductVariant[] }> {
  const supabase = createSupabaseAdmin();

  const { data: optionRows } = await supabase
    .from("product_options")
    .select("id, product_id, name, display_type, position")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  const options = (optionRows || []) as DbOption[];
  if (!options.length) {
    return { attributes: [], variants: [] };
  }

  const optionIds = options.map((o) => o.id);
  const { data: valueRows } = await supabase
    .from("product_option_values")
    .select("id, product_option_id, value, display_label, hex, position")
    .in("product_option_id", optionIds)
    .order("position", { ascending: true });

  const values = (valueRows || []) as DbOptionValue[];
  const valuesByOption = new Map<string, DbOptionValue[]>();
  for (const row of values) {
    const list = valuesByOption.get(row.product_option_id) || [];
    list.push(row);
    valuesByOption.set(row.product_option_id, list);
  }

  const attributes: ProductAttribute[] = options.map((opt) => ({
    name: opt.name,
    values: (valuesByOption.get(opt.id) || []).map(
      (v) => v.display_label?.trim() || v.value,
    ),
  }));

  const { data: variantRows } = await supabase
    .from("product_variants")
    .select(
      "id, store_id, product_id, title, sku, price_cents, compare_at_cents, inventory_qty, status, position, metadata",
    )
    .eq("product_id", productId)
    .eq("store_id", storeId)
    .order("position", { ascending: true });

  const dbVariants = (variantRows || []) as DbVariant[];
  if (!dbVariants.length) {
    return { attributes, variants: [] };
  }

  const variantIds = dbVariants.map((v) => v.id);
  const { data: joinRows } = await supabase
    .from("product_variant_option_values")
    .select("variant_id, option_value_id")
    .in("variant_id", variantIds);

  const valueById = new Map(values.map((v) => [v.id, v]));
  const optionById = new Map(options.map((o) => [o.id, o]));

  const optionsByVariant = new Map<string, Record<string, string>>();
  for (const join of joinRows || []) {
    const value = valueById.get(join.option_value_id as string);
    if (!value) continue;
    const option = optionById.get(value.product_option_id);
    if (!option) continue;
    const current = optionsByVariant.get(join.variant_id as string) || {};
    current[option.name] = value.display_label?.trim() || value.value;
    optionsByVariant.set(join.variant_id as string, current);
  }

  const variants: ProductVariant[] = dbVariants.map((row) => {
    const optionsMap =
      optionsByVariant.get(row.id) ||
      (typeof row.metadata?.options === "object" && row.metadata.options
        ? (row.metadata.options as Record<string, string>)
        : {});
    const meta = row.metadata || {};
    return {
      id: row.id,
      sku: row.sku,
      options: optionsMap,
      size: optionsMap.Size || optionsMap.size,
      color: optionsMap.Color || optionsMap.color,
      price: centsToDollars(row.price_cents),
      compareAtPrice:
        row.compare_at_cents != null ? centsToDollars(row.compare_at_cents) : undefined,
      inventory: row.inventory_qty ?? 0,
      weightOz: typeof meta.weightOz === "number" ? meta.weightOz : undefined,
      image: typeof meta.image === "string" ? meta.image : undefined,
      status: normalizeVariantStatus(row.status),
      title: row.title || comboTitle(optionsMap) || undefined,
    };
  });

  return { attributes, variants };
}

async function clearProductMatrix(supabase: Sb, productId: string): Promise<void> {
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)
    .eq("store_id", GARTH_STORE_ID);

  const variantIds = ((variants || []) as { id: string }[]).map((v) => v.id);
  if (variantIds.length) {
    await supabase.from("product_variant_option_values").delete().in("variant_id", variantIds);
    await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId)
      .eq("store_id", GARTH_STORE_ID);
  }

  const { data: options } = await supabase
    .from("product_options")
    .select("id")
    .eq("product_id", productId);

  const optionIds = ((options || []) as { id: string }[]).map((o) => o.id);
  if (optionIds.length) {
    await supabase.from("product_option_values").delete().in("product_option_id", optionIds);
    await supabase.from("product_options").delete().eq("product_id", productId);
  }
}

/**
 * Replace the relational options/values/variants matrix for a product.
 * Uses service role. Dedupes variants by option combination.
 */
export async function syncProductVariantMatrix(input: {
  productId: string;
  type: ProductType;
  hasVariants?: boolean;
  baseSku: string;
  basePrice: number;
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseAdmin();
  const { productId, baseSku, basePrice } = input;

  try {
    if (!input.hasVariants) {
      await clearProductMatrix(supabase, productId);
      return { ok: true };
    }

    const attributes = (input.attributes || [])
      .map((attr) => ({
        name: attr.name.trim(),
        values: [...new Set((attr.values || []).map((v) => v.trim()).filter(Boolean))],
      }))
      .filter((attr) => attr.name && attr.values.length);

    const attributeNames = attributes.map((attr) => attr.name);
    const incoming = input.variants || [];
    const seenKeys = new Set<string>();
    const uniqueVariants: ProductVariant[] = [];
    for (const variant of incoming) {
      const options = legacyOptionsFromVariant(variant, attributeNames);
      if (!Object.keys(options).length) continue;
      const key = comboMatchKey(options);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      uniqueVariants.push({
        ...variant,
        options,
        size: options.Size || options.size || variant.size,
        color: options.Color || options.color || variant.color,
        status: normalizeVariantStatus(variant.status),
      });
    }

    await clearProductMatrix(supabase, productId);

    if (!attributes.length) {
      return { ok: true };
    }

    const optionIdByName = new Map<string, string>();
    const valueIdByOptionAndLabel = new Map<string, string>();
    const slugByOptionAndLabel = new Map<string, string>();

    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      const displayType =
        attr.name.toLowerCase() === "color" || attr.name.toLowerCase() === "colour"
          ? "swatch"
          : "button";
      const { data: optionRow, error: optionError } = await supabase
        .from("product_options")
        .insert({
          product_id: productId,
          name: attr.name,
          display_type: displayType,
          position: i,
        })
        .select("id")
        .single();
      if (optionError || !optionRow) {
        return { ok: false, error: optionError?.message || "Could not save option" };
      }
      optionIdByName.set(attr.name, optionRow.id as string);

      for (let j = 0; j < attr.values.length; j++) {
        const label = attr.values[j];
        const slug = optionValueSlug(label) || `value-${j + 1}`;
        const { data: valueRow, error: valueError } = await supabase
          .from("product_option_values")
          .insert({
            product_option_id: optionRow.id,
            value: slug,
            display_label: label,
            position: j,
          })
          .select("id")
          .single();
        if (valueError || !valueRow) {
          return { ok: false, error: valueError?.message || "Could not save option value" };
        }
        valueIdByOptionAndLabel.set(`${attr.name}::${label}`, valueRow.id as string);
        slugByOptionAndLabel.set(`${attr.name}::${label}`, slug);
      }
    }

    for (let i = 0; i < uniqueVariants.length; i++) {
      const variant = uniqueVariants[i];
      const options = variant.options;
      const title = variant.title || comboTitle(options);
      const sku =
        variant.sku?.trim() ||
        `${baseSku || "SKU"}-${Object.values(options)
          .map((v) => optionValueSlug(v).slice(0, 8).toUpperCase())
          .join("-")}`;
      const machineOptions: Record<string, string> = {};
      for (const [name, label] of Object.entries(options)) {
        machineOptions[name] = slugByOptionAndLabel.get(`${name}::${label}`) || optionValueSlug(label);
      }

      const { data: variantRow, error: variantError } = await supabase
        .from("product_variants")
        .insert({
          store_id: GARTH_STORE_ID,
          product_id: productId,
          title,
          sku,
          price_cents: dollarsToCents(variant.price ?? basePrice),
          compare_at_cents:
            variant.compareAtPrice != null && variant.compareAtPrice > 0
              ? dollarsToCents(variant.compareAtPrice)
              : null,
          inventory_qty: Math.max(0, Math.floor(Number(variant.inventory) || 0)),
          status: normalizeVariantStatus(variant.status),
          position: i,
          requires_shipping: true,
          metadata: {
            combo_key: comboKey(options),
            options,
            machineOptions,
            weightOz: variant.weightOz ?? null,
            image: variant.image || null,
          },
        })
        .select("id")
        .single();

      if (variantError || !variantRow) {
        return { ok: false, error: variantError?.message || "Could not save variant" };
      }

      const joins = Object.entries(options)
        .map(([name, label]) => {
          const optionValueId = valueIdByOptionAndLabel.get(`${name}::${label}`);
          if (!optionValueId) return null;
          return {
            variant_id: variantRow.id as string,
            option_value_id: optionValueId,
          };
        })
        .filter(
          (row): row is { variant_id: string; option_value_id: string } => row != null,
        );

      if (joins.length) {
        const { error: joinError } = await supabase
          .from("product_variant_option_values")
          .insert(joins);
        if (joinError) {
          return { ok: false, error: joinError.message };
        }
      }
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Variant sync failed",
    };
  }
}

/** Storefront-shaped options + variants for one or more products. */
export async function loadStorefrontVariantMatrices(
  productIds: string[],
  storeId = GARTH_STORE_ID,
): Promise<
  Map<
    string,
    {
      options: Array<{
        name: string;
        type: string;
        values: Array<{ label: string; value: string; hex?: string }>;
      }>;
      variants: Array<{
        id: string;
        sku: string;
        options: Record<string, string>;
        price: number;
        inventory: number;
        compareAt?: number | null;
        weightOz?: number;
        image?: string;
        status: string;
        printifyVariantId?: number;
      }>;
    }
  >
> {
  const result = new Map();
  if (!productIds.length) return result;

  const supabase = createSupabaseAdmin();
  const { data: optionRows } = await supabase
    .from("product_options")
    .select("id, product_id, name, display_type, position")
    .in("product_id", productIds)
    .order("position", { ascending: true });

  const options = (optionRows || []) as DbOption[];
  const optionIds = options.map((o) => o.id);

  const { data: valueRows } = optionIds.length
    ? await supabase
        .from("product_option_values")
        .select("id, product_option_id, value, display_label, hex, position")
        .in("product_option_id", optionIds)
        .order("position", { ascending: true })
    : { data: [] as DbOptionValue[] };

  const values = (valueRows || []) as DbOptionValue[];

  const { data: variantRows } = await supabase
    .from("product_variants")
    .select(
      "id, store_id, product_id, title, sku, price_cents, compare_at_cents, inventory_qty, status, position, metadata, printify_variant_id",
    )
    .in("product_id", productIds)
    .eq("store_id", storeId)
    .order("position", { ascending: true });

  const dbVariants = (variantRows || []) as (DbVariant & {
    printify_variant_id?: number | null;
  })[];
  const variantIds = dbVariants.map((v) => v.id);

  const { data: joinRows } = variantIds.length
    ? await supabase
        .from("product_variant_option_values")
        .select("variant_id, option_value_id")
        .in("variant_id", variantIds)
    : { data: [] as { variant_id: string; option_value_id: string }[] };

  const valuesByOption = new Map<string, DbOptionValue[]>();
  for (const row of values) {
    const list = valuesByOption.get(row.product_option_id) || [];
    list.push(row);
    valuesByOption.set(row.product_option_id, list);
  }

  const valueById = new Map(values.map((v) => [v.id, v]));
  const optionById = new Map(options.map((o) => [o.id, o]));
  const optionsByVariant = new Map<string, Record<string, string>>();

  for (const join of joinRows || []) {
    const value = valueById.get(join.option_value_id);
    if (!value) continue;
    const option = optionById.get(value.product_option_id);
    if (!option) continue;
    const current = optionsByVariant.get(join.variant_id) || {};
    // Storefront matches on machine `value`, not display label.
    current[option.name] = value.value;
    optionsByVariant.set(join.variant_id, current);
  }

  for (const productId of productIds) {
    const productOptions = options
      .filter((o) => o.product_id === productId)
      .map((opt) => ({
        name: opt.name,
        type: opt.display_type || "button",
        values: (valuesByOption.get(opt.id) || []).map((v) => ({
          label: v.display_label?.trim() || v.value,
          value: v.value,
          hex: v.hex || undefined,
        })),
      }));

    const productVariants = dbVariants
      .filter((v) => v.product_id === productId && v.status === "active")
      .map((row) => {
        const meta = row.metadata || {};
        let opts =
          optionsByVariant.get(row.id) ||
          (typeof meta.machineOptions === "object" && meta.machineOptions
            ? (meta.machineOptions as Record<string, string>)
            : {});
        // Fallback for variants saved without option-value joins (e.g. "Black / S").
        if (!Object.keys(opts).length && row.title && productOptions.length) {
          const parts = String(row.title)
            .split(/\s*\/\s*/)
            .map((part) => part.trim())
            .filter(Boolean);
          const fromTitle: Record<string, string> = {};
          productOptions.forEach((option, index) => {
            const wanted = parts[index];
            if (!wanted) return;
            const match = option.values.find(
              (value) =>
                value.value.toLowerCase() === wanted.toLowerCase() ||
                value.label.toLowerCase() === wanted.toLowerCase(),
            );
            if (match) fromTitle[option.name] = match.value;
          });
          if (Object.keys(fromTitle).length) opts = fromTitle;
        }
        return {
          id: row.id,
          sku: row.sku,
          options: opts,
          price: row.price_cents,
          inventory: row.inventory_qty ?? 0,
          compareAt: row.compare_at_cents,
          weightOz: typeof meta.weightOz === "number" ? meta.weightOz : undefined,
          image: typeof meta.image === "string" ? meta.image : undefined,
          status: row.status,
          printifyVariantId: row.printify_variant_id ?? undefined,
        };
      });

    result.set(productId, { options: productOptions, variants: productVariants });
  }

  return result;
}
