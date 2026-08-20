import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Forge } from "@/components/Forge";
import { Shot } from "@/components/Shot";
import { YOUTUBE_CHANNEL, YOUTUBE_SHORTS } from "@/lib/content";

export const metadata: Metadata = {
  title: "My Story",
  description: "Raised by the best. Raised in ministry for ministry. Forged by fire. Forty-two years of ministry, business, survival and six grandchildren.",
};

export default function Page() {
  return (
    <SiteChrome nav="story">
      <main id="main">
        <section className="phead on-dark grain">
            <div className="wrap">
              <nav className="crumbs meta mb4" aria-label="Breadcrumb">
                <a href="/">Home</a><s>/</s><span>My Story</span>
              </nav>
              <p className="meta meta--gold">The story</p>
              <h1 className="d1 mt3">Forged<br />by fire</h1>
              <div className="between mt5" style={{ alignItems: "flex-end" }}>
                <p className="lede mw dim">
                  Raised by the best. Raised in ministry for ministry. Forged by fire. Three
                  sentences that took forty-two years and several near misses to earn.
                </p>
                <a className="btn" href="/contact">Work with Garth</a>
              </div>
            </div>
          </section>

          {/* BIO */}
          <section className="sec tint">
            <div className="wrap split split-a" style={{ alignItems: "start" }}>
              <div data-rv>
                <p className="meta meta--gold">Bio</p>
                <h2 className="d3 mt3">Coach · Pastor · Author · Generational Strategist</h2>
                <div className="prose mt4">
                  <p>
                    For more than four decades, Garth Heckman has served as a pastor, coach,
                    entrepreneur, author and leadership mentor, helping individuals and
                    organizations discover clarity, purpose and growth. Raised in ministry and
                    shaped by a lifetime of leadership experience, he brings a blend of practical
                    wisdom, spiritual insight and real-world business experience to every audience
                    he serves.
                  </p>
                  <p>
                    Growing up in a pastor's home, Garth watched his parents help transform a small
                    Wisconsin congregation into one of the early megachurches in America. That gave
                    him a front-row seat to the opportunities and the pressures church leaders face
                    every day: leadership strain, congregational dynamics, discipleship, growth,
                    community.
                  </p>
                  <p>
                    Across those forty-plus years he has become known for one thing above the rest:
                    he listens deeply, asks the question nobody else in the room will ask, and helps
                    leaders find the answer that actually fits their mission. That work has reached
                    pastors, church leaders, entrepreneurs, business owners, and plenty of people
                    who simply wanted their life to mean more.
                  </p>
                  <p>
                    Beyond the pulpit he has owned multiple businesses, led one of the
                    nation&apos;s top-rated powerlifting gyms, built relationship programs that
                    filled rooms, and spoken to hundreds of thousands of students and leaders
                    around the world. He is a bestselling author with Hal Leonard.
                  </p>
                  <p>
                    <strong>When he is not speaking, coaching or mentoring</strong>, Garth is with
                    his wife, his children and his six grandchildren, or chasing the same three
                    lifelong obsessions: health, fitness and growth.
                  </p>
                </div>

                {/* Facts sit under the bio they belong to. Full width made the eye
                     travel the whole viewport for five short pairs; in the content
                     column they scan down instead of across. */}
                <p className="meta meta--gold glance__h">At a glance</p>
                <dl className="glance">
                  <div><dt>Based</dt><dd>Minnesota, USA</dd></div>
                  <div><dt>In ministry</dt><dd>42+ years</dd></div>
                  <div><dt>Certified</dt><dd>Westside Barbell trainer, nutritionist</dd></div>
                  <div><dt>Published</dt><dd>Bestselling author with Hal Leonard</dd></div>
                  <div><dt>Speaks on</dt><dd>Leadership, faith, generations, resilience</dd></div>
                </dl>
              </div>

              <div data-rv="120">
                <Shot
                  className="story-bio__shot"
                  ratio="4-5"
                  label="Family"
                  note="The whole crew"
                  src="/assets/img/story-bio.png"
                  alt="Garth Heckman with his family"
                  anchor="top"
                />
              </div>
            </div>
          </section>

          {/* CHAPTERS */}
          <section className="sec">
            <div className="wrap">
              <p className="meta meta--gold" data-rv>Four chapters</p>

              <div className="split mt6" data-rv>
                <Shot
                  variant="pale"
                  ratio="4-5"
                  label="Chapter one"
                  note="Madison, WI"
                  src="/assets/img/chapter-raised-by-the-best.png"
                  anchor="top"
                />
                <div>
                  <p className="meta meta--dim">Chapter one</p>
                  <h2 className="d2 mt3">Raised by<br />the best</h2>
                  <div className="prose mt4">
                    <p>
                      Garth grew up in an extraordinary home, shaped by visionary parents who
                      transformed a small church in Madison, Wisconsin into one of the nation's
                      earliest megachurches. He was immersed in the demanding, rewarding rhythm of
                      ministry, family life and congregational expectation, learning under his
                      father's guidance.
                    </p>
                    <p>
                      That upbringing gave him rare firsthand insight into the profound pressures
                      and the quiet joys of pastoral leadership. It is wisdom he carries forward now,
                      honoring a powerful legacy while forging his own path.
                    </p>
                  </div>
                </div>
              </div>

              <div className="split mt7" data-rv>
                <div>
                  <p className="meta meta--dim">Chapter two</p>
                  <h2 className="d2 mt3">Raised in ministry<br />for ministry</h2>
                  <div className="prose mt4">
                    <p>
                      From the earliest years of his calling, Garth has drawn men and women looking
                      for authentic mentorship. It did not matter what the role was or which church
                      he served. The gift for shepherding people followed him into every room.
                    </p>
                    <p>
                      With a knack for genuinely seeing and hearing people, he offers practical,
                      Spirit-led insight that helps pastors and ministries raise their impact. That
                      calling has defined and sustained more than forty-two years in ministry.
                    </p>
                  </div>
                </div>
                <Shot
                  ratio="4-5"
                  label="Chapter two"
                  note="Ministry · mentoring"
                  src="/assets/img/chapter-raised-in-ministry.png"
                  anchor="top"
                />
              </div>

              <div className="split mt7" data-rv>
                <Shot
                  variant="cool"
                  ratio="4-5"
                  label="Chapter three"
                  note="On the road"
                  src="/assets/img/chapter-business-passion.png"
                  anchor="top"
                />
                <div>
                  <p className="meta meta--dim">Chapter three</p>
                  <h2 className="d2 mt3">Business<br />and passion</h2>
                  <div className="prose mt4">
                    <p>
                      Beyond the pulpit, Garth brings a genuinely entrepreneurial streak and a
                      varied portfolio: a coaching and motivational practice, the Relationship
                      Series, training businesses, gym ownership, and bestselling authorship with
                      Hal Leonard. One of his earliest ventures, Black &amp; White Productions, took
                      him around the globe speaking to hundreds of thousands of students.
                    </p>
                    <p>
                      A gifted musician, a Westside Barbell-certified trainer, a nutritionist and a
                      business coach, and <strong>none of it outranks the six grandchildren.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FORGED BY FIRE */}
          {/* FORGED BY FIRE: the signature ledger, shared with the homepage */}
          <Forge cta={false} />
          {/* COACHING */}
          <section className="sec tint">
            <div className="wrap split">
              <div data-rv>
                <p className="meta meta--gold">Where it goes now</p>
                <h2 className="d2 mt3">Coaching and transformation</h2>
                <div className="prose mt4">
                  <p>
                    Garth offers holistic coaching that treats the whole person, not one slice of
                    them: nutrition guidance and personalized wellness plans, certified personal
                    training through Westside Barbell, and the emotional, mental, social and
                    spiritual work that makes any of it stick.
                  </p>
                  <p>
                    Whether he is mentoring a leader, walking somebody toward better health, or
                    sitting in the middle of a hard personal change, the approach is the same:
                    compassionate, battle-tested, results-driven.
                  </p>
                  <p><strong>His life is the proof. With faith, resilience and the right guidance, anyone can come through it and thrive.</strong></p>
                </div>
                <div className="row mt5">
                  <a className="btn" href="/coaching">Explore coaching</a>
                  <a className="tlink" href="/contact">Start a conversation</a>
                </div>
              </div>
              <div data-rv="120">
                <Shot
                  variant="pale"
                  ratio="4-3"
                  label="Coaching"
                  note="Training floor · one-to-one"
                  src="/assets/img/story-coaching.png"
                  anchor="top"
                />
              </div>
            </div>
          </section>

          <section className="sec tint">
            <div className="wrap">
              <div className="between mb5" data-rv="">
                <div>
                  <p className="meta meta--gold">Clips</p>
                  <h2 className="d2 mt2">
                    Short version,
                    <br />
                    on YouTube.
                  </h2>
                </div>
                <p className="body sm" style={{ maxWidth: "34ch" }}>
                  Clips post weekly. They open on YouTube rather than playing here. Garth wanted the channel to get the
                  traffic.
                </p>
              </div>
              <div className="grid g3" data-rv="80" data-stagger="">
                {YOUTUBE_SHORTS.map((clip) => (
                  <a
                    className="card card--link"
                    href={`https://www.youtube.com/shorts/${clip.id}`}
                    target="_blank"
                    rel="noopener"
                    key={clip.id}
                  >
                    <div style={{ margin: "calc(-1 * clamp(20px,2.4vw,32px)) calc(-1 * clamp(20px,2.4vw,32px)) 0" }}>
                      <Shot
                        variant={clip.v}
                        ratio="16-9"
                        label="YouTube"
                        note="Opens on YouTube"
                        src={`https://i.ytimg.com/vi/${clip.id}/hqdefault.jpg`}
                      />
                    </div>
                    <p className="card__n mt5">Short</p>
                    <h3 className="card__t">{clip.t}</h3>
                  </a>
                ))}
              </div>
              <p className="row mt5" style={{ justifyContent: "center" }}>
                <a className="tlink" href={`${YOUTUBE_CHANNEL}/shorts`} target="_blank" rel="noopener">
                  All shorts on YouTube
                </a>
              </p>
            </div>
          </section>

          <section className="band">
            <div className="wrap band__in">
              <div>
                <p className="meta">The mission</p>
                <p className="d3 mt2">Make God look good.</p>
              </div>
              <div className="row">
                <a className="btn btn--ink btn--lg" href="/product/wtfu-book">Get WTFU</a>
                <a className="btn btn--line btn--lg" href="/speaking">Book Garth</a>
              </div>
            </div>
          </section>
      </main>
    </SiteChrome>
  );
}
