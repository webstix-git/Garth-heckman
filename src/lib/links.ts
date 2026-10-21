/** Map prototype .html hrefs to App Router paths. */

export function hrefFromPrototype(href: string): string {
  if (!href) return href;
  if (
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#") ||
    href.startsWith("/")
  ) {
    return href;
  }
  if (href === "index.html") return "/";
  const product = href.match(/^product\.html\?slug=([^&]+)/);
  if (product) return `/product/${product[1]}`;
  const page = href.match(/^([a-z0-9-]+)\.html(.*)$/i);
  if (page) return `/${page[1]}${page[2]}`;
  if (href.startsWith("assets/")) return `/${href}`;
  return href;
}

export const WTFU_HREF = "/product/wtfu-book";
