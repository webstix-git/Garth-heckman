/**
 * Normalize editor / catalog copy into HTML the storefront prose styles can render.
 * Blank lines become paragraphs; single newlines become <br />; existing block HTML is kept.
 */
export function toProseHtml(value: string | null | undefined): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  let html = trimmed;

  // Already structured as blocks TipTap / storefront expect.
  if (/<(p|ul|ol|li|h[1-6]|blockquote|div|table)\b/i.test(html)) {
    // TipTap blank lines: <br>, &nbsp;, or whitespace-only → empty <p></p>.
    html = html.replace(
      /<p(?:\s[^>]*)?>((?:\s|&nbsp;|&#160;|\u00a0|<br\s*\/?>)*)<\/p>/gi,
      "<p></p>",
    );
    // Don't stack multiple blank paragraphs into giant gaps.
    html = html.replace(/(?:<p><\/p>){2,}/gi, "<p></p>");
    // Drop leading blank paragraphs only — keep a trailing empty for the editor caret.
    html = html.replace(/^(?:<p><\/p>)+/gi, "");
    // Same paragraph rhythm for Description / Details / Download & access.
    html = normalizeParagraphBlocks(html);
    return html;
  }

  return html
    .split(/\n{2,}/)
    .map((block) => {
      const inner = block.trim().replace(/\n/g, "<br />");
      return inner ? `<p>${inner}</p>` : "";
    })
    .filter(Boolean)
    .join("");
}

/**
 * Keep one consistent rhythm across product content sections:
 * - Split <br>-joined detail rows into one <p> each
 * - Split double-breaks inside a paragraph into separate paragraphs
 * - Drop empty TipTap spacers between content paragraphs (Details-style spacing)
 */
function normalizeParagraphBlocks(html: string): string {
  const tokenRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const parts: Array<{ type: "p"; inner: string } | { type: "other"; raw: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(html))) {
    if (match.index > lastIndex) {
      parts.push({ type: "other", raw: html.slice(lastIndex, match.index) });
    }
    parts.push({ type: "p", inner: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < html.length) {
    parts.push({ type: "other", raw: html.slice(lastIndex) });
  }

  const isBlank = (inner: string) => {
    const cleaned = inner
      .replace(/&nbsp;|&#160;|\u00a0/gi, "")
      .replace(/<br\s*\/?>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    return !cleaned;
  };

  const isDetailSegment = (segment: string) => {
    const cleaned = segment.trim();
    if (!cleaned) return false;
    if (/<(ul|ol|p|div|h[1-6]|table|blockquote)\b/i.test(cleaned)) return false;
    const text = cleaned.replace(/<[^>]+>/g, "").trim();
    if (!text || text.length > 200) return false;
    if (/^<(strong|b)>[^<:]{1,48}:\s*<\/\1>/i.test(cleaned)) return true;
    return /^[^<:\n]{1,48}:\s+\S/.test(text);
  };

  const isDetailBlock = (inner: string) => {
    if (isBlank(inner)) return false;
    const segments = inner.split(/<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean);
    return segments.length > 0 && segments.every(isDetailSegment);
  };

  const expanded: typeof parts = [];
  for (const part of parts) {
    if (part.type !== "p") {
      expanded.push(part);
      continue;
    }
    if (isBlank(part.inner)) {
      expanded.push(part);
      continue;
    }

    // Detail rows joined with <br> → one paragraph per row (Details spacing).
    if (isDetailBlock(part.inner) && /<br\s*\/?>/i.test(part.inner)) {
      for (const segment of part.inner.split(/<br\s*\/?>/i)) {
        const trimmed = segment.trim();
        if (trimmed) expanded.push({ type: "p", inner: trimmed });
      }
      continue;
    }

    // Double breaks inside a paragraph → separate paragraphs (Description spacing).
    if (/<br\s*\/?>\s*<br\s*\/?>/i.test(part.inner)) {
      for (const segment of part.inner.split(/(?:<br\s*\/?>\s*){2,}/i)) {
        const trimmed = segment.trim().replace(/(?:<br\s*\/?>)+$/gi, "").trim();
        if (trimmed) expanded.push({ type: "p", inner: trimmed });
      }
      continue;
    }

    expanded.push(part);
  }

  // Drop empty spacers between any two content paragraphs so Description,
  // Details, and Download & access all share the same mb rhythm.
  let out = "";
  for (let i = 0; i < expanded.length; i += 1) {
    const part = expanded[i];
    if (part.type === "p" && isBlank(part.inner)) {
      const prev = expanded[i - 1];
      const next = expanded[i + 1];
      const betweenContent =
        prev?.type === "p" &&
        next?.type === "p" &&
        !isBlank(prev.inner) &&
        !isBlank(next.inner);
      if (betweenContent) continue;
    }
    out += part.type === "p" ? `<p>${part.inner}</p>` : part.raw;
  }

  return out;
}

/** Plain text for SEO, lists, and other non-HTML surfaces. */
export function stripRichText(value: string | null | undefined): string {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}
