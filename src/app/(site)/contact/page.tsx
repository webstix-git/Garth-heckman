import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the store team for product, order, or account help.",
};

export default function Page() {
  return <SiteChrome nav="connect"><main id="main">
    <section className="phead on-dark grain"><div className="wrap"><nav className="crumbs meta mb4" aria-label="Breadcrumb"><a href="/">Home</a><s>/</s><span>Contact</span></nav><h1 className="d1">Contact our store</h1><p className="lede mt5 mw dim">Questions about a product, an order, or your account? Send us a message and the store team will reply as soon as possible.</p></div></section>
    <section className="sec"><div className="wrap split split-b" style={{ alignItems: "start" }}><div data-rv><p className="meta meta--gold">Store support</p><div className="card mt3"><p className="meta meta--dim">Need help?</p><p className="body sm mt2">Use the form to contact the store. Your message is saved securely and delivered to the store team.</p></div><div className="notice notice--info mt3"><span>For order help, mention your order number in the message so we can find your purchase quickly.</span></div></div><ContactForm /></div></section>
  </main></SiteChrome>;
}
