import type { ReactNode } from "react";

import { Providers } from "@/components/Providers";
import "@/styles/design-system.css";

/**
 * Archivo is loaded via @font-face in design-system.css (self-hosted under
 * /fonts). next/font was corrupting the Latin unicode-range to `U+??`, which
 * made every English glyph fall through to Times New Roman on Linux.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-root min-h-full">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Providers>{children}</Providers>
    </div>
  );
}
