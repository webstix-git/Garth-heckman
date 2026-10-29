import type { Metadata } from "next";
import { pageSeo } from "@/lib/seo";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { RelatedLinks } from "@/components/seo/RelatedLinks";
import { WorkSwitcher } from "@/components/WorkSwitcher";

export const metadata: Metadata = pageSeo("/work");

export default function WorkPage() {
  return (
    <SiteChrome nav="work">
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <span>What I Do</span>
            </nav>
            <p className="meta meta--gold">What I do</p>
            <h1 className="d1 mt3">
              Six rooms.
              <br />
              Same job.
            </h1>
            <p className="lede mt5 mw dim">
              Coaching, speaking, cancer, church, marriage, generations. The work changes shape depending on who is in
              front of him. The point does not: help people wake up and get moving.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <WorkSwitcher />
          </div>
        </section>

        <section className="band">
          <div className="wrap band__in">
            <div>
              <p className="meta">Not sure which one</p>
              <p className="d3 band__line mt2">Tell Garth where you are and he will point you at the right door.</p>
            </div>
            <div className="row">
              <a className="btn btn--ink btn--lg" href="/contact">
                Start a conversation
              </a>
            </div>
          </div>
        </section>
        <RelatedLinks
          title="Go deeper"
          links={[
            { href: "/speaking", label: "Speaking", note: "Book Garth for conferences and churches." },
            { href: "/coaching", label: "Coaching", note: "Whole-person coaching for people ready to move." },
            { href: "/store", label: "Store", note: "Books, downloads, and merch." },
          ]}
        />
      </main>
    </SiteChrome>
  );
}
