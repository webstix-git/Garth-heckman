/**
 * Ensure <img width/height> from the editor survive CSS that would otherwise
 * ignore HTML width attributes (e.g. `.prose img { width: auto }`).
 */
export function applyImageSizeStyles(html: string): string {
  if (!html || !html.includes("<img")) return html;

  return html.replace(/<img\b([^>]*)>/gi, (tag, rawAttrs: string) => {
    let attrs = rawAttrs;

    const widthMatch = attrs.match(/\bwidth\s*=\s*(["']?)(\d+)\1/i);
    if (!widthMatch) return tag;

    const width = widthMatch[2];
    const sizeStyle = `width: ${width}px; height: auto; max-width: 100%;`;

    if (/\bstyle\s*=\s*(["'])[^"']*width\s*:/i.test(attrs)) {
      return `<img${attrs}>`;
    }

    if (/\bstyle\s*=\s*(["'])([\s\S]*?)\1/i.test(attrs)) {
      attrs = attrs.replace(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/i, (_m, quote: string, style: string) => {
        const cleaned = style.replace(/;?\s*$/, "");
        return `style=${quote}${cleaned}; ${sizeStyle}${quote}`;
      });
      return `<img${attrs}>`;
    }

    return `<img${attrs} style="${sizeStyle}">`;
  });
}
