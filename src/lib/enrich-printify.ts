/**
 * Overlays live Printify catalog fields onto storefront Product records.
 * Structural ids (slug, variant ids, options) stay from catalog-source so cart
 * and printify-map keep working; title/copy/media/prices come from Printify.
 */
import "server-only";
import type { Product, ProductMedia, ProductVariant } from "@/lib/catalog";
import { getPrintifyProduct, type PrintifyProductDetail } from "@/lib/printify";

/** Site price = Printify selling price × this factor. */
export const PRINTIFY_PRICE_MARKUP = 1.2;

function markupCents(printifyPriceCents: number) {
  return Math.round(printifyPriceCents * PRINTIFY_PRICE_MARKUP);
}

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split Printify HTML description into short plain text + long HTML blocks. */
function parseDescription(html: string): { short: string; long: string[]; details: Product["details"] } {
  const raw = (html || "").trim();
  if (!raw) return { short: "", long: [], details: [] };

  const details: Product["details"] = [];
  const detailRe = /\.:\s*([^<\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = detailRe.exec(raw))) {
    const value = m[1].trim();
    if (value) details.push({ label: value, value: "" });
  }

  const chunks = raw
    .split(/<\/p>|<br\s*\/?>/i)
    .map((c) => c.replace(/<p[^>]*>/gi, "").trim())
    .filter((c) => {
      const plain = stripHtml(c);
      if (!plain || /^[\s.:]*$/.test(plain)) return false;
      // Spec bullets like ".: Material: …" go to details, not body copy.
      if (/^\.:/.test(plain) || /^\.:/.test(c.replace(/<[^>]+>/g, "").trim())) return false;
      return true;
    });

  const long = chunks.length ? chunks : [raw];
  const plain = stripHtml(raw);
  const short = plain.length > 180 ? plain.slice(0, 177).trimEnd() + "…" : plain;

  return { short, long, details };
}

function mediaFromPrintify(
  remote: PrintifyProductDetail,
  allowedVariantIds?: Set<number>,
): ProductMedia[] {
  const images = remote.images || [];
  if (!images.length) return [];
  // Prefer images tied to the variants we actually sell (e.g. White only).
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
      label: img.position ? img.position.replace(/-/g, " ") : `View ${out.length + 1}`,
      note: "",
      src: img.src,
    });
    if (out.length >= 12) break;
  }
  return out;
}

function applyVariantPrices(product: Product, remote: PrintifyProductDetail): ProductVariant[] {
  const byId = new Map(remote.variants.map((v) => [v.id, v]));
  if (!product.variants.length) return product.variants;

  return product.variants.map((v) => {
    const pid = v.printifyVariantId;
    if (pid == null) return v;
    const rv = byId.get(pid);
    if (!rv) return v;
    return {
      ...v,
      price: markupCents(rv.price),
      // POD: available = sellable; no fake warehouse counts
      inventory: rv.is_enabled && rv.is_available ? 999 : 0,
    };
  });
}

export function mapPrintifyOntoProduct(product: Product, remote: PrintifyProductDetail): Product {
  const { short, long, details } = parseDescription(remote.description || "");
  const allowedIds = new Set<number>();
  for (const v of product.variants) {
    if (v.printifyVariantId != null) allowedIds.add(v.printifyVariantId);
  }
  if (product.printifyVariantId != null) allowedIds.add(product.printifyVariantId);
  const media = mediaFromPrintify(remote, allowedIds.size ? allowedIds : undefined);
  const variants = applyVariantPrices(product, remote);

  let amount = product.price.amount;
  if (product.printifyVariantId != null) {
    const rv = remote.variants.find((v) => v.id === product.printifyVariantId);
    if (rv) amount = markupCents(rv.price);
  } else if (variants.length) {
    const priced = variants.find((v) => v.inventory > 0) || variants[0];
    amount = priced.price;
  }

  const plainSeo = short || stripHtml(remote.description || "") || remote.title;

  return {
    ...product,
    title: remote.title || product.title,
    subtitle: remote.tags?.[0] || "",
    descriptionShort: short || product.descriptionShort,
    descriptionLong: long.length ? long : product.descriptionLong,
    details: details.length
      ? [...details, { label: "Made", value: "Printed on demand by Printify" }]
      : [{ label: "Made", value: "Printed on demand by Printify" }],
    media: media.length ? media : product.media,
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
      title: `${remote.title} | Garth Heckman`,
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
