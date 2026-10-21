import type { Metadata } from "next";

/** Build Next.js robots metadata from global + per-page SEO flags. */
export function robotsMetadata(opts: {
  globalNoindex?: boolean;
  noindex?: boolean;
  nofollow?: boolean;
}): Metadata["robots"] | undefined {
  const index = !(opts.globalNoindex || opts.noindex);
  const follow = !opts.nofollow;
  if (index && follow) return undefined;
  return { index, follow };
}
