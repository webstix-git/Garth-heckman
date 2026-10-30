import { LegalShell } from "@/components/LegalShell";
import { listPublishedPosts } from "@/lib/blog-public";
import { listStorefrontProducts } from "@/lib/catalog-public";
import { WORK } from "@/lib/content";

/** 404 body — same grouping and layout as the HTML sitemap. */
export async function NotFoundView() {
  const [blogPosts, products] = await Promise.all([
    listPublishedPosts().catch(() => []),
    listStorefrontProducts().catch(() => []),
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
    <LegalShell title="Page not found" lede="That URL isn’t here. Use the links below — same map as the sitemap — or head home.">
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
        <p className="mt5">
          <a className="btn" href="/">
            Back to home
          </a>{" "}
          <a className="btn btn--line" href="/sitemap">
            Full sitemap
          </a>
        </p>
      </div>
    </LegalShell>
  );
}
