import {
  GARTH_ADDRESS_LINE1,
  GARTH_ADDRESS_LINE2,
  GARTH_EMAIL,
  GARTH_PHONE_TEL,
} from "@/lib/links";
import { SOCIALS } from "@/lib/nav";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import { SITE_NAME } from "@/lib/seo";

export function organizationSchema() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name: SITE_NAME,
    url,
    email: GARTH_EMAIL,
    telephone: GARTH_PHONE_TEL,
    logo: absoluteUrl("/assets/img/gh-logo.png"),
    image: absoluteUrl("/assets/img/gh-logo.png"),
    address: {
      "@type": "PostalAddress",
      streetAddress: GARTH_ADDRESS_LINE1,
      addressLocality: "Apple Valley",
      addressRegion: "MN",
      postalCode: "55124",
      addressCountry: "US",
    },
    sameAs: SOCIALS.map((s) => s.href),
  };
}

export function personSchema() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}/#person`,
    name: SITE_NAME,
    url,
    jobTitle: "Coach, Pastor, Author, Generational Strategist",
    worksFor: { "@id": `${url}/#organization` },
    email: GARTH_EMAIL,
    telephone: GARTH_PHONE_TEL,
    image: absoluteUrl("/assets/img/gh-logo.png"),
    description:
      "Coach, pastor, author, and generational strategist with forty-two years in ministry, business, and coaching.",
  };
}

export function websiteSchema() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name: SITE_NAME,
    url,
    publisher: { "@id": `${url}/#organization` },
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Garth Heckman",
    url: absoluteUrl("/contact"),
    mainEntity: {
      "@type": "Organization",
      name: SITE_NAME,
      email: GARTH_EMAIL,
      telephone: GARTH_PHONE_TEL,
      address: {
        "@type": "PostalAddress",
        streetAddress: GARTH_ADDRESS_LINE1,
        addressLocality: "Apple Valley",
        addressRegion: "MN",
        postalCode: "55124",
        addressCountry: "US",
        description: GARTH_ADDRESS_LINE2,
      },
    },
  };
}

export function productSchema(input: {
  name: string;
  description: string;
  slug: string;
  image?: string | null;
  priceCents?: number | null;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
}) {
  const url = absoluteUrl(`/product/${input.slug}`);
  const offer =
    typeof input.priceCents === "number"
      ? {
          "@type": "Offer",
          url,
          priceCurrency: input.currency || "USD",
          price: (input.priceCents / 100).toFixed(2),
          availability: `https://schema.org/${input.availability || "InStock"}`,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url,
    image: input.image ? [input.image.startsWith("http") ? input.image : absoluteUrl(input.image)] : undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(offer ? { offers: offer } : {}),
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  slug: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
}) {
  const url = absoluteUrl(`/blog/${input.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: url,
    image: input.image ? [input.image.startsWith("http") ? input.image : absoluteUrl(input.image)] : undefined,
    author: { "@id": `${getSiteUrl()}/#person` },
    publisher: { "@id": `${getSiteUrl()}/#organization` },
    datePublished: input.datePublished || undefined,
    dateModified: input.dateModified || input.datePublished || undefined,
  };
}
