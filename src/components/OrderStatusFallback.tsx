"use client";

import { SiteChrome } from "@/components/chrome/SiteChrome";

/** Suspense placeholder so TopNav is present while useSearchParams resolves. */
export function OrderStatusFallback() {
  return (
    <SiteChrome nav="store">
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap">
            <p className="meta meta--dim">Loading your order…</p>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
