import type { Metadata } from "next";

import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import { robotsMetadata } from "@/lib/seo-robots";

export const SITE_NAME = "Garth Heckman";
export const DEFAULT_OG_IMAGE = "/assets/img/gh-logo.png";

export type PageSeo = {
  /** Path without domain, e.g. /speaking */
  path: string;
  /** Browser tab / SERP title (template appends | Garth Heckman unless absolute) */
  title: string;
  /** Use absolute title (no template suffix) — home and a few brand pages */
  absoluteTitle?: boolean;
  description: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogImage?: string;
};

/** Indexable marketing pages — titles/descriptions written for search intent. */
export const PAGE_SEO: Record<string, PageSeo> = {
  "/": {
    path: "/",
    title: "Garth Heckman | Coach, Pastor & Generational Strategist",
    absoluteTitle: true,
    description:
      "42 years in ministry, business, and coaching. Book Garth to speak, explore coaching & Bridgeworks, or shop WTFU—resources that help you make God look good.",
  },
  "/speaking": {
    path: "/speaking",
    title: "Book Garth Heckman to Speak at Your Next Event",
    description:
      "Invite Garth Heckman for conferences, churches, staff days, and student nights. Decades of stage-tested talks on faith, leadership, adversity, and five generations in one room.",
  },
  "/coaching": {
    path: "/coaching",
    title: "Coaching with Garth Heckman | Fitness, Faith & Whole-Life Growth",
    description:
      "Personal coaching that covers nutrition, training, and the emotional, mental, social, and spiritual work underneath it. Straight talk for people ready to change.",
  },
  "/work": {
    path: "/work",
    title: "What Garth Heckman Does | Coaching, Speaking & Ministry Work",
    description:
      "Explore Garth’s work: coaching, speaking, cancer support, Simply Church, Relationship Recall, and Bridgeworks—six rooms, one mission to help people and organizations grow.",
  },
  "/story": {
    path: "/story",
    title: "Garth Heckman’s Story | Ministry, Survival & Six Grandchildren",
    description:
      "Raised in ministry, forged by fire. Read Garth Heckman’s story of 42 years in ministry and business, surviving cancer and injury, and still asking better questions.",
  },
  "/cancer": {
    path: "/cancer",
    title: "Cancer Support from a Triple C Survivor | Garth Heckman",
    description:
      "Hope and honest conversation for people in the fight. Garth Heckman—a Triple C survivor—shares resources, perspective, and a place to start when today is a hard day.",
  },
  "/bridgeworks": {
    path: "/bridgeworks",
    title: "Bridgeworks | Generational Intelligence for Churches & Teams",
    description:
      "Train your church or business to Understand, Attract, Connect, and Disciple across five generations. Book a Bridgeworks session or Connected Kingdom seminar with Garth.",
  },
  "/simply-church": {
    path: "/simply-church",
    title: "Simply Church | Start a Living-Room Gathering Where You Are",
    description:
      "Acts 2 without the building. Learn how Simply Church works and how to start a small gathering in your living room—faithful, simple, and built for real relationship.",
  },
  "/relationship-recall": {
    path: "/relationship-recall",
    title: "Relationship Recall | Weekly Coaching for Stronger Relationships",
    description:
      "Most coaching paints a burning house. Relationship Recall finds foundation cracks, exposes them, and rebuilds—one practical email a week from Garth Heckman.",
  },
  "/ask-garth": {
    path: "/ask-garth",
    title: "Straight from Garth | Five Topics, Five Straight Answers",
    description:
      "Direct answers from Garth Heckman on faith, discipline, leadership, relationships, and calling. Five topics. Five questions. Five answers—then ask him your own.",
  },
  "/store": {
    path: "/store",
    title: "Shop Books, Downloads & Merch | Garth Heckman Store",
    description:
      "Browse Garth Heckman’s store for books including WTFU, digital downloads, and branded merchandise. Secure checkout with downloads ready after payment.",
  },
  "/podcast": {
    path: "/podcast",
    title: "The David Alliance Podcast with Garth Heckman",
    description:
      "Listen to The David Alliance with Garth Heckman—honest conversations on faith, leadership, and living with clarity. New episodes and recent shows in one place.",
  },
  "/blog": {
    path: "/blog",
    title: "Blog | Faith, Leadership & Life Notes from Garth Heckman",
    description:
      "Articles from Garth Heckman on ministry, leadership, adversity, and practical faith. Read the latest posts and archive by topic.",
  },
  "/shorts": {
    path: "/shorts",
    title: "YouTube Shorts | Quick Takes from Garth Heckman",
    description:
      "Short-form video from Garth Heckman—quick teaching, humor, and straight talk. Browse the Shorts library and watch the latest clips.",
  },
  "/contact": {
    path: "/contact",
    title: "Contact Garth Heckman | Speaking, Orders & Store Support",
    description:
      "Reach Garth’s team for speaking bookings, product questions, order help, or account support. Send a message or call—(952) 240-7152 · Apple Valley, MN.",
  },
  "/service-index": {
    path: "/service-index",
    title: "Services Index | Coaching, Speaking, Church & More",
    description:
      "A clear index of Garth Heckman’s services: coaching, speaking, cancer support, Simply Church, Relationship Recall, and Bridgeworks.",
  },
  "/sitemap": {
    path: "/sitemap",
    title: "HTML Sitemap | Every Public Page on GarthHeckman.com",
    description:
      "Browse every public page on Garth Heckman’s site—work, podcast, blog, store, and policies—in one organized list for people and search engines.",
  },
  "/privacy": {
    path: "/privacy",
    title: "Privacy Policy | How GarthHeckman.com Uses Your Data",
    description:
      "What garthheckman.com collects, why we collect it, and how to request your data. Clear privacy terms for the store, forms, and email lists.",
  },
  "/ai-policy": {
    path: "/ai-policy",
    title: "AI Policy | How This Site Uses Artificial Intelligence",
    description:
      "How garthheckman.com uses AI in development and content production—and what it does not do with your data. Straight answers if you want a human instead.",
  },
};

export function pageSeo(
  path: string,
  overrides?: Partial<PageSeo> & {
    globalNoindex?: boolean;
  },
): Metadata {
  const base = PAGE_SEO[path] || {
    path,
    title: SITE_NAME,
    description: PAGE_SEO["/"]!.description,
  };
  const cleaned = Object.fromEntries(
    Object.entries(overrides || {}).filter(([, value]) => value !== undefined),
  ) as Partial<PageSeo> & { globalNoindex?: boolean };
  const entry: PageSeo = { ...base, ...cleaned, path: cleaned.path || base.path };
  const canonical = absoluteUrl(entry.path);
  const image = absoluteUrl(entry.ogImage || DEFAULT_OG_IMAGE);
  const title = entry.absoluteTitle
    ? ({ absolute: entry.title } as const)
    : entry.title;

  return {
    title,
    description: entry.description,
    alternates: {
      canonical,
      languages: {
        en: canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_US",
      title: entry.title,
      description: entry.description,
      images: [{ url: image, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.description,
      images: [image],
    },
    robots: robotsMetadata({
      globalNoindex: overrides?.globalNoindex,
      noindex: entry.noindex,
      nofollow: entry.nofollow,
    }),
  };
}

export function dynamicPageSeo(input: {
  path: string;
  title: string;
  description?: string | null;
  absoluteTitle?: boolean;
  image?: string | null;
  noindex?: boolean;
  nofollow?: boolean;
  globalNoindex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const canonical = absoluteUrl(input.path);
  const image = absoluteUrl(input.image || DEFAULT_OG_IMAGE);
  const description =
    (input.description || "").trim() ||
    PAGE_SEO["/"]!.description;

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description,
    alternates: {
      canonical,
      languages: {
        en: canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      type: input.type || "website",
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_US",
      title: input.title,
      description,
      images: [{ url: image, alt: input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [image],
    },
    robots: robotsMetadata({
      globalNoindex: input.globalNoindex,
      noindex: input.noindex,
      nofollow: input.nofollow,
    }),
  };
}

export function siteVerificationMetadata(): Metadata["verification"] | undefined {
  // Search Console HTML-tag token (content=…). Env override, else Garth live token.
  const google = (
    process.env.NEXT_PUBLIC_GSC_VERIFICATION
    || process.env.GOOGLE_SITE_VERIFICATION
    || "NGghwgyrEC9HPRki8064X8Z8H0vFt1gl60b7o5hmp4o"
  ).trim();
  if (!google) return undefined;
  return { google };
}

export { getSiteUrl, absoluteUrl };
