import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { BLOG_POSTS } from "@/lib/blog";
import { Catalog } from "@/lib/catalog";
import { WORK } from "@/lib/content";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Every public page on Garth Heckman's site, in one list.",
};

const SITE: Array<{ heading: string; links: Array<{ href: string; label: string }> }> = [
  {
    heading: "Start here",
    links: [
      { href: "/", label: "Home" },
      { href: "/story", label: "My Story" },
      { href: "/work", label: "What I Do" },
      { href: "/contact", label: "Connect" },
    ],
  },
  {
    heading: "The work",
    links: WORK.map((w) => ({ href: w.href, label: w.t })),
  },
  {
    heading: "Listen and read",
    links: [
      { href: "/podcast", label: "The podcast" },
      { href: "/blog", label: "Blog" },
      ...BLOG_POSTS.map((p) => ({ href: `/blog/${p.slug}`, label: p.t })),
    ],
  },
  {
    heading: "Store",
    links: [
      { href: "/store", label: "All products" },
      { href: "/cart", label: "Cart" },
      { href: "/account", label: "Orders and downloads" },
      ...Catalog.all().map((p) => ({ href: `/product/${p.slug}`, label: p.title })),
    ],
  },
  {
    heading: "This site",
    links: [
      { href: "/sitemap", label: "Sitemap" },
      { href: "/service-index", label: "Service Index" },
      { href: "/ai-policy", label: "AI Policy" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export default function Page() {
  return (
    <LegalShell title="Sitemap" lede="Every public page, grouped the way the site is actually used.">
      <div className="wrap">
        <div className="grid g3 hair" data-rv>
          {SITE.map((group) => (
            <div key={group.heading}>
              <p className="meta meta--gold">{group.heading}</p>
              <ul className="sitemap-list">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </LegalShell>
  );
}
