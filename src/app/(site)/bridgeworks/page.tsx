import type { Metadata } from "next";
import { pageSeo } from "@/lib/seo";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { RelatedLinks } from "@/components/seo/RelatedLinks";
import { Shot } from "@/components/Shot";
import { GARTH_EMAIL, GARTH_MAILTO, mailtoHref } from "@/lib/links";

export const metadata: Metadata = pageSeo("/bridgeworks");

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
                <Shot variant="cool" ratio="4-3" label="Leadership team" note="The room, packed" src="/assets/img/room-bridgeworks.png" anchor="top" />
              </div>
            </div>
          </section>

          <section className="sec">
            <div className="wrap split split-a" style={{ alignItems: "start" }}>
              <div>
                <h2 className="d2">Reaching Every Generation for Christ</h2>
                <div className="prose mt4">
                  <p>
                    <em>
                      “Too many pastors are more worried about butts in seats than souls in
                      hell.”
                    </em>{" "}
                    (Phillip Anthony Mitchel)
                  </p>
                  <p>
                    It’s a blunt line, but most pastors already feel its weight. They don’t
                    want empty pews for the sake of numbers. They want people found, discipled,
                    and brought home. And in many small churches, that calling comes wrapped in
                    real fears: a shrinking congregation, tight budgets, conflict that could
                    split the church, and the quiet worry that the work isn’t bearing fruit.
                  </p>
                  <p>
                    Behind many of those fears is something rarely named: <em>a generation gap.</em>
                  </p>
                  <p>
                    Boomers, Gen X, Millennials, and Gen Z often worship, communicate, serve,
                    and give differently. When those differences go unexamined, they become
                    misunderstandings. Younger families drift away without anyone knowing why.
                    Longtime members feel their church is being taken from them. Leaders burn
                    out trying to please everyone, and the people outside the church never feel
                    invited in.
                  </p>
                  <p>
                    <strong>That’s where Garth Heckman comes in.</strong>
                  </p>
                  <p>
                    With more than four decades of experience as a pastor, entrepreneur,
                    author, speaker, and coach, Garth has lived on both sides of the pulpit. He
                    helps pastors and church leaders:
                  </p>
                  <ul>
                    <li>
                      <strong>Understand each generation</strong> without stereotypes, seeing the values,
                      hopes, and wounds that shape how people approach faith and community
                    </li>
                    <li>
                      <strong>Build trust across age groups</strong> so your congregation becomes a family,
                      not a collection of camps
                    </li>
                    <li>
                      <strong>Communicate with clarity</strong> in sermons, staff meetings, and everyday
                      conversations
                    </li>
                    <li>
                      <strong>Lead through change</strong> without leaving people behind
                    </li>
                    <li>
                      <strong>Reach people for Christ</strong> by removing barriers the gospel was never
                      meant to carry
                    </li>
                  </ul>
                  <p>
                    Garth doesn’t hand down a formula. His coaching starts with listening well
                    and asking thoughtful questions, then helping you discover solutions that
                    fit your values, your people, and your mission. Every church is different,
                    and your path forward should be too.
                  </p>
                  <p>
                    The goal was never full seats. It’s full lives, changed by the gospel,
                    across every generation God has placed in your community.
                  </p>
                  <p>
                    <strong>Ready to bridge the gap? Let’s talk.</strong>{" "}
                    <a href={GARTH_MAILTO}>{GARTH_EMAIL}</a>
                    {" "}and the Bridgeworks website:{" "}
                    <a href="https://generations.com" target="_blank" rel="noopener noreferrer">
                      Generations.com
                    </a>
                  </p>
                </div>
              </div>
              <div>
                <Shot
                  variant="cool"
                  ratio="4-3"
                  label="Bridgeworks"
                  note="Reaching every generation"
                  src="/assets/img/room-bridgeworks.png"
                  anchor="top"
                />
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

          <section className="sec tint">
            <div className="wrap split split-a" style={{ alignItems: "start" }}>
              <div data-rv>
                <p className="meta meta--gold">Connected Kingdom Seminar</p>
                <h2 className="d2 mt3">One day.<br />A more connected church.</h2>
                <div className="prose mt4">
                  <p>
                    A Pastor and Staff that better understand Generations creates a church that is connected
                    across all ages and stages. Making it a more credible, attractive and effective witness
                    to people who don&apos;t know Christ.
                  </p>
                  <p>
                    This one-day seminar helps church leaders move from generational awareness to practical
                    vision, outreach, discipleship and execution.
                  </p>
                </div>
                <p className="mt5">
                  <a className="btn btn--lg" href={mailtoHref(GARTH_EMAIL, "Connected Kingdom Seminar")}>
                    Ask about the seminar
                  </a>
                </p>
              </div>
              <div className="card" data-rv="120">
                <p className="meta meta--gold">Sessions include</p>
                <div className="prose mt3">
                  <ul>
                    <li><strong>The Connected Church Vision</strong><br />The three dimensions of connection.</li>
                    <li><strong>Generational Mapping for Mission</strong><br />Profiles and outreach implications.</li>
                    <li><strong>Mind, Heart &amp; Digital Disconnect</strong><br />Neurological insights into evangelism and discipleship.</li>
                    <li><strong>Reaching Those You Don&apos;t Know for Christ</strong><br />The unknown, the unseen and the unheard.</li>
                    <li>
                      <strong>Follow-up Q&amp;A</strong>
                      <ul>
                        <li>Information</li>
                        <li>Solutions</li>
                        <li><a className="tlink seminar-link" href="#call">Consultation</a></li>
                        <li><a className="tlink seminar-link" href="#call">Execution</a></li>
                        <li><a className="tlink seminar-link" href="/coaching">Coaching</a></li>
                      </ul>
                    </li>
                  </ul>
                </div>
                <p className="card__foot">
                  Reach out to Garth with your questions here: {" "}
                  <a href={GARTH_MAILTO}><strong>{GARTH_EMAIL}</strong></a>
                </p>
              </div>
            </div>
          </section>

          <section className="sec tint" id="call">
            <div className="wrap-t center">
              <p className="meta meta--gold">Next step</p>
              <h2 className="d2 mt4">Fifteen minutes,<br />no pitch.</h2>
              <p className="lede mt4 dim">
                Ask Garth to teach your business, church or church staff how to Understand, Attract,
                Connect and Disciple. Set up a fifteen-minute discovery call. Connect with Garth at{" "}
                <a href={GARTH_MAILTO} style={{ color: "var(--gold-dp)", textDecoration: "underline", textUnderlineOffset: "3px" }}>{GARTH_EMAIL}</a>.
              </p>
              <div className="row mt5" style={{ justifyContent: "center" }}>
                <a className="btn btn--lg" href={GARTH_MAILTO}>Book the call</a>
              </div>
            </div>
          </section>
        <RelatedLinks
          title="Related"
          links={[
            { href: "/speaking", label: "Speaking", note: "Book Garth for your next conference or staff day." },
            { href: "/work", label: "What I do", note: "See every room of the work." },
            { href: "/contact", label: "Contact", note: "Ask about a Bridgeworks date for your team." },
          ]}
        />
      </main>
    </SiteChrome>
  );
}
