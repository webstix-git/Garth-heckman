import type { Metadata } from "next";
import type { ReactNode } from "react";

import { fetchStoreSettings } from "@/lib/settings-supabase";
import { robotsMetadata } from "@/lib/seo-robots";
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
  return {
    metadataBase: new URL("https://garthheckman.com"),
    title: {
      default: "Garth Heckman | Coach, Pastor, Author, Generational Strategist",
      template: "%s | Garth Heckman",
    },
    description:
      "Forty-two years in ministry, business and coaching. Speaking, coaching, Simply Church, Bridgeworks, and the WTFU book.",
    openGraph: { type: "website", siteName: "Garth Heckman", locale: "en_US" },
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
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
