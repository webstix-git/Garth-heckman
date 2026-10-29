import type { Metadata } from "next";
import { pageSeo } from "@/lib/seo";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { ContactForm } from "@/components/contact/contact-form";
import { JsonLd } from "@/components/seo/JsonLd";
import { RelatedLinks } from "@/components/seo/RelatedLinks";
import { IconMail, IconPhone, IconPin } from "@/components/icons";
import {
  GARTH_ADDRESS_LINE1,
  GARTH_ADDRESS_LINE2,
  GARTH_EMAIL,
  GARTH_MAILTO,
  GARTH_MAPS_HREF,
  GARTH_PHONE_DISPLAY,
  GARTH_TEL,
} from "@/lib/links";
import { breadcrumbSchema, contactPageSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageSeo("/contact");

export default function Page() {
  return (
    <SiteChrome nav="connect">
      <JsonLd id="ld-contact" data={contactPageSchema()} />
      <JsonLd
        id="ld-contact-crumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <span>Contact</span>
            </nav>
            <h1 className="d1">Contact our store</h1>
            <p className="lede mt5 mw dim">
              Questions about a product, an order, or your account? Send us a message and the store team will reply as soon
              as possible.
            </p>
          </div>
        </section>
        <section className="sec">
          <div className="wrap split split-a" style={{ alignItems: "start" }}>
            <ContactForm />
            <aside className="card contact-aside" data-rv>
              <p className="meta meta--gold">Get in touch</p>
              <address className="contact-aside__list">
                <a className="contact-aside__row" href={GARTH_MAPS_HREF} target="_blank" rel="noopener">
                  <IconPin />
                  <span>
                    <span className="contact-aside__label">Address</span>
                    <span className="contact-aside__value">
                      {GARTH_ADDRESS_LINE1}
                      <br />
                      {GARTH_ADDRESS_LINE2}
                    </span>
                  </span>
                </a>
                <a className="contact-aside__row" href={GARTH_TEL}>
                  <IconPhone />
                  <span>
                    <span className="contact-aside__label">Phone</span>
                    <span className="contact-aside__value">{GARTH_PHONE_DISPLAY}</span>
                  </span>
                </a>
                <a className="contact-aside__row" href={GARTH_MAILTO}>
                  <IconMail />
                  <span>
                    <span className="contact-aside__label">Email</span>
                    <span className="contact-aside__value">{GARTH_EMAIL}</span>
                  </span>
                </a>
              </address>
            </aside>
          </div>
        </section>
        <RelatedLinks
          title="Popular next steps"
          links={[
            {
              href: "/speaking",
              label: "Book Garth to speak",
              note: "Conferences, churches, staff days, and student nights.",
            },
            {
              href: "/store",
              label: "Shop the store",
              note: "Books, downloads, and merchandise.",
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
