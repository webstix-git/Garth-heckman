import type { Metadata } from "next";

/** Build Next.js robots metadata from global + per-page SEO flags.
 * Always emits an explicit robots value so SERP tools see a meta robots tag
 * (index,follow by default — not "missing"). */
export function robotsMetadata(opts: {
  globalNoindex?: boolean;
  noindex?: boolean;
  nofollow?: boolean;
}): Metadata["robots"] {
  const index = !(opts.globalNoindex || opts.noindex);
  const follow = !opts.nofollow;
  return {
    index,
    follow,
    googleBot: {
      index,
      follow,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

/** HTTP header value matching the public-page robots meta. */
export function xRobotsTagHeader(opts?: { noindex?: boolean; nofollow?: boolean }) {
  const index = opts?.noindex ? "noindex" : "index";
  const follow = opts?.nofollow ? "nofollow" : "follow";
  return `${index}, ${follow}, max-image-preview:large, max-snippet:-1, max-video-preview:-1`;
}
