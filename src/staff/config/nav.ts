import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FileText,
  House,
  Mail,
  Package,
  Settings,
  Tag,
  User,
  Users,
} from "lucide-react";

export interface NavItem {
  title: string;
  href?: string;
  icon?: LucideIcon;
  badge?: string | number;
  /** A planned area that is visible in the IA but does not have a route yet. */
  disabled?: boolean;
  /** Extra terms for global header search (e.g. "admin email"). */
  keywords?: string[];
  children?: NavItem[];
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ title: "Home", href: "/admin/dashboard", icon: House }],
  },
  {
    label: "Sales",
    items: [
      {
        title: "Products",
        icon: Tag,
        children: [
          { title: "All Products", href: "/admin/products" },
          { title: "Categories", href: "/admin/categories" },
          { title: "Tags", disabled: true },
        ],
      },
      {
        title: "Printify",
        icon: Package,
        children: [
          { title: "Products", href: "/admin/printify/products" },
          { title: "Orders", href: "/admin/printify/orders" },
          { title: "Sync logs", href: "/admin/printify/logs" },
        ],
      },
      {
        title: "Orders",
        href: "/admin/orders",
        icon: ClipboardList,
      },
      {
        title: "Discounts",
        href: "/admin/discounts",
        icon: Tag,
      },
      {
        title: "Customers",
        href: "/admin/customers",
        icon: Users,
      },
    ],
  },
  {
    label: "Content & growth",
    items: [
      {
        title: "Content",
        icon: FileText,
        children: [
          { title: "Blog Posts", href: "/admin/blog" },
          { title: "Add Blog Post", href: "/admin/blog/new" },
          { title: "Blog Categories", href: "/admin/blog/categories" },
          { title: "Media", href: "/admin/media" },
        ],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Contact Inbox",
        href: "/admin/contact-submissions",
        icon: Mail,
      },
      {
        title: "Settings",
        icon: Settings,
        children: [
          {
            title: "Store",
            href: "/admin/settings",
            keywords: ["store settings", "branding", "logo", "brand colors", "appearance"],
          },
          {
            title: "Email",
            href: "/admin/settings/email",
            keywords: [
              "admin email",
              "email settings",
              "notifications",
              "sender",
              "from email",
              "reply-to",
            ],
          },
        ],
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

const RESERVED_SEGMENTS = new Set(["new", "categories", "email", "appearance"]);

export function navItemKey(item: NavItem) {
  return item.href ?? item.title;
}

function parseHref(href: string) {
  const url = new URL(href, "http://nav.local");
  return { pathname: url.pathname, searchParams: url.searchParams };
}

function queryMatches(current: URLSearchParams, target: URLSearchParams) {
  for (const [key, value] of target.entries()) {
    if (current.get(key) !== value) return false;
  }
  return true;
}

export function isHrefActive(
  pathname: string,
  search: string,
  href: string,
  siblingHrefs: string[] = [],
) {
  const target = parseHref(href);
  const current = new URLSearchParams(search);

  if (target.searchParams.size > 0) {
    return pathname === target.pathname && queryMatches(current, target.searchParams);
  }

  if (pathname === target.pathname) {
    const claimedBySibling = siblingHrefs
      .map(parseHref)
      .some(
        (sibling) =>
          sibling.pathname === target.pathname &&
          sibling.searchParams.size > 0 &&
          queryMatches(current, sibling.searchParams),
      );
    return !claimedBySibling;
  }

  if (!pathname.startsWith(`${target.pathname}/`)) return false;
  const nextSegment = pathname.slice(target.pathname.length + 1).split("/")[0];
  return !RESERVED_SEGMENTS.has(nextSegment);
}

export function isNavItemActive(
  item: NavItem,
  pathname: string,
  search: string,
  siblings: NavItem[] = [],
): boolean {
  if (item.children?.length) {
    return item.children.some((child) => isNavItemActive(child, pathname, search, item.children));
  }
  if (!item.href) return false;
  return isHrefActive(
    pathname,
    search,
    item.href,
    siblings.filter((sibling) => sibling.href && sibling !== item).map((sibling) => sibling.href!),
  );
}

export function collectOpenGroupKeys(
  items: NavItem[],
  pathname: string,
  search: string,
): string[] {
  const keys: string[] = [];
  for (const item of items) {
    if (!item.children?.length) continue;
    if (isNavItemActive(item, pathname, search, items)) {
      keys.push(navItemKey(item));
    }
    keys.push(...collectOpenGroupKeys(item.children, pathname, search));
  }
  return keys;
}

export type NavSearchEntry = {
  title: string;
  href: string;
  /** Breadcrumb path shown in results, e.g. "System › Settings › Email". */
  pathLabel: string;
  icon?: LucideIcon;
  keywords: string[];
};

function flattenNavItems(
  items: NavItem[],
  ancestors: string[],
  sectionLabel: string | undefined,
  parentIcon?: LucideIcon,
): NavSearchEntry[] {
  const entries: NavSearchEntry[] = [];
  for (const item of items) {
    const trail = [...ancestors, item.title];
    const icon = item.icon || parentIcon;
    if (item.href && !item.disabled) {
      const pathParts = sectionLabel ? [sectionLabel, ...trail] : trail;
      entries.push({
        title: item.title,
        href: item.href,
        pathLabel: pathParts.join(" › "),
        icon,
        keywords: item.keywords || [],
      });
    }
    if (item.children?.length) {
      entries.push(...flattenNavItems(item.children, trail, sectionLabel, icon));
    }
  }
  return entries;
}

/** Flat, searchable menu links for the header global search. */
export function getNavSearchEntries(): NavSearchEntry[] {
  const fromNav = NAV_SECTIONS.flatMap((section) =>
    flattenNavItems(section.items, [], section.label),
  );

  const extras: NavSearchEntry[] = [
    {
      title: "Admin Profile",
      href: "/admin/profile",
      pathLabel: "Account › Admin Profile",
      icon: User,
      keywords: ["profile", "admin profile", "account", "password", "username"],
    },
  ];

  const seen = new Set<string>();
  return [...fromNav, ...extras].filter((entry) => {
    if (seen.has(entry.href)) return false;
    seen.add(entry.href);
    return true;
  });
}

export function searchNavEntries(query: string, limit = 8): NavSearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = getNavSearchEntries()
    .map((entry) => {
      const haystack = [
        entry.title,
        entry.pathLabel,
        entry.href,
        ...entry.keywords,
      ]
        .join(" ")
        .toLowerCase();

      const title = entry.title.toLowerCase();
      const path = entry.pathLabel.toLowerCase();
      let score = 0;

      if (title === q) score += 100;
      else if (title.startsWith(q)) score += 80;
      else if (title.includes(q)) score += 60;
      if (path.includes(q)) score += 40;
      if (entry.keywords.some((k) => k.toLowerCase() === q || k.toLowerCase().includes(q))) {
        score += 70;
      }
      if (tokens.every((token) => haystack.includes(token))) score += 50;
      else if (tokens.some((token) => haystack.includes(token))) score += 10;
      else return null;

      // Prefer leaf menu titles that matched all tokens.
      if (tokens.every((token) => title.includes(token) || entry.keywords.some((k) => k.toLowerCase().includes(token)))) {
        score += 20;
      }

      return { entry, score };
    })
    .filter((row): row is { entry: NavSearchEntry; score: number } => row !== null && row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.pathLabel.localeCompare(b.entry.pathLabel));

  return scored.slice(0, limit).map((row) => row.entry);
}
