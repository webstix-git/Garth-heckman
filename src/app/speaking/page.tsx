import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";

export const metadata: Metadata = {
  title: "Speaking",
  description: "Bring Garth to your next event. Conferences, churches, staff days and student nights. Forty-two years of material and hundreds of thousands of students.",
};

export default function Page() {
  return (
    <SiteChrome nav="speaking">
      <main id="main">
        {/* Two-column hero. A short headline in a constrained column so it cannot
               run away, with Garth's own line carried as the pull statement. */}
          <section className="phead on-dark grain">
            <div className="wrap">
              <nav className="crumbs meta mb5" aria-label="Breadcrumb">
                <a href="/">Home</a><s>/</s><span>Speaking</span>
              </nav>

              <div className="split split-a" style={{ alignItems: "center", gap: "clamp(28px,4vw,80px)" }}>
                <div>
                  <p className="meta meta--gold">Speaking</p>
                  <h1 className="d1 mt3">Book Garth<br />to speak.</h1>
                  <p className="story-pull mt5" style={{ maxWidth: "22ch" }}>
                    You would love having Garth at <em>your next event.</em>
                  </p>
                  <p className="body mt4 mw-s">
                    Forty-two years of material, hundreds of thousands of students, and a story
                    that earns the room's attention in the first ninety seconds.
                  </p>

                  <ul className="proof mt5">
                    <li><b>42<sup>+</sup></b><span>Years on stage</span></li>
                    <li><b>100k<sup>+</sup></b><span>Students &amp; leaders</span></li>
                    <li><b>Intl.</b><span>Toured worldwide</span></li>
                  </ul>

                  <div className="row mt5">
                    <a className="btn btn--lg" href="#enquire">Check availability</a>
                    <a className="btn btn--line btn--lg" href="mailto:garthwheckman@gmail.com">Email Garth</a>
                  </div>
                </div>

                <Shot variant="warm" ratio="4-5" label="On stage" note="On stage, hands up" src="/assets/img/room-speaking.png" anchor="top" />
              </div>
            </div>
          </section>

          <section className="sec">
            <div className="wrap">
              <div className="between mb6" data-rv>
                <div>
                  <p className="meta meta--gold">Talks</p>
                  <h2 className="d2 mt3">What Garth<br />brings</h2>
                </div>
                <p className="body sm" style={{ maxWidth: "36ch" }}>Every talk is shaped to the room. These are the four he is asked for most.</p>
              </div>

              <div className="grid g2 hair" data-rv data-stagger>
                <div><p className="card__n">Sunday &amp; conference</p><h3 className="card__t">Make God Look Good</h3><p className="card__d">The mission statement, unpacked. Why the way you carry yourself is the argument, and the sermon is the footnote.</p></div>
                <div><p className="card__n">Conference &amp; men’s events</p><h3 className="card__t">Forged by Fire</h3><p className="card__d">A broken neck at seventeen, three cancers, a brain tumor. What adversity actually builds, and what it does not.</p></div>
                <div><p className="card__n">Staff &amp; leadership days</p><h3 className="card__t">Five Generations, One Room</h3><p className="card__d">How to Understand, Attract, Connect and Disciple across five generations. Everybody is hearing a different sermon. Here is how you preach to all of them.</p></div>
                <div><p className="card__n">Student events</p><h3 className="card__t">Wake The Faith Up</h3><p className="card__d">Men were made for war. Revelation 3 for a generation with a reputation for being alive. Direct, funny, and not remotely safe.</p></div>
              </div>
            </div>
          </section>


          <section className="sec" id="enquire">
            <div className="wrap split split-b" style={{ alignItems: "start" }}>
              <div data-rv>
                <p className="meta meta--gold">Booking</p>
                <h2 className="d2 mt3">Check<br />availability</h2>
                <p className="body mt4 mw-s">Tell Garth about the event. He reads these himself, and he will tell you honestly if he is not the right fit.</p>
                <div className="card mt5">
                  <p className="meta meta--gold">Direct</p>
                  <p className="mt2"><a href="mailto:garthwheckman@gmail.com" style={{ color: "var(--acc)", textDecoration: "underline", textUnderlineOffset: "3px" }}>garthwheckman@gmail.com</a></p>
                  <p className="body sm mt3">For Bridgeworks and generational work: <a href="mailto:heckman@generations.com" style={{ color: "var(--acc)", textDecoration: "underline", textUnderlineOffset: "3px" }}>heckman@generations.com</a></p>
                </div>
              </div>

              <form className="card" id="speakForm" noValidate data-rv="120">
                <div className="field-row">
                  <div className="field"><label className="label" htmlFor="sname">Your name<span className="req">*</span></label><input className="input" id="sname" required /></div>
                  <div className="field"><label className="label" htmlFor="semail">Email<span className="req">*</span></label><input className="input" id="semail" type="email" required /></div>
                </div>
                <div className="field-row">
                  <div className="field"><label className="label" htmlFor="sorg">Church / organization</label><input className="input" id="sorg" /></div>
                  <div className="field"><label className="label" htmlFor="sdate">Event date</label><input className="input" id="sdate" type="date" /></div>
                </div>
                <div className="field-row">
                  <div className="field"><label className="label" htmlFor="stype">Event type</label>
                    <select className="select" id="stype"><option>Sunday service</option><option>Conference</option><option>Staff / leadership day</option><option>Student event</option><option>Men's event</option><option>Other</option></select></div>
                  <div className="field"><label className="label" htmlFor="ssize">Expected attendance</label>
                    <select className="select" id="ssize"><option>Under 100</option><option>100 – 300</option><option>300 – 1,000</option><option>1,000+</option></select></div>
                </div>
                <div className="field"><label className="label" htmlFor="smsg">Tell Garth about it<span className="req">*</span></label>
                  <textarea className="textarea" id="smsg" required placeholder="What is the event, who is in the room, and what do you need them to walk out with?"></textarea></div>
                <div id="sErr" hidden className="notice notice--bad mt3"><span></span></div>
                <div id="sOk"  hidden className="notice notice--ok mt3"><span></span></div>
                <button className="btn btn--lg btn--block mt4" type="submit">Send inquiry</button>
              </form>
            </div>
          </section>
      </main>
    </SiteChrome>
  );
}
