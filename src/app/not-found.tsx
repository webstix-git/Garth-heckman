import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { NotFoundView } from "@/components/NotFoundView";
import "@/styles/design-system.css";

export const metadata: Metadata = {
  title: "Page not found",
};

/** Global 404 — same look as /sitemap (site chrome + grouped links). */
export default function NotFound() {
  return (
    <div className="site-root min-h-full">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Providers>
        <NotFoundView />
      </Providers>
    </div>
  );
}
