import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";

export const metadata: Metadata = {
  title: "Coaching",
  description: "Nutrition, wellness, certified personal training and the emotional, mental, social and spiritual work underneath it. Coaching for the whole person.",
};

export default function Page() {
  return (
    <SiteChrome nav="work">
      <main id="main">
        <section className="phead on-dark grain">
            <div className="wrap">
              <nav className="crumbs meta mb4" aria-label="Breadcrumb">
                <a href="/">Home</a><s>/</s><a href="/work">What I Do</a><s>/</s><span>Coaching</span>
              </nav>
              <div className="split split-a" style={{ alignItems: "end" }}>
                <div>
                  <p className="meta meta--gold">Coaching</p>
                  <h1 className="d1 mt3">Transform<br />the whole<br />person</h1>
                  <p className="lede mt5 mw dim">
                    You cannot fix the spirit and ignore the body. You cannot fix the body and
                    ignore what is going on in your head. Garth coaches all of it, at once.
                  </p>
                  <div className="row mt5">
                    <a className="btn btn--lg" href="#start">Start a conversation</a>
                    <a className="btn btn--line btn--lg" href="#areas">What is covered</a>
                  </div>
                </div>
                <Shot ratio="4-3" label="Coaching" note="Gym floor · across a table" src="/assets/img/room-coaching.png" anchor="top" />
              </div>
            </div>
          </section>

          <section className="sec tint" id="areas">
            <div className="wrap">
              <div className="between mb6" data-rv>
                <div>
                  <p className="meta meta--gold">What is covered</p>
                  <h2 className="d2 mt3">Four fronts.<br />One plan.</h2>
                </div>
                <p className="body sm" style={{ maxWidth: "36ch" }}>Nothing here is theoretical. Garth is a Westside Barbell-certified trainer, a nutritionist, a business coach and a pastor. The plan is built from all four.</p>
              </div>

              <div className="grid g4 hair" data-rv data-stagger>
                <div><p className="card__n">1</p><h3 className="card__t">Nutrition</h3><p className="card__d">A personalized plan you can actually keep, built around your life rather than somebody else&apos;s meal prep.</p></div>
                <div><p className="card__n">2</p><h3 className="card__t">Training</h3><p className="card__d">Certified personal training through Westside Barbell. Strength that carries into the rest of the week.</p></div>
                <div><p className="card__n">3</p><h3 className="card__t">Mind &amp; emotion</h3><p className="card__d">The mental and emotional patterns that keep undoing the progress. Named, worked on, changed.</p></div>
                <div><p className="card__n">4</p><h3 className="card__t">Social &amp; spiritual</h3><p className="card__d">Who you are around, and who you answer to. The two things nobody wants to look at, and the two that decide it.</p></div>
              </div>

              {/* The page's own idea: Garth's voice is always "everyone else does X,
                   I do the opposite". Said as a layout rather than a paragraph. */}
              <div className="versus mt7" data-rv>
                <div className="versus__col">
                  <p className="versus__lbl">The usual approach</p>
                  <h3 className="versus__t">Fix the one thing<br />you came in about</h3>
                  <ul>
                    <li>A meal plan, on its own</li>
                    <li>A training program, on its own</li>
                    <li>Encouragement, and a check-in in two weeks</li>
                    <li>Nothing said about who you are around</li>
                    <li>Nothing said about what you answer to</li>
                  </ul>
                  <p className="versus__kick">Which is why you have started it four times.</p>
                </div>
                <div className="versus__col">
                  <p className="versus__lbl">What Garth does</p>
                  <h3 className="versus__t">Work all four fronts<br />at the same time</h3>
                  <ul>
                    <li>Nutrition built around your actual week</li>
                    <li>Certified training that carries into the rest of it</li>
                    <li>The emotional pattern that keeps undoing the progress</li>
                    <li>The people around you, named honestly</li>
                    <li>The spiritual question underneath all of it</li>
                  </ul>
                  <p className="versus__kick">Which is why it holds the fifth time.</p>
                </div>
              </div>

              <div className="quote mt7" data-rv>
                <p>Whether he is mentoring a leader, guiding somebody toward better health, or sitting in the middle of a hard personal change, the approach is the same: compassionate, battle-tested, results-driven.</p>
                <cite>How Garth works</cite>
              </div>
            </div>
          </section>

          <section className="sec">
            <div className="wrap split">
              <div data-rv>
                <Shot variant="warm" ratio="4-5" label="Portrait" note="Garth mid-session" src="/assets/img/room-coaching.png" anchor="top" />
              </div>
              <div data-rv="120">
                <p className="meta meta--gold">Who this is for</p>
                <h2 className="d2 mt3">People who are done circling the same problem.</h2>
                <div className="prose mt4">
                  <ul>
                    <li>Pastors and church leaders carrying more than they say out loud</li>
                    <li>Business owners whose company is healthier than they are</li>
                    <li>Anybody who has restarted the same plan four times this year</li>
                    <li>People coming out the other side of illness who want their body back</li>
                  </ul>
                  <p className="mt4"><strong>His life is the proof.</strong> With faith, resilience and the right guidance, anyone can come through it and thrive with purpose.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="sec tint" id="start">
            <div className="wrap-t center">
              <p className="meta meta--gold">Get started</p>
              <h2 className="d2 mt4">Tell Garth where you are.</h2>
              <p className="lede mt4 dim">
                No intake form with forty questions. Send a paragraph about what is going on and he
                will come back to you himself.
              </p>
              <div className="row mt5" style={{ justifyContent: "center" }}>
                <a className="btn btn--lg" href="/contact">Start a conversation</a>
                <a className="btn btn--line btn--lg" href="mailto:garthwheckman@gmail.com">garthwheckman@gmail.com</a>
              </div>
            </div>
          </section>
      </main>
    </SiteChrome>
  );
}
