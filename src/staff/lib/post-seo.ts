import { SEO_DESC_MAX, SEO_TITLE_MAX, truncateSeo } from "@/lib/product-seo";
import type { SeoFields } from "@/types";

const SITE_NAME = "Garth Heckman";

function stripToText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildPostSeo(input: {
  title: string;
  excerpt?: string;
  content?: string;
  category?: string;
  author?: string;
}): SeoFields {
  const title = input.title.trim();
  const blurb = stripToText(input.excerpt ?? "") || stripToText(input.content ?? "");

  let seoTitle = "";
  if (title) {
    const suffix = ` | ${SITE_NAME}`;
    seoTitle =
      /grath heckman/i.test(title) || title.length + suffix.length > SEO_TITLE_MAX
        ? truncateSeo(title, SEO_TITLE_MAX)
        : `${title}${suffix}`;
  }

  let description = "";
  if (blurb) {
    const closer = title ? ` Read ${title} on ${SITE_NAME}.` : ` Read more on ${SITE_NAME}.`;
    const core = /[.!?]$/.test(blurb) ? blurb : `${blurb}.`;
    description = truncateSeo(`${core}${closer}`, SEO_DESC_MAX);
  } else if (title) {
    const authorBit = input.author ? ` by ${input.author}` : "";
    const categoryBit = input.category ? ` in ${input.category}` : "";
    description = truncateSeo(
      `${title}${authorBit}${categoryBit}. Insights and stories from ${SITE_NAME}.`,
      SEO_DESC_MAX,
    );
  }

  return { title: seoTitle, description };
}
