import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { WorkSwitcher } from "@/components/WorkSwitcher";

export const metadata: Metadata = {
  title: "What I Do",
  description: "Coaching, speaking, cancer, Simply Church, Relationship Recall and Bridgeworks. Six rooms, same job.",
};

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
      </main>
    </SiteChrome>
  );
}
