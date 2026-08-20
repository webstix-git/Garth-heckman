import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";

export const metadata: Metadata = {
  title: "Bridgeworks",
  description: "Ask Garth to teach your business, church or church staff how to Understand, Attract, Connect and Disciple. Generational intelligence for the whole room.",
};

export default function Page() {
  return (
    <SiteChrome nav="work">
      <main id="main">
        <section className="phead on-dark grain" style={{ background: "linear-gradient(168deg,#1A2027 0%,#0E0C0A 62%,#0A0806 100%)" }}>
            <div className="wrap">
              <nav className="crumbs meta mb4" aria-label="Breadcrumb">
                <a href="/">Home</a><s>/</s><a href="/work">What I Do</a><s>/</s><span>Bridgeworks</span>
              </nav>
              <div className="split split-a" style={{ alignItems: "end" }}>
                <div>
                  <p className="meta meta--gold">Bridgeworks</p>
                  <h1 className="d1 mt3">Five<br />generations.<br />One room.</h1>
                  <p className="lede mt5 mw dim">
                    Garth&apos;s work with Bridgeworks specializes in generational intelligence and
                    managing a multigenerational church, focused squarely on retention and
                    connection.
                  </p>
                  <div className="row mt5">
                    <a className="btn btn--lg" href="#call">Book a discovery call</a>
                    <a className="btn btn--line btn--lg" href="/product/generations-training-deck">Get the free deck</a>
                  </div>
                </div>
                <Shot variant="cool" ratio="4-3" label="Leadership team" note="Staff room · five ages, one table" src="/assets/img/room-bridgeworks.png" />
              </div>
            </div>
          </section>

          <section className="sec tint">
            <div className="wrap split split-a" style={{ alignItems: "start" }}>
              <div data-rv>
                <p className="meta meta--gold">The work</p>
                <h2 className="d2 mt3">Everybody in the room heard a different sermon.</h2>
                <div className="prose mt4">
                  <p>
                    Today Garth works with churches, ministries, businesses and leadership teams to
                    strengthen multigenerational engagement, develop healthy cultures, improve
                    communication and equip leaders to navigate a rapidly changing world.
                  </p>
                  <p>
                    The engagement runs with the senior pastor, the staff and the congregation
                    together, bringing a new understanding and a plan of attack that leverages
                    what your church already does best, rather than importing somebody else&apos;s model.
                  </p>
                  <p>
                    <strong>Next step:</strong> ask Garth to teach your business, church or church
                    staff how to Understand, Attract, Connect and Disciple.
                  </p>
                </div>
              </div>
              <div className="card" data-rv="120">
                <p className="meta meta--gold">What it covers</p>
                <div className="prose mt3">
                  <ul>
                    <li>Generational intelligence for your specific congregation</li>
                    <li>Retention: why each generation leaves, and when</li>
                    <li>Connection across age groups that survives a staff change</li>
                    <li>Communication that lands in five directions at once</li>
                    <li>Culture work with the senior pastor and staff</li>
                    <li>A written plan of attack, not a workshop hangover</li>
                  </ul>
                </div>
                <p className="card__foot"><a className="tlink" href="/product/generations-training-deck">Get the free deck</a></p>
              </div>
            </div>
          </section>

          <section className="sec">
            <div className="wrap">
              <div className="center mb6" data-rv>
                <p className="meta meta--gold">The generations</p>
                <h2 className="d2 mt3">Same church.<br />Five different churches.</h2>
              </div>
              {/* The page's own idea. Everyone heard a different sermon, so let the
                   reader hear each one. Same Sunday, five readings. */}
              <div className="gens mt6" data-rv>
                <ul className="gens__list" role="tablist" aria-label="Generations" id="gensList"></ul>
                <div id="gensPanels"></div>
              </div>

              <p className="body sm center mt6 mw-l" style={{ marginInline: "auto" }}>The problem is almost never that one of these groups is wrong. It is that nobody has translated between them.</p>
            </div>
          </section>

          <section className="sec tint" id="call">
            <div className="wrap-t center">
              <p className="meta meta--gold">Next step</p>
              <h2 className="d2 mt4">Fifteen minutes,<br />no pitch.</h2>
              <p className="lede mt4 dim">
                Ask Garth to teach your business, church or church staff how to Understand, Attract,
                Connect and Disciple. Get on the email list, or set up a fifteen-minute discovery
                call. Connect with Garth at{" "}
                <a href="mailto:heckman@generations.com" style={{ color: "var(--gold-dp)", textDecoration: "underline", textUnderlineOffset: "3px" }}>heckman@generations.com</a>.
              </p>
              <div className="row mt5" style={{ justifyContent: "center" }}>
                <a className="btn btn--lg" href="mailto:heckman@generations.com">Book the call</a>
                <a className="btn btn--line btn--lg" href="/contact">Join the email list</a>
              </div>
            </div>
          </section>
      </main>
    </SiteChrome>
  );
}
