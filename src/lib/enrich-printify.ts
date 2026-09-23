/**
 * Overlays live Printify catalog fields onto storefront Product records.
 * Title, description, media, prices, and size labels come from Printify.
 * Structural ids (slug, catalog variant ids) stay so cart + printify-map work.
 */
import "server-only";
import type { Product, ProductMedia, ProductOption, ProductVariant } from "@/lib/catalog";
import { getPrintifyProduct, type PrintifyProductDetail } from "@/lib/printify";

/** Site price = Printify selling price × this factor. */
export const PRINTIFY_PRICE_MARKUP = 1.2;

function markupCents(printifyPriceCents: number) {
  return Math.round(printifyPriceCents * PRINTIFY_PRICE_MARKUP);
}

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

/**
 * Printify short copy = prose before Disclaimer / .: specs.
 * Never character-truncate or add ellipsis — use what Printify wrote, complete.
 * Important: many blanks put prose as bare text and wrap only the ".: " specs in
 * <p>…</p>, so we must NOT prefer the first <p> blindly (that yields an empty short).
 */
function shortFromPrintify(html: string): string {
  const raw = (html || "").trim();
  if (!raw) return "";

  const stripSpecsAndNotes = (s: string) =>
    s
      .replace(/<p\b[^>]*>\s*\.:[\s\S]*?<\/p>/gi, "")
      .replace(/\.:[\s\S]*$/i, "")
      .replace(/<br\s*\/?>\s*<strong>\s*Disclaimer\s*<\/strong>[\s\S]*$/i, "")
      .replace(/<strong>\s*Disclaimer\s*<\/strong>[\s\S]*$/i, "")
      .replace(/<br\s*\/?>\s*<strong>\s*Please note:\s*<\/strong>[\s\S]*$/i, "")
      .replace(/<strong>\s*Please note:\s*<\/strong>[\s\S]*$/i, "");

  let chunk = stripSpecsAndNotes(raw);

  // Prefer a real prose <p> if one remains (not a specs-only block)
  const pMatch = chunk.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (pMatch && !/^\s*\.:/.test(pMatch[1])) {
    chunk = pMatch[1];
  }

  let short = stripHtml(chunk)
    .replace(/\n+/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

  // Last resort: plain text of everything before the first ".: " marker
  if (!short) {
    short = stripHtml(stripSpecsAndNotes(raw))
      .replace(/\n+/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  return short;
}

/** Use Printify HTML description as-is.
 * Spec lines ".: Material: white ceramic" → Details with real labels.
 * Unlabeled ".: Classic fit" → bullet list in Description (never numbered 1, 2, 3). */
function parseDescription(html: string): { short: string; long: string[]; details: Product["details"] } {
  const raw = (html || "").trim();
  if (!raw) return { short: "", long: [], details: [] };

  const details: Product["details"] = [];
  const bullets: string[] = [];
  const detailRe = /\.:\s*([^<\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = detailRe.exec(raw))) {
    const value = m[1].trim();
    if (!value) continue;
    const colon = value.indexOf(":");
    if (colon > 0 && colon < 40) {
      const label = value.slice(0, colon).trim();
      const rest = value.slice(colon + 1).trim();
      if (label && rest && !/^\d+$/.test(label)) {
        details.push({ label, value: rest });
        continue;
      }
    }
    bullets.push(value);
  }

  // Drop raw ".: …" markers, then strip the empty <p>/<br> shell they leave behind
  let body = raw
    .replace(/\.:\s*[^<\n]+/g, "")
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br>")
    .replace(/^(?:\s|<br\s*\/?>|&nbsp;)+/i, "")
    .replace(/(?:\s|<br\s*\/?>|&nbsp;)+$/i, "")
    .trim();

  if (bullets.length) {
    const lis = bullets.map((b) => `<li>${b}</li>`).join("");
    // No extra <br> before the list — empty tags above were causing the big gap
    body = body ? `${body}<ul>${lis}</ul>` : `<ul>${lis}</ul>`;
  }

  const long = body ? [body] : raw ? [raw] : [];
  const short = shortFromPrintify(raw);

  return { short, long, details };
}

function mediaFromPrintify(
  remote: PrintifyProductDetail,
  allowedVariantIds?: Set<number>,
): ProductMedia[] {
  const images = remote.images || [];
  if (!images.length) return [];
  const matched = allowedVariantIds?.size
    ? images.filter((img) => (img.variant_ids || []).some((id) => allowedVariantIds.has(id)))
    : images;
  const pool = matched.length ? matched : images;
  const sorted = [...pool].sort((a, b) => Number(b.is_default) - Number(a.is_default));
  const seen = new Set<string>();
  const out: ProductMedia[] = [];
  for (const img of sorted) {
    if (!img.src || seen.has(img.src)) continue;
    seen.add(img.src);
    out.push({
      kind: "printify",
      variant: img.is_default ? "light" : out.length % 2 ? "cool" : "default",
      ratio: "1-1",
      label: img.position ? img.position.replace(/_/g, " ") : `View ${out.length + 1}`,
      note: "",
      src: img.src,
    });
    if (out.length >= 12) break;
  }
  return out;
}

function optionLookup(remote: PrintifyProductDetail) {
  const byId = new Map<number, { group: string; title: string; hex?: string }>();
  for (const o of remote.options || []) {
    for (const v of o.values || []) {
      byId.set(v.id, {
        group: o.name,
        title: v.title,
        hex: v.colors?.[0],
      });
    }
  }
  return byId;
}

/** Keep only mapped variants that Printify still has enabled + available. */
function syncVariants(product: Product, remote: PrintifyProductDetail): ProductVariant[] {
  const byId = new Map(remote.variants.map((v) => [v.id, v]));
  if (!product.variants.length) return product.variants;

  return product.variants
    .map((v) => {
      const pid = v.printifyVariantId;
      if (pid == null) return null;
      const rv = byId.get(pid);
      if (!rv || !rv.is_enabled || !rv.is_available) return null;
      return {
        ...v,
        sku: rv.sku || v.sku, // real Printify variant SKU
        price: markupCents(rv.price),
        inventory: 999,
      };
    })
    .filter((v): v is ProductVariant => v != null);
}

/** Product-level SKU = Printify SKU of the primary / first offered variant. */
function printifyProductSku(product: Product, remote: PrintifyProductDetail, variants: ProductVariant[]): string {
  if (product.printifyVariantId != null) {
    const rv = remote.variants.find((v) => v.id === product.printifyVariantId);
    if (rv?.sku) return rv.sku;
  }
  if (variants[0]?.sku) return variants[0].sku;
  const firstEnabled = remote.variants.find((v) => v.is_enabled && v.is_available && v.sku);
  return firstEnabled?.sku || product.sku;
}

/**
 * Rebuild option labels from Printify for sizes/colors we still sell,
 * so site shows real Printify titles (e.g. 11oz not "11 oz").
 */
function syncOptions(
  product: Product,
  remote: PrintifyProductDetail,
  variants: ProductVariant[],
): ProductOption[] {
  if (!product.options.length || !variants.length) return product.options;

  const lookup = optionLookup(remote);
  const byPrintifyId = new Map(remote.variants.map((v) => [v.id, v]));

  return product.options.map((opt) => {
    const isSize = /size/i.test(opt.name);
    const isColor = /color/i.test(opt.name);
    if (!isSize && !isColor) return opt;

    const titles = new Map<string, { label: string; value: string; hex?: string }>();
    for (const v of variants) {
      const pid = v.printifyVariantId;
      if (pid == null) continue;
      const rv = byPrintifyId.get(pid);
      if (!rv?.options) continue;
      for (const oid of rv.options) {
        const info = lookup.get(oid);
        if (!info) continue;
        if (isSize && !/size/i.test(info.group)) continue;
        if (isColor && !/color/i.test(info.group)) continue;
        const value = isColor
          ? info.title.toLowerCase().replace(/\s+/g, "-")
          : info.title.toLowerCase().replace(/\s+/g, "");
        // Prefer existing catalog value keys when they match the Printify title loosely
        const existing = opt.values.find(
          (ov) =>
            ov.label.toLowerCase() === info.title.toLowerCase() ||
            ov.value.toLowerCase() === value ||
            ov.value.toLowerCase().replace(/\s+/g, "") === info.title.toLowerCase().replace(/\s+/g, ""),
        );
        const key = existing?.value || value;
        if (!titles.has(key)) {
          titles.set(key, {
            label: info.title, // exact Printify title
            value: existing?.value || value,
            hex: isColor ? info.hex || existing?.hex : undefined,
          });
        }
      }
    }

    if (!titles.size) return opt;

    // Preserve catalog order when possible
    const ordered: ProductOption["values"] = [];
    for (const ov of opt.values) {
      const hit = titles.get(ov.value);
      if (hit) {
        ordered.push({ label: hit.label, value: hit.value, ...(hit.hex ? { hex: hit.hex } : {}) });
        titles.delete(ov.value);
      }
    }
    for (const hit of titles.values()) {
      ordered.push({ label: hit.label, value: hit.value, ...(hit.hex ? { hex: hit.hex } : {}) });
    }

    // Remap variant option values to the synced keys
    return { ...opt, values: ordered };
  });
}

function remapVariantOptionKeys(
  variants: ProductVariant[],
  options: ProductOption[],
  remote: PrintifyProductDetail,
): ProductVariant[] {
  const lookup = optionLookup(remote);
  const byPrintifyId = new Map(remote.variants.map((v) => [v.id, v]));

  return variants.map((v) => {
    const pid = v.printifyVariantId;
    const rv = pid != null ? byPrintifyId.get(pid) : undefined;
    if (!rv?.options) return v;

    const nextOptions: Record<string, string> = { ...v.options };
    for (const oid of rv.options) {
      const info = lookup.get(oid);
      if (!info) continue;
      const catalogOpt = options.find((o) => {
        if (/size/i.test(info.group)) return /size/i.test(o.name);
        if (/color/i.test(info.group)) return /color/i.test(o.name);
        return o.name.toLowerCase() === info.group.toLowerCase();
      });
      if (!catalogOpt) continue;
      const match = catalogOpt.values.find(
        (ov) =>
          ov.label.toLowerCase() === info.title.toLowerCase() ||
          ov.value.toLowerCase().replace(/[\s-]/g, "") ===
            info.title.toLowerCase().replace(/[\s-]/g, ""),
      );
      if (match) nextOptions[catalogOpt.name] = match.value;
    }
    return { ...v, options: nextOptions };
  });
}

/** Align blank titles like "Accent Coffee Mug (11, 15oz)" to sizes we actually sell. */
function titleForOfferedSizes(remoteTitle: string, options: ProductOption[]): string {
  const sizeOpt = options.find((o) => /size/i.test(o.name));
  const labels = sizeOpt?.values.map((v) => v.label) || [];
  if (labels.length === 1) {
    const size = labels[0];
    return remoteTitle
      .replace(/\(\s*11\s*,\s*15\s*oz\s*\)/i, `(${size})`)
      .replace(/\(\s*11oz\s*,\s*15oz\s*\)/i, `(${size})`)
      .replace(/\(\s*11,\s*15oz\s*\)/i, `(${size})`);
  }
  return remoteTitle;
}

/**
 * When we only sell one size, strip blank-product claims about extra sizes
 * (e.g. mug copy still mentions 15oz even though that variant is disabled).
 */
function alignCopyToOfferedSizes(html: string, options: ProductOption[]): string {
  const sizeOpt = options.find((o) => /size/i.test(o.name));
  const labels = sizeOpt?.values.map((v) => v.label) || [];
  if (labels.length !== 1) return html;

  const only = labels[0];
  let out = html;
  // Mug blank: "Available in two generous sizes, 11oz (0.33 l) and 15oz (0.44 l), this mug…"
  out = out.replace(
    /Available in two generous sizes,\s*11oz\s*\([^)]+\)\s*and\s*15oz\s*\([^)]+\),\s*/gi,
    `Offered in ${only} (0.33 l), `,
  );
  // Spec bullets: "Available in two sizes: 11oz (0.33 l) and 15oz (0.44 l)"
  out = out.replace(
    /Available in two sizes:\s*11oz\s*\([^)]+\)\s*and\s*15oz\s*\([^)]+\)/gi,
    `Size: ${only} (0.33 l)`,
  );
  out = out.replace(/\s*and\s*15oz\s*\([^)]+\)/gi, "");
  out = out.replace(/\b15oz\b/gi, only);
  return out;
}

function filterDetailsForOfferedSizes(
  details: Product["details"],
  options: ProductOption[],
): Product["details"] {
  const sizeOpt = options.find((o) => /size/i.test(o.name));
  const labels = sizeOpt?.values.map((v) => v.label) || [];
  if (labels.length !== 1) return details;

  const only = labels[0].toLowerCase();
  return details
    .map((d) => {
      let value = d.value;
      if (/two sizes/i.test(value) || /15oz/i.test(value)) {
        value = value
          .replace(/Available in two sizes:\s*/i, "Size: ")
          .replace(/\s*and\s*15oz\s*\([^)]+\)/gi, "")
          .replace(/\b15oz\b/gi, labels[0]);
      }
      if (/15oz/i.test(value) && !value.toLowerCase().includes(only)) return null;
      return { ...d, value };
    })
    .filter((d): d is Product["details"][number] => d != null);
}

export function mapPrintifyOntoProduct(product: Product, remote: PrintifyProductDetail): Product {
  const allowedIds = new Set<number>();
  for (const v of product.variants) {
    if (v.printifyVariantId != null) allowedIds.add(v.printifyVariantId);
  }
  if (product.printifyVariantId != null) allowedIds.add(product.printifyVariantId);

  const media = mediaFromPrintify(remote, allowedIds.size ? allowedIds : undefined);
  let variants = syncVariants(product, remote);
  let options = syncOptions(product, remote, variants);
  variants = remapVariantOptionKeys(variants, options, remote);

  const alignedHtml = alignCopyToOfferedSizes(remote.description || "", options);
  const { short, long, details: parsedDetails } = parseDescription(alignedHtml);
  const details = filterDetailsForOfferedSizes(parsedDetails, options);

  // If Color only has one value, keep the swatch (White only); sizes always from Printify titles.
  let amount = product.price.amount;
  if (product.printifyVariantId != null) {
    const rv = remote.variants.find((v) => v.id === product.printifyVariantId);
    if (rv) amount = markupCents(rv.price);
  } else if (variants.length) {
    amount = variants[0].price;
  }

  const title = titleForOfferedSizes(remote.title || product.title, options);
  const plainSeo = short || stripHtml(alignedHtml) || title;
  const sku = printifyProductSku(product, remote, variants);
  // Prefer live Printify short; never wipe a good catalog fallback with ""
  const descriptionShort = short || product.descriptionShort || plainSeo;

  return {
    ...product,
    sku,
    title,
    subtitle: "",
    // Never fall back to invented catalog marketing copy
    descriptionShort,
    descriptionLong: long,
    details: details.length
      ? [...details, { label: "Made", value: "Printed on demand by Printify" }]
      : [{ label: "Made", value: "Printed on demand by Printify" }],
    media: media.length ? media : product.media,
    options,
    variants,
    inventory: {
      tracked: false,
      quantity: null,
      allowBackorder: true,
    },
    price: {
      ...product.price,
      amount,
      listPrice: amount,
    },
    badge: null,
    seo: {
      title: `${title} | Garth Heckman`,
      description: plainSeo.slice(0, 160),
    },
  };
}

export async function enrichPrintifyProduct(product: Product): Promise<Product> {
  if (product.fulfillment !== "printify" || !product.printifyProductId) return product;
  try {
    const remote = await getPrintifyProduct(product.printifyProductId);
    return mapPrintifyOntoProduct(product, remote);
  } catch (err) {
    console.error(`Printify enrich failed for ${product.id}:`, err);
    return product;
  }
}

export async function enrichPrintifyProducts(products: Product[]): Promise<Product[]> {
  return Promise.all(products.map((p) => enrichPrintifyProduct(p)));
}
