import type { Product as StorefrontProduct } from "@/lib/catalog";
import { toProseHtml } from "@/lib/rich-text";
import type { Product, ProductContentSection } from "@/types";

function formatFileSize(sizeMb: number | null | undefined): string | null {
  if (sizeMb == null || Number.isNaN(Number(sizeMb))) return null;
  const n = Number(sizeMb);
  return `${n >= 10 ? n.toFixed(0) : n.toFixed(1)} MB`;
}

function paragraphsFromBlocks(blocks: string[]): string {
  return blocks
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      // Catalog long-description blocks may already include inline HTML.
      if (/^<(p|ul|ol|div)\b/i.test(block)) return block;
      return `<p>${block}</p>`;
    })
    .join("");
}

/** Build Description / Details / Download&access (or Shipping) sections from catalog data. */
export function buildDefaultContentSections(
  source: {
    descriptionLong?: string[];
    description?: string;
    details?: Array<{ label: string; value: string }>;
    shippingRequired?: boolean;
    shippingOriginNote?: string;
    digital?: {
      files?: Array<{ name: string; sizeMb: number | null }>;
      downloadLimit?: number;
      expiryDays?: number;
    } | null;
  },
): ProductContentSection[] {
  const longHtml =
    paragraphsFromBlocks(source.descriptionLong || []) ||
    toProseHtml(source.description || "");

  // SKU lives on the product SKU field — never inside Details content.
  const detailRows = (source.details || []).filter(
    (row) => row.label.trim().toLowerCase() !== "sku",
  );

  const detailsBody = detailRows
    .map((row) => `<p><strong>${row.label}:</strong> ${row.value}</p>`)
    .join("");

  const digital = source.digital;
  const filesLine =
    digital?.files?.length
      ? digital.files
          .map((f) => {
            const size = formatFileSize(f.sizeMb);
            return size ? `${f.name} (${size})` : f.name;
          })
          .join(", ")
      : "";

  let accessHeading = "Download & access";
  let accessBody = "";
  if (source.shippingRequired) {
    accessHeading = "Shipping & returns";
    accessBody = [
      `<p><strong>Shipping.</strong> ${source.shippingOriginNote || ""} Flat rate $6.95, free over $75. You get a confirmation email as soon as the order is placed and a second one when it ships.</p>`.trim(),
      `<p><strong>Returns.</strong> Something arrive damaged? Email Garth and it gets replaced. No forms.</p>`,
    ].join("");
  } else {
    const limit = digital?.downloadLimit ?? 2;
    const months = Math.round((digital?.expiryDays || 365) / 30);
    // Same structure as Details: consecutive <p> blocks, no blank spacers.
    accessBody = [
      `<p><strong>Download.</strong> The download link appears on your confirmation page the moment payment clears, and is emailed to you as well. Up to ${limit} guest downloads from that link (sign in to My Account for unlimited downloads), link valid for ${months} months.</p>`,
      filesLine ? `<p><strong>Files.</strong> ${filesLine}</p>` : "",
    ]
      .filter(Boolean)
      .join("");
  }

  // Description: consecutive <p> blocks only (same rhythm as Details / Download).
  const descriptionBody = longHtml || "<p>No description yet.</p>";

  return [
    {
      heading: "Description",
      body: toProseHtml(descriptionBody) || "<p>No description yet.</p>",
    },
    {
      heading: "Details",
      body: toProseHtml(detailsBody) || "<p>Product details will appear here.</p>",
    },
    {
      heading: accessHeading,
      body: toProseHtml(accessBody) || "<p>Access details will appear here.</p>",
    },
  ];
}

export function contentSectionsFromStorefront(
  p: StorefrontProduct,
): ProductContentSection[] {
  return buildDefaultContentSections({
    descriptionLong: p.descriptionLong,
    details: p.details,
    shippingRequired: Boolean(p.shipping?.required),
    shippingOriginNote: p.shipping?.originNote,
    digital: p.digital,
  });
}

function normalizeSectionList(
  sections: Array<{ heading?: string; body?: string; title?: string; content?: string }> | null | undefined,
): ProductContentSection[] {
  if (!Array.isArray(sections)) return [];
  return sections
    .map((section) => ({
      heading: String(section.heading ?? section.title ?? "").trim(),
      body: String(section.body ?? section.content ?? "").trim(),
    }))
    .filter((section) => section.heading || section.body)
    .map((section) => {
      const body = toProseHtml(section.body);
      const isDetails = section.heading.toLowerCase() === "details";
      return {
        heading: section.heading,
        body: isDetails ? stripSkuFromDetailsBody(body) : body,
      };
    });
}

function readMetadataDetails(
  metadata: Record<string, unknown> | null | undefined,
): Array<{ label: string; value: string }> {
  if (!Array.isArray(metadata?.details)) return [];
  return (metadata.details as Array<{ label?: unknown; value?: unknown }>)
    .map((row) => ({
      label: String(row?.label ?? "").trim(),
      value: String(row?.value ?? "").trim(),
    }))
    .filter((row) => row.label && row.value);
}

function readDownloadSettings(metadata: Record<string, unknown> | null | undefined): {
  downloadLimit?: number;
  expiryDays?: number;
} {
  const limit = Number(metadata?.downloadLimit);
  const expiration = metadata?.downloadExpiration;
  return {
    ...(Number.isFinite(limit) && limit > 0 ? { downloadLimit: limit } : {}),
    ...(expiration === "never"
      ? {}
      : Number(expiration) > 0
        ? { expiryDays: Number(expiration) }
        : { expiryDays: 365 }),
  };
}

/**
 * Build the same Description / Details / Download sections the storefront shows,
 * from whatever the product row actually stores (contentSections, productPageSections, or details).
 */
export function contentSectionsFromProductRecord(input: {
  description?: string | null;
  type?: string | null;
  metadata?: Record<string, unknown> | null;
  digitalFiles?: Array<{ name: string; sizeMb: number | null }>;
}): ProductContentSection[] {
  const metadata = input.metadata ?? {};
  const fromContent = normalizeSectionList(
    metadata.contentSections as ProductContentSection[] | undefined,
  );
  const fromPage = normalizeSectionList(
    metadata.productPageSections as Array<{ title?: string; content?: string }> | undefined,
  );
  // Ignore heading-only placeholders; storefront details still need to seed the editors.
  const existing = (fromContent.some((section) => section.body.trim())
    ? fromContent
    : fromPage.some((section) => section.body.trim())
      ? fromPage
      : []);
  if (existing.length) return existing;

  const type = String(input.type || "").toLowerCase();
  const shippingRequired = type === "physical" || type === "bundle";
  const download = readDownloadSettings(metadata);
  return buildDefaultContentSections({
    description: input.description || "",
    details: readMetadataDetails(metadata),
    shippingRequired,
    digital: shippingRequired
      ? null
      : {
          files: input.digitalFiles ?? [],
          downloadLimit: download.downloadLimit ?? 5,
          expiryDays: download.expiryDays ?? 365,
        },
  });
}

/** Prefer existing sections; otherwise seed from storefront/catalog defaults. */
export function withFilledContentSections(
  admin: Product,
  storefront?: StorefrontProduct | null,
): Product {
  const existing = normalizeSectionList(admin.contentSections);
  if (existing.some((section) => section.body.trim())) {
    return { ...admin, contentSections: existing };
  }

  if (storefront) {
    return {
      ...admin,
      contentSections: contentSectionsFromStorefront(storefront),
    };
  }

  return {
    ...admin,
    contentSections: buildDefaultContentSections({
      description: admin.description,
      shippingRequired:
        admin.type === "physical" || admin.type === "bundle",
      digital:
        admin.type === "digital"
          ? { files: [], downloadLimit: 5, expiryDays: 365 }
          : null,
    }),
  };
}

/** Turn Details HTML (`<p><strong>Format:</strong> PDF</p>`) back into metadata.details rows. */
export function detailsRowsFromDetailsBody(body: string): Array<{ label: string; value: string }> {
  const html = stripSkuFromDetailsBody(body);
  const rows: Array<{ label: string; value: string }> = [];
  const pattern =
    /<p\b[^>]*>\s*<strong>\s*([^<:]+)\s*:?\s*<\/strong>\s*([\s\S]*?)\s*<\/p>/gi;
  for (const match of html.matchAll(pattern)) {
    const label = String(match[1] || "").replace(/<[^>]+>/g, "").trim();
    const value = String(match[2] || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (label && value && label.toLowerCase() !== "sku") {
      rows.push({ label, value });
    }
  }
  return rows;
}

/** Remove SKU rows from Details HTML (SKU is edited via the product SKU field). */
export function stripSkuFromDetailsBody(body: string): string {
  const html = toProseHtml(body)
    .replace(
      /<p\b[^>]*>\s*(?:<strong>\s*SKU\s*:?\s*<\/strong>|SKU\s*:)[\s\S]*?<\/p>/gi,
      "",
    )
    .trim();
  return toProseHtml(html);
}

/** Append SKU from the product SKU field for storefront Details display. */
export function ensureSkuInDetailsBody(body: string, sku: string | null | undefined): string {
  const trimmedSku = String(sku || "").trim();
  const html = stripSkuFromDetailsBody(body);
  if (!trimmedSku) return html;
  return `${html}<p><strong>SKU:</strong> ${trimmedSku}</p>`;
}

export function plainDescriptionFromSections(
  sections: ProductContentSection[] | undefined,
  fallback: string,
): string {
  const description = sections?.find(
    (s) => s.heading.trim().toLowerCase() === "description",
  );
  if (!description?.body.trim()) return fallback;
  return description.body.includes("<")
    ? description.body
    : toProseHtml(description.body);
}
