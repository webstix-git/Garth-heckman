import type { Metadata } from "next";
import { pageSeo } from "@/lib/seo";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { RelatedLinks } from "@/components/seo/RelatedLinks";
import { Shot } from "@/components/Shot";

export const metadata: Metadata = pageSeo("/simply-church");

export default function Page() {
  return (
    <SiteChrome nav="work">
      <main id="main">
        <section className="phead on-dark grain" style={{ background: "linear-gradient(168deg,#1A2027 0%,#0E0C0A 62%,#0A0806 100%)" }}>
            <div className="wrap">
              <nav className="crumbs meta mb4" aria-label="Breadcrumb">
                <a href="/">Home</a><s>/</s><a href="/work">What I Do</a><s>/</s><span>Simply Church</span>
              </nav>
              <p className="meta meta--gold">Simply Church</p>
              <h1 className="d1 mt3">Church beyond<br />the building</h1>
              <div className="between mt5" style={{ alignItems: "flex-end" }}>
                <p className="lede mw dim">
                  One of Garth's real passions is watching people connect and build deep,
                  faith-abiding relationships, much like the first church in Acts 2. The goal:
                  a thousand churches gathering in living rooms across the country.
                </p>
                <div className="row">
                  <a className="btn btn--lg" href="#start">Start one</a>
                  <a className="btn btn--line btn--lg" href="#how">How it works</a>
                </div>
              </div>
            </div>
          </section>

          <section className="sec" id="how">
            <div className="wrap">
              <div className="between mb6" data-rv>
                <div>
                  <p className="meta meta--gold">How it works</p>
                  <h2 className="d2 mt3">There is no<br />franchise kit.</h2>
                </div>
                <p className="body sm" style={{ maxWidth: "36ch" }}>You need a room, a few people and a willingness to be honest. Garth will help with the rest.</p>
              </div>
              <div className="grid g4 hair" data-rv data-stagger>
                <div><p className="card__n">1</p><h3 className="card__t">Open your home</h3><p className="card__d">A living room, a kitchen table, a garage. The building was never the point.</p></div>
                <div><p className="card__n">2</p><h3 className="card__t">Invite the few</h3><p className="card__d">Start with the people already in your life. Growth is not the first-year metric.</p></div>
                <div><p className="card__n">3</p><h3 className="card__t">Eat, read, pray</h3><p className="card__d">Acts 2 is not complicated. Break bread, teach, pray, share what you have.</p></div>
                <div><p className="card__n">4</p><h3 className="card__t">Stay connected</h3><p className="card__d">Garth checks in with the network, answers the awkward questions, and keeps you from reinventing the wheel.</p></div>
              </div>
            </div>
          </section>

          <section className="sec tint">
            <div className="wrap split">
              <div data-rv>
                <Shot variant="pale" ratio="16-9" label="Simply Church" note="Gathering · New Prague" src="/assets/img/room-church.png" anchor="top" />
              </div>
              <div data-rv="120">
                <p className="meta meta--gold">The goal</p>
                <h2 className="d1 mt3" style={{ fontSize: "clamp(3rem,7vw,6rem)" }}>1,000<br />living<br />rooms</h2>
                <p className="lede mt5 mw-s dim">
                  Not a thousand campuses. A thousand rooms where people actually know each other's
                  names, and each other's worst week.
                </p>
              </div>
            </div>
          </section>

          <section className="sec" id="start">
            <div className="wrap-t">
              <div className="center">
                <p className="meta meta--gold">Start one</p>
                <h2 className="d2 mt4">Would you like to start a church in your living room?</h2>
                <p className="lede mt4 dim">Send Garth a message with your city and state, and he will get you going.</p>
                <a className="btn btn--lg mt6" href="/contact">Count me in</a>
              </div>
            </div>
          </section>
        <RelatedLinks
          title="Related"
          links={[
            { href: "/bridgeworks", label: "Bridgeworks", note: "Generational tools for the whole church." },
            { href: "/speaking", label: "Speaking", note: "Bring Garth to your next gathering." },
            { href: "/contact", label: "Start a Simply Church", note: "Tell Garth your city and state." },
          ]}
        />
      </main>
    </SiteChrome>
  );
}
