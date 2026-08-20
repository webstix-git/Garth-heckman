import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { NowPlaying } from "@/components/NowPlaying";
import { WorkSwitcher } from "@/components/WorkSwitcher";
import { Forge } from "@/components/Forge";
import { Pwyw } from "@/components/Pwyw";
import { Catalog } from "@/lib/catalog";
import { getLatestEpisode } from "@/lib/podcast";

export const metadata: Metadata = {
  title: {
    absolute: "Garth Heckman | Coach, Pastor, Author, Generational Strategist",
  },
  description:
    "Forty-two years in ministry, business and coaching. The podcast, the coaching, the church, the book. Make God look good.",
};

const book = Catalog.bySlug("wtfu-book")!;

export default async function HomePage() {
  const latest = await getLatestEpisode();
  return (
    <SiteChrome nav="">
      <main id="main">
        <section className="hero on-dark grain">
          <div className="wrap hero__grid">
            <div>
              <ul className="hero__kick meta meta--dim">
                <li>Coach</li>
                <li>Pastor</li>
                <li>Author</li>
                <li>Generational Strategist</li>
              </ul>
              <h1 className="d1 hero__name">
                Garth
                <br />
                Heckman
              </h1>
              <div className="hero__mission">
                <b>Make God look good.</b>
              </div>
              <p className="body mw-l mt4">
                Forty-two years in ministry, business and coaching, and a body that has repeatedly tried to quit on him.
                Garth helps people and organizations find clarity, purpose and growth, and he does not take the long way
                round to get there.
              </p>
              <div className="hero__cta">
                <a className="btn btn--lg" href="/podcast">
                  Listen to the podcast
                </a>
                <a className="btn btn--line btn--lg" href="/speaking">
                  Hire Garth to speak
                </a>
              </div>
            </div>
            <div className="hero__shot">
              <div className="cutout">
                <img src="/assets/img/garth-cutout.png" width={1100} height={1131} alt="Garth Heckman" fetchPriority="high" />
              </div>
            </div>
          </div>

          <div className="wrap" style={{ position: "relative", zIndex: 6 }}>
            <NowPlaying
              title={latest.title}
              kicker={`Latest episode · The David Alliance · Ep. ${latest.episodeNo}`}
              durationSeconds={latest.durationSeconds}
              audioUrl={latest.audioUrl}
            />
          </div>
        </section>

        <section className="sec-s">
          <div className="wrap">
            <div className="creds">
              <div className="cred" data-rv="">
                <b>
                  42<sup>+</sup>
                </b>
                <p className="sm dim">Years in ministry, and still counting</p>
              </div>
              <div className="cred" data-rv="90">
                <b>
                  100k<sup>+</sup>
                </b>
                <p className="sm dim">Students and leaders spoken to worldwide</p>
              </div>
              <div className="cred" data-rv="180">
                <b>3</b>
                <p className="sm dim">Cancers survived. Plus a brain tumor and a broken neck</p>
              </div>
              <div className="cred" data-rv="270">
                <b>6</b>
                <p className="sm dim">Grandchildren, the actual scoreboard</p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" style={{ background: "#EAEAE7" }}>
          <div className="wrap">
            <div className="between" data-rv="">
              <div>
                <p className="meta meta--gold">What I do</p>
                <h2 className="d2 mt2">
                  Six rooms.
                  <br />
                  Same job.
                </h2>
              </div>
              <p className="body sm" style={{ maxWidth: "36ch" }}>
                Pick one. Coaching, speaking, cancer, church, marriage, generations. The work changes shape, the point
                does not.
              </p>
            </div>

            <WorkSwitcher className="work mt6" />
          </div>
        </section>

        <section className="sec" id="story">
          <div className="wrap">
            <div className="story-lead" data-rv="">
              <div className="photo r4-5">
                <img src="/assets/img/garth-family.jpg" width={1200} height={1450} loading="lazy" alt="Garth Heckman with his wife" />
                <span className="shot__tick">
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
              </div>
              <div>
                <p className="meta meta--gold">My story</p>
                <h2 className="d2 mt3">
                  He did not get
                  <br />
                  here the easy way.
                </h2>
                <p className="story-pull mt5">
                  Forty-two years in ministry. Three cancers, a brain tumor and a broken neck.{" "}
                  <em>Six grandchildren, and still going.</em>
                </p>
                <p className="body mt4">
                  Garth grew up inside ministry, spent four decades leading in it, built businesses alongside it, and
                  survived more than most people know about. Every piece of that shows up in the room when he coaches
                  somebody.
                </p>
                <div className="row mt5">
                  <a className="btn" href="/story">
                    Read the whole story
                  </a>
                  <a className="tlink" href="/cancer">
                    If you are in the fight
                  </a>
                </div>
              </div>
            </div>

            <div className="arc mt7" data-rv="80" data-stagger="">
              <article className="arc__i">
                <div className="arc__media">
                    <div className="photo photo--top">
                    <img src="/assets/img/chapter-raised-by-the-best.png" width={1200} height={800} loading="lazy" alt="Raised by the best" />
                    <span className="shot__tick">
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>
                    <span className="shot__cap meta">
                      <b>Chapter one</b>
                      <span>Madison, WI</span>
                    </span>
                  </div>
                </div>
                <div className="arc__b">
                  <p className="arc__era">1960s–1983 · Childhood</p>
                  <h3 className="arc__t">Raised by the best</h3>
                  <p className="arc__d">
                    His parents turned a small Madison church into one of the nation&apos;s earliest megachurches. He had a
                    front-row seat to the pressures and the quiet joys of pastoral leadership before he was old enough to
                    drive.
                  </p>
                  <p className="arc__f">
                    <a className="tlink" href="/story">
                      Chapter one
                    </a>
                  </p>
                </div>
              </article>

              <article className="arc__i">
                <div className="arc__media">
                    <div className="photo photo--top">
                    <img src="/assets/img/chapter-raised-in-ministry.png" width={1200} height={800} loading="lazy" alt="Raised in ministry" />
                    <span className="shot__tick">
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>
                    <span className="shot__cap meta">
                      <b>Chapter two</b>
                      <span>Ministry · mentoring</span>
                    </span>
                  </div>
                </div>
                <div className="arc__b">
                  <p className="arc__era">1983–today · 42 years</p>
                  <h3 className="arc__t">Raised in ministry for ministry</h3>
                  <p className="arc__d">
                    Whatever the role, whatever the church, people looking for real mentorship kept finding him. Four
                    decades later that has not changed, and it is still the thing he is best at.
                  </p>
                  <p className="arc__f">
                    <a className="tlink" href="/story">
                      Chapter two
                    </a>
                  </p>
                </div>
              </article>

              <article className="arc__i">
                <div className="arc__media">
                    <div className="photo photo--top">
                    <img src="/assets/img/chapter-forged-by-fire.png" width={1200} height={800} loading="lazy" alt="Forged by fire" />
                    <span className="shot__tick">
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>
                    <span className="shot__cap meta">
                      <b>Chapter three</b>
                      <span>The hardest treatment</span>
                    </span>
                  </div>
                </div>
                <div className="arc__b">
                  <p className="arc__era">Age 17 onward · Still here</p>
                  <h3 className="arc__t">Forged by fire</h3>
                  <p className="arc__d">
                    A broken neck in three places at seventeen. Six months in a halo vest. Three cancers, a brain tumor,
                    an enlarged heart. Any one of them should have ended it.
                  </p>
                  <p className="arc__f">
                    <a className="tlink" href="/cancer">
                      Chapter three
                    </a>
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <Forge />

        <section className="sec">
          <div className="wrap book">
            <div data-rv="">
              <figure className="bookflat">
                <img
                  src="/assets/img/wtfu-lockup.png"
                  width={1545}
                  height={2000}
                  loading="lazy"
                  alt="Wake The Faith Up, Revelation 3:1–3"
                />
              </figure>
            </div>
            <div data-rv="100">
              <p className="meta meta--gold">The book</p>
              <h2 className="d2 mt2">
                Wake the
                <br />
                faith up
              </h2>
              <p className="body mt3">
                Men were made for war. Wake the Faith Up is Garth&apos;s answer to a church that looked alive and was
                not: direct, unsentimental, paired with a 30-day devotional so you do not just read it and sit back down.
              </p>
              <div id="homePwyw" className="mt4">
                <Pwyw product={book} compact />
              </div>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap band__in">
            <div>
              <p className="meta">Booking</p>
              <p className="d3 mt2">Bring Garth to your next event.</p>
            </div>
            <div className="row">
              <a className="btn btn--ink btn--lg" href="/speaking#enquire">
                Check availability
              </a>
              <a className="btn btn--line btn--lg" href="/contact">
                Get in touch
              </a>
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
