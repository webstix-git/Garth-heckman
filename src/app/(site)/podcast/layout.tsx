import type { Metadata } from "next";
import type { ReactNode } from "react";

import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = pageSeo("/podcast");

export default function PodcastLayout({ children }: { children: ReactNode }) {
  return children;
}
