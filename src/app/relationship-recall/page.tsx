import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";

export const metadata: Metadata = {
  title: "Relationship Recall",
  description: "Most coaching paints a burning house. Relationship Recall finds the cracks in the foundation, exposes them and rebuilds. One email a week.",
};

export default function Page() {
  return (
    <SiteChrome nav="work">
      <main id="main">
        <section className="phead on-dark grain">
            <div className="wrap">
              <nav className="crumbs meta mb4" aria-label="Breadcrumb">
                <a href="/">Home</a><s>/</s><a href="/work">What I Do</a><s>/</s><span>Relationship Recall</span>
              </nav>
              <p className="meta meta--gold">Relationship Recall</p>
              <h1 className="d1 rr-head mt3">I'm going to try<br />to break up your<br />relationship.</h1>
              <p className="d3 mt4" style={{ color: "var(--acc)" }}>Every week. It's true.</p>
            </div>
          </section>

          <section className="sec tint">
            <div className="wrap split">
              <div data-rv>
                <p className="meta meta--gold">The premise</p>
                <h2 className="d2 mt3">Most coaches paint a burning house.</h2>
                <div className="prose mt4">
                  <p>
                    Most coaches and counselors encourage, teach and equip couples. Useful, but to
                    Garth that is decorating something that is already on fire.
                  </p>
                  <p>
                    <strong>What he does instead:</strong> find out what will actually break you up.
                    Find the cracks in the foundation. Expose them. Rebuild them. Give you a total
                    recall.
                  </p>
                  <p>
                    It is uncomfortable by design. It is also the reason the Relationship Series has
                    kept filling rooms for years.
                  </p>
                </div>
                <div className="row mt5"><a className="btn btn--lg" href="#signup">Get the first email</a></div>
              </div>
              <div data-rv="120">
                <Shot variant="warm" ratio="4-5" label="Editorial" note="Two chairs, one hard conversation" src="/assets/img/room-relationship.png" />
              </div>
            </div>
          </section>

          <section className="sec">
            <div className="wrap">
              <div className="between mb6" data-rv>
                <div>
                  <p className="meta meta--gold">How the week works</p>
                  <h2 className="d2 mt3">Four steps.<br />One email.</h2>
                </div>
              </div>
              {/* The page's own idea. The method is about a crack in a foundation,
                   so the four steps sit on one: a hairline that opens up, then gets
                   closed again. */}
              <div className="crack" data-rv>
                <div className="crack__line" id="crackLine" aria-hidden="true">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0 60 L300 60 L420 24 L560 92 L700 34 L840 60 L1200 60"/>
                    <path className="lit" d="M0 60 L300 60 L420 24 L560 92 L700 34 L840 60 L1200 60"/>
                  </svg>
                </div>

                <div className="crack__marks" data-rv data-stagger>
                  <div className="crack__m"><b>1 · Find it</b><p>One question a week, aimed squarely at whatever you have both been carefully not saying.</p></div>
                  <div className="crack__m"><b>2 · Expose it</b><p>You say it out loud to each other. That is the whole exercise, and it is harder than it sounds.</p></div>
                  <div className="crack__m"><b>3 · Rebuild it</b><p>A specific, practical repair, not a platitude about communication.</p></div>
                  <div className="crack__m"><b>4 · Recall</b><p>Over months the foundation gets re-poured. That is the total recall.</p></div>
                </div>
              </div>
            </div>
          </section>

          <section className="sec tint" id="signup">
            <div className="wrap-t center">
              <p className="meta meta--gold">Sign up</p>
              <h2 className="d2 mt4">Sign up here for your first email.</h2>
              <p className="lede mt4 dim">One a week. Unsubscribe whenever, though the people who need it most rarely do.</p>
              <form className="row mt5" id="rrForm" noValidate style={{ justifyContent: "center", flexWrap: "nowrap", maxWidth: "480px", marginInline: "auto", gap: "10px" }}>
                <label className="sr" htmlFor="rrEmail">Email address</label>
                <input className="input" id="rrEmail" type="email" placeholder="you@example.com" required />
                <button className="btn" type="submit" style={{ flex: "none" }}>Start</button>
              </form>
              <div id="rrOk" hidden className="notice notice--ok mt4" style={{ maxWidth: "480px", marginInline: "auto", textAlign: "left" }}><span></span></div>
            </div>
          </section>
      </main>
    </SiteChrome>
  );
}
