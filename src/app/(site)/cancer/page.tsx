import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { TripleCGrid } from "@/components/TripleCGrid";
import { Shot } from "@/components/Shot";

export const metadata: Metadata = {
  title: "Cancer",
  description: "Triple C survivor. Hope, resources and a straight conversation for people in the middle of the fight.",
};

export default function Page() {
  return (
    <SiteChrome nav="work">
      <main id="main">
        {/* Deliberately the lightest page on the site. Somebody opening this at 2am
               three days after a diagnosis should find a lit room, not a closed one. */}
          <section className="phead" style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="wrap">
              <nav className="crumbs meta mb4" aria-label="Breadcrumb">
                <a href="/">Home</a><s>/</s><a href="/work">What I Do</a><s>/</s><span>Cancer</span>
              </nav>
              <p className="meta meta--gold">Cancer</p>
              <h1 className="d1 mt3">Triple C<br />survivor</h1>
              <div className="between mt5" style={{ alignItems: "flex-end" }}>
                <p className="lede mw dim">
                  Three cancers. A brain tumor. An enlarged heart. Garth is still here, and he has
                  no interest in being polite about what it took.
                </p>
                <a className="btn btn--lg" href="/contact">Talk to Garth</a>
              </div>
            </div>
          </section>

          <section className="sec tint">
            <div className="wrap split">
              <div data-rv>
                <h2 className="d2">You are allowed to be furious and faithful at the same time.</h2>
                <div className="prose mt4">
                  <p>
                    Garth has a genuine passion for encouraging people going through this and
                    bringing them hope. His own journey was, as he puts it, spectacularly
                    miraculous, and he loves telling that story to anyone who needs to hear it.
                  </p>
                  <p>
                    He is not going to hand you a verse and walk off. He has been on the table, in
                    the chair, and through the scans. <strong>He knows what the two-week wait for
                    results does to a person.</strong>
                  </p>
                </div>
                <div className="row mt5">
                  <a className="btn" href="/contact">Send him a message</a>
                  <a className="tlink" href="#resources">See the resources</a>
                </div>
              </div>
              <div data-rv="120">
                <Shot variant="pale" ratio="4-5" label="Portrait" note="In the fight" src="/assets/img/room-cancer.png" anchor="top" />
              </div>
            </div>
          </section>

          {/* The page's own idea. Someone landing here is at one of a few very
               specific moments, and each one wants a different first step. Ask, then
               give them one thing to do, not a wall of resources. */}
          <section className="sec-s tint">
            <div className="wrap">
              <div className="between mb5" data-rv>
                <div>
                  <p className="meta meta--gold">Start here</p>
                  <h2 className="d2 mt2">Where are you<br />right now?</h2>
                </div>
                <p className="body sm" style={{ maxWidth: "34ch" }}>Three honest starting points. Pick the one that is true today. It can be a different one tomorrow.</p>
              </div>

              <div className="triage" data-rv="80" data-stagger>
                <a className="tri" href="/contact">
                  <p className="tri__when">Just diagnosed</p>
                  <p className="tri__t">The scan came back and nobody has said anything useful yet.</p>
                  <p className="tri__d">Garth has had that phone call more than once. Send him a paragraph. He answers these himself, and he will not open with a verse.</p>
                  <p className="tri__go"><span className="tlink">Message Garth</span></p>
                </a>
                <a className="tri" href="/story">
                  <p className="tri__when">Mid-treatment</p>
                  <p className="tri__t">You are in it, and you are tired of being brave about it.</p>
                  <p className="tri__d">Read somebody else's version. Chapter four of Garth's story: the broken neck at seventeen, three cancers, and the parts nobody puts on a poster.</p>
                  <p className="tri__go"><span className="tlink">Read the story</span></p>
                </a>
                <a className="tri" href="#triplec">
                  <p className="tri__when">Someone you love</p>
                  <p className="tri__t">It is not you. It is your husband, your mum, your friend.</p>
                  <p className="tri__d">The Triple C Survivor PDFs were written in the middle of it. Five dollars each, instant download, short enough to actually finish.</p>
                  <p className="tri__go"><span className="tlink">See the resources</span></p>
                </a>
              </div>
            </div>
          </section>

          <section className="sec" id="resources">
            <div className="wrap">
              <div className="between mb6" data-rv>
                <div>
                  <p className="meta meta--gold">What is here for you</p>
                  <h2 className="d2 mt3">Three things.<br />No fine print.</h2>
                </div>
              </div>
              <div className="grid g3 hair" data-rv data-stagger>
                <div>
                  <p className="card__n">1</p><h3 className="card__t">A conversation</h3>
                  <p className="card__d">Email Garth. He answers. Whether you want prayer, practical advice, or just somebody who has been through it. That is the whole offer.</p>
                  <p className="card__foot"><a className="tlink" href="/contact">Reach out</a></p>
                </div>
                <div>
                  <p className="card__n">2</p><h3 className="card__t">The story, in full</h3>
                  <p className="card__d">Chapter four of Garth's story: the broken neck at seventeen, and everything after. Sometimes it helps to read somebody else's version.</p>
                  <p className="card__foot"><a className="tlink" href="/story">Read it</a></p>
                </div>
                <div>
                  <p className="card__n">3</p><h3 className="card__t">Something to hold</h3>
                  <p className="card__d">The Triple C Survivor PDFs were written during and after Garth&apos;s own three rounds. Five dollars each, instant download, short enough to actually finish.</p>
                  <p className="card__foot"><a className="tlink" href="#triplec">See the set</a></p>
                </div>
              </div>

              <div className="quote mt7 mw-l" style={{ marginInline: "auto" }} data-rv>
                <p>These experiences forged an unshakeable, fireproof faith, the kind that now lets him help other people rise above their own adversity with hope and resilience.</p>
                <cite>Forged by fire</cite>
              </div>
            </div>
          </section>

          <section className="sec-s tint" id="triplec">
            <div className="wrap">
              <div className="between mb6" data-rv>
                <div>
                  <p className="meta meta--gold">Triple C Survivor</p>
                  <h2 className="d2 mt3">Five dollars each.<br />Downloaded in seconds.</h2>
                  <p className="body mt4 mw">
                    Garth wrote these during and after his own three rounds. They are short, cheap and
                    practical on purpose, because the last thing anybody in treatment needs is another
                    four hundred page book they will never finish.
                  </p>
                </div>
              </div>
              <div className="pgrid" id="tripleC" data-rv="" data-stagger="">
                <TripleCGrid />
              </div>
            </div>
          </section>

          <section className="band">
            <div className="wrap band__in">
              <div>
                <p className="meta">Whenever you are ready</p>
                <p className="d3 mt2">If today is a bad day, send the email anyway.</p>
              </div>
              <div className="row">
                <a className="btn btn--ink btn--lg" href="/contact">Get in touch</a>
                <a className="btn btn--line btn--lg" href="mailto:garthwheckman@gmail.com">garthwheckman@gmail.com</a>
              </div>
            </div>
          </section>
      </main>
    </SiteChrome>
  );
}
