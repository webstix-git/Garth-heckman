import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";

export const metadata: Metadata = {
  title: "Simply Church",
  description: "A thousand churches gathering in living rooms across the country. Acts 2, minus the building. Start one where you are.",
};

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
                <p className="lede mt4 dim">Leave your details and Garth will get you going.</p>
              </div>
              <form className="card mt6" id="scForm" noValidate>
                <div className="field-row">
                  <div className="field"><label className="label" htmlFor="cname">Name<span className="req">*</span></label><input className="input" id="cname" required /></div>
                  <div className="field"><label className="label" htmlFor="cemail">Email<span className="req">*</span></label><input className="input" id="cemail" type="email" required /></div>
                </div>
                <div className="field"><label className="label" htmlFor="ccity">City &amp; state</label><input className="input" id="ccity" /></div>
                <div className="field"><label className="label" htmlFor="cmsg">Anything Garth should know</label><textarea className="textarea" id="cmsg"></textarea></div>
                <div id="scOk" hidden className="notice notice--ok mt3"><span></span></div>
                <button className="btn btn--lg btn--block mt4" type="submit">Count me in</button>
              </form>
            </div>
          </section>
      </main>
    </SiteChrome>
  );
}
