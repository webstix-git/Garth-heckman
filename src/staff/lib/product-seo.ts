import { formatCurrency } from "@/lib/format";
import type { SeoFields } from "@/types";

export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MAX = 160;

const SITE_NAME = "Garth Heckman";

function stripToText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateSeo(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const sliced = text.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > Math.floor(max * 0.45) ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

function typePhrase(type: string) {
  switch (type) {
    case "physical":
      return "a physical product";
    case "digital":
      return "a digital download";
    case "service":
      return "a service";
    case "external":
      return "an external product";
    case "bundle":
      return "a product bundle";
    case "gift_card":
      return "a gift card";
    default:
      return type ? `a ${type}` : "a product";
  }
}

export function buildProductSeo(input: {
  name: string;
  type: string;
  shortDescription?: string;
  description?: string;
  categoryName?: string;
  price?: number;
}): SeoFields {
  const name = input.name.trim();
  const type = input.type.trim();
  const categoryName = input.categoryName?.trim();
  const blurb =
    stripToText(input.shortDescription ?? "") || stripToText(input.description ?? "");

  let title = "";
  if (name) {
    const suffix = ` | ${SITE_NAME}`;
    title = /grath heckman/i.test(name) || name.length + suffix.length > SEO_TITLE_MAX
      ? truncateSeo(name, SEO_TITLE_MAX)
      : `${name}${suffix}`;
  }

  let description = "";
  if (blurb) {
    const closer = name ? ` Shop ${name} from ${SITE_NAME}.` : ` Shop ${SITE_NAME}.`;
    const core = /[.!?]$/.test(blurb) ? blurb : `${blurb}.`;
    description = truncateSeo(`${core}${closer}`, SEO_DESC_MAX);
  } else if (name) {
    const kind = typePhrase(type);
    const categoryBit = categoryName ? ` in ${categoryName}` : "";
    const priceBit =
      input.price && input.price > 0 ? ` Available for ${formatCurrency(input.price)}.` : "";
    description = truncateSeo(
      `Discover ${name}, ${kind}${categoryBit} from ${SITE_NAME}.${priceBit}`,
      SEO_DESC_MAX,
    );
  }

  return { title, description };
}
