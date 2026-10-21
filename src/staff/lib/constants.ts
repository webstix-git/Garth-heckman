import { BLOG_SITE_CATEGORIES } from "@/lib/blog";

export const APP_NAME = "Garth Heckman";
export const APP_TAGLINE = "Admin Portal";
export const APP_LOGO_SRC = "/images/gh-logo.png";
export const ADMIN_AVATAR_SRC = "/images/admin-avatar.png";
export const BRAND_NAVY = "#5c3758";

export type { NavItem, NavSection } from "@/config/nav";
export { NAV_ITEMS, NAV_SECTIONS } from "@/config/nav";

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Same labels as the public /blog filters — do not invent alternate names. */
export const BLOG_CATEGORIES = BLOG_SITE_CATEGORIES.map((c) => c.label);

export const BLOG_AUTHORS = ["Garth Heckman"] as const;

export const MERCH_SIZES = ["XS", "S", "M", "L", "XL", "2XL"] as const;
export const MERCH_COLORS = ["Black", "White", "Navy", "Sand", "Forest"] as const;
