import type { Metadata } from "next";
import type { ReactNode } from "react";

import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = pageSeo("/blog");

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
