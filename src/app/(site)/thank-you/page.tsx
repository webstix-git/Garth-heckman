import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { RelatedLinks } from "@/components/seo/RelatedLinks";
import { GARTH_EMAIL, GARTH_MAILTO, GARTH_PHONE_DISPLAY, GARTH_TEL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Contact Thank You",
  description: "Thanks for contacting us! We will get in touch with you shortly.",
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
            <h1 className="d1">Contact Thank You</h1>
          </div>
        </section>

        <section className="sec">
          <div className="wrap" style={{ textAlign: "left" }}>
            <h2 className="d3">Thank You for Reaching Out!</h2>
            <p className="lede mt4 dim">
              Thank you for contacting us. We’ve received your message. Call{" "}
              <a href={GARTH_TEL}>{GARTH_PHONE_DISPLAY}</a> or email{" "}
              <a href={GARTH_MAILTO}>{GARTH_EMAIL}</a>.
            </p>
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
