import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Analytics } from "@/components/seo/Analytics";
import { JsonLd } from "@/components/seo/JsonLd";
import { fetchStoreSettings } from "@/lib/settings-supabase";
import { pageSeo, siteVerificationMetadata, SITE_NAME } from "@/lib/seo";
import { robotsMetadata } from "@/lib/seo-robots";
import { getSiteUrl } from "@/lib/site-url";
import { organizationSchema, personSchema, websiteSchema } from "@/lib/structured-data";
import { GARTH_STORE_ID, getRequestStore } from "@/lib/tenant-store";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestStore();
  if (tenant.id !== GARTH_STORE_ID) {
    return {
      title: { default: tenant.name, template: `%s | ${tenant.name}` },
      description: `Shop ${tenant.name}.`,
      openGraph: { type: "website", siteName: tenant.name, locale: "en_US" },
    };
  }
  const { settings } = await fetchStoreSettings();
  const home = pageSeo("/", { globalNoindex: settings.seo?.noindex });
  const canonicalHome = `${getSiteUrl()}/`;
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: typeof home.title === "object" && home.title && "absolute" in home.title
        ? String(home.title.absolute)
        : `${SITE_NAME} | Coach, Pastor & Generational Strategist`,
      template: `%s | ${SITE_NAME}`,
    },
    description: home.description,
    openGraph: home.openGraph,
    twitter: home.twitter,
    alternates: {
      canonical: canonicalHome,
      languages: {
        en: canonicalHome,
        "x-default": canonicalHome,
      },
    },
    verification: siteVerificationMetadata(),
    robots: robotsMetadata({ globalNoindex: settings.seo?.noindex }),
  };
}

/**
 * Minimal document shell. Storefront styles live in `(site)/layout`.
 * Admin styles live in `(admin-portal)/layout` — do not import design-system here.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-full antialiased">
        <JsonLd id="ld-organization" data={organizationSchema()} />
        <JsonLd id="ld-person" data={personSchema()} />
        <JsonLd id="ld-website" data={websiteSchema()} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
