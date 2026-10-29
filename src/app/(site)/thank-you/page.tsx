import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { RelatedLinks } from "@/components/seo/RelatedLinks";
import { GARTH_EMAIL, GARTH_MAILTO, GARTH_PHONE_DISPLAY, GARTH_TEL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Thank you",
  description: "Your message was sent. Garth’s team will get back to you soon.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/thank-you" },
};

export default function ThankYouPage() {
  return (
    <SiteChrome nav="connect">
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <a href="/contact">Contact</a>
              <s>/</s>
              <span>Thank you</span>
            </nav>
            <h1 className="d1">Message sent.</h1>
            <p className="lede mt5 mw dim">
              Thanks for writing. Someone on the team will read it and reply as soon as they can. If it is urgent, call{" "}
              <a href={GARTH_TEL}>{GARTH_PHONE_DISPLAY}</a> or email{" "}
              <a href={GARTH_MAILTO}>{GARTH_EMAIL}</a>.
            </p>
            <div className="hero__cta" style={{ marginTop: "clamp(32px,3.4vw,48px)" }}>
              <a className="btn btn--lg" href="/">
                Back to home
              </a>
              <a className="btn btn--line btn--lg" href="/store">
                Shop the store
              </a>
            </div>
          </div>
        </section>
        <RelatedLinks
          title="While you wait"
          links={[
            {
              href: "/speaking",
              label: "Book Garth to speak",
              note: "Conferences, churches, staff days, and student nights.",
            },
            {
              href: "/podcast",
              label: "Listen to the podcast",
              note: "The David Alliance — short episodes on faith and leadership.",
            },
            {
              href: "/ask-garth",
              label: "Straight from Garth",
              note: "Five topics. Five questions. Five answers.",
            },
          ]}
        />
      </main>
    </SiteChrome>
  );
}
