import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Socials } from "@/components/Socials";

export const metadata: Metadata = {
  title: "Connect",
  description: "Speaking inquiries, coaching, Simply Church, Bridgeworks, or just to say hello. Garth reads these himself.",
};

export default function Page() {
  return (
    <SiteChrome nav="connect">
      <main id="main">
        <section className="phead on-dark grain">
            <div className="wrap">
              <nav className="crumbs meta mb4" aria-label="Breadcrumb">
                <a href="/">Home</a><s>/</s><span>Connect</span>
              </nav>
              <h1 className="d1">Say hello</h1>
              <p className="lede mt5 mw dim">
                Speaking, coaching, Simply Church, Bridgeworks, or nothing in particular. Garth
                reads these himself and answers most of them within a couple of days.
              </p>
            </div>
          </section>

          <section className="sec">
            <div className="wrap split split-b" style={{ alignItems: "start" }}>

              <div data-rv>
                <p className="meta meta--gold">Direct</p>
                <div className="card mt3">
                  <p className="meta meta--dim">General &amp; speaking</p>
                  <p className="d4 mt2"><a href="mailto:garthwheckman@gmail.com" style={{ color: "var(--acc)" }}>garthwheckman@gmail.com</a></p>
                  <address className="fcontact fcontact--light mt4">
                    <a className="fcontact__row" href="tel:+19522407152">(952) 240-7152</a>
                    <a className="fcontact__row" href="https://maps.google.com/?q=15097+DuPont+Path,+Apple+Valley,+MN+55124" target="_blank" rel="noopener">15097 DuPont Path, Apple Valley, MN 55124</a>
                  </address>
                </div>
                <div className="card mt3">
                  <p className="meta meta--dim">Bridgeworks &amp; generations</p>
                  <p className="d4 mt2"><a href="mailto:heckman@generations.com" style={{ color: "var(--acc)" }}>heckman@generations.com</a></p>
                </div>
                <div className="card mt3">
                  <p className="meta meta--gold">Follow</p>
                  <p className="body sm mt2">New writing, podcast clips and whatever Garth is currently annoyed about.</p>
                  <div style={{ marginTop: 20 }}>
                    <Socials />
                  </div>
                </div>
                <div className="notice notice--info mt3">
                  <span><strong>Support the mission.</strong> Wake the Faith Up is a $10 suggested donation, and every contribution goes back into getting it into more hands. <a href="/product/wtfu-book" style={{ color: "var(--acc)", textDecoration: "underline" }}>Get WTFU</a>.</span>
                </div>
              </div>

              <form className="card" id="contactForm" noValidate data-rv="120">
                <p className="meta meta--gold">Send a message</p>
                <div className="field-row mt4">
                  <div className="field"><label className="label" htmlFor="cn">Name<span className="req">*</span></label><input className="input" id="cn" autoComplete="name" required /></div>
                  <div className="field"><label className="label" htmlFor="ce">Email<span className="req">*</span></label><input className="input" id="ce" type="email" autoComplete="email" required /></div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="ctopic">What is this about?<span className="req">*</span></label>
                  <select className="select" id="ctopic" required>
                    <option value="">Choose…</option>
                    <option>Speaking inquiry</option><option>Coaching</option><option>Simply Church</option>
                    <option>Relationship Recall</option><option>Bridgeworks / The Connected Church</option>
                    <option>Cancer: I am in the fight</option><option>Order or download help</option>
                    <option>Just saying hello</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="cm">Message<span className="req">*</span></label>
                  <textarea className="textarea" id="cm" required placeholder="As much or as little as you want."></textarea>
                </div>
                <div className="field"><label className="check"><input type="checkbox" defaultChecked /><span>Add me to Garth's occasional email.</span></label></div>
                <div id="cErr" hidden className="notice notice--bad mt3"><span></span></div>
                <div id="cOk"  hidden className="notice notice--ok mt3"><span></span></div>
                <button className="btn btn--lg btn--block mt4" type="submit">Send message</button>
              </form>

            </div>
          </section>
      </main>
    </SiteChrome>
  );
}
