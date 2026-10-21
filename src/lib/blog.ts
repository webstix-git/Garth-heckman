export const BLOG_FILTERS = ["all", "marriage", "generations", "evangelism"] as const;

export type BlogFilter = (typeof BLOG_FILTERS)[number];

/** Site blog categories — same names as the /blog filter chips (minus "all"). */
export const BLOG_SITE_CATEGORIES = [
  { tag: "marriage", label: "Marriage" },
  { tag: "generations", label: "Generations" },
  { tag: "evangelism", label: "Evangelism" },
] as const;

export type BlogSiteCategoryLabel = (typeof BLOG_SITE_CATEGORIES)[number]["label"];

export type BlogPost = {
  slug: string;
  tag: string;
  tagLabel: string;
  read: string;
  date: string;
  dateLong: string;
  v: "warm" | "dark" | "cool" | "light";
  t: string;
  h1: [string, string];
  lede: string;
  tldr: string;
  d: string;
  img: string;
  imgAlt: string;
  imgNote: string;
  badges: string[];
  quote: { text: string; cite: string };
  cta: { kicker: string; t: string; d: string; href: string; btn: string };
  /** HTML article body from the CMS */
  content?: string;
  seo?: {
    title?: string;
    description?: string;
    noindex?: boolean;
    nofollow?: boolean;
  };
};

/**
 * @deprecated Prefer listPublishedPosts() / getPublishedPost().
 * Kept as empty fallback for client modules that still import a sync constant.
 */
export const BLOG_POSTS: BlogPost[] = [];

export function getPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function otherPosts(slug: string) {
  return BLOG_POSTS.filter((p) => p.slug !== slug);
}
