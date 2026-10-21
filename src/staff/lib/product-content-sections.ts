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
    const limit = digital?.downloadLimit ?? 5;
    const months = Math.round((digital?.expiryDays || 365) / 30);
    // Same structure as Details: consecutive <p> blocks, no blank spacers.
    accessBody = [
      `<p><strong>Download.</strong> The download link appears on your confirmation page the moment payment clears, and is emailed to you as well. Up to ${limit} downloads, link valid for ${months} months.</p>`,
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

/** Prefer existing sections; otherwise seed from storefront/catalog defaults. */
export function withFilledContentSections(
  admin: Product,
  storefront?: StorefrontProduct | null,
): Product {
  const existing = (admin.contentSections || [])
    .filter((s) => s.heading.trim() || s.body.trim())
    .map((s) => {
      const body = toProseHtml(s.body);
      const isDetails = s.heading.trim().toLowerCase() === "details";
      return {
        ...s,
        // Admin Details editor should not carry SKU — that is the SKU field.
        body: isDetails ? stripSkuFromDetailsBody(body) : body,
      };
    });
  if (existing.length) return { ...admin, contentSections: existing };

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
