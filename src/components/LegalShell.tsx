import type { ReactNode } from "react";
import { SiteChrome } from "@/components/chrome/SiteChrome";

export function LegalShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <SiteChrome nav="">
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <span>{title}</span>
            </nav>
            <h1 className="d1">{title}</h1>
            {lede ? <p className="lede mt5 mw dim">{lede}</p> : null}
          </div>
        </section>
        <section className="sec">{children}</section>
      </main>
    </SiteChrome>
  );
}
