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

export const ASK_GARTH_HREF = "/ask-garth";
export const GARTH_EMAIL = "garthwheckman@gmail.com";
export const GARTH_PHONE_DISPLAY = "(952) 240-7152";
export const GARTH_PHONE_TEL = "+19522407152";
export const GARTH_ADDRESS_LINE1 = "15097 DuPont Path";
export const GARTH_ADDRESS_LINE2 = "Apple Valley, MN 55124";
export const GARTH_MAPS_HREF =
  "https://maps.google.com/?q=15097+DuPont+Path,+Apple+Valley,+MN+55124";
export const GARTH_MAILTO = `mailto:${GARTH_EMAIL}`;
export const GARTH_TEL = `tel:${GARTH_PHONE_TEL}`;
export const ASK_GARTH_MAILTO = `mailto:${GARTH_EMAIL}?subject=${encodeURIComponent("A question for Garth")}`;

/** Build a tel: href from any displayed phone string. */
export function telHref(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned) return "tel:";
  if (cleaned.startsWith("+")) return `tel:${cleaned}`;
  if (/^\d{10}$/.test(cleaned)) return `tel:+1${cleaned}`;
  if (/^1\d{10}$/.test(cleaned)) return `tel:+${cleaned}`;
  return `tel:${cleaned}`;
}

export function mailtoHref(email: string, subject?: string) {
  const base = `mailto:${email.trim()}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}
