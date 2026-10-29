import type { Metadata } from "next";
import { pageSeo } from "@/lib/seo";
import { LegalShell } from "@/components/LegalShell";
import { listPublishedPosts } from "@/lib/blog-public";
import { listStorefrontProducts } from "@/lib/catalog-public";
import { WORK } from "@/lib/content";

export const metadata: Metadata = pageSeo("/sitemap");

export default async function Page() {
  const [blogPosts, products] = await Promise.all([
    listPublishedPosts(),
    listStorefrontProducts(),
  ]);

  const SITE: Array<{ heading: string; links: Array<{ href: string; label: string }> }> = [
    {
      heading: "Start here",
      links: [
        { href: "/", label: "Home" },
        { href: "/ask-garth", label: "Straight From Garth" },
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
        { href: "/shorts", label: "YouTube Shorts" },
        { href: "/speaking", label: "Speaking" },
        { href: "/coaching", label: "Coaching" },
        ...blogPosts.map((p) => ({ href: `/blog/${p.slug}`, label: p.t })),
      ],
    },
    {
      heading: "Store",
      links: [
        { href: "/store", label: "All products" },
        ...products.map((p) => ({ href: `/product/${p.slug}`, label: p.title })),
      ],
    },
  ];

  return (
    <LegalShell title="Sitemap" lede="Every public page, grouped the way the site is actually used.">
      <div className="wrap">
        <div className="sitemap-stack" data-rv>
          {SITE.map((group) => (
            <section key={group.heading} className="sitemap-stack__group">
              <p className="meta meta--gold">{group.heading}</p>
              <ul className="sitemap-list">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </LegalShell>
  );
}
