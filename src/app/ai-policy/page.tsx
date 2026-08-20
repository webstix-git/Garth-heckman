import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "AI Policy",
  description: "How this site uses artificial intelligence, and what it does not do with it.",
};

export default function Page() {
  return (
    <LegalShell
      title="AI Policy"
      lede="Tools help build and maintain this site. They do not stand in for Garth, and they do not replace a real conversation."
    >
      <div className="wrap-t">
        <p className="meta meta--dim">Last updated 20 August 2026</p>
        <div className="prose mt4">
          <p>
            This page is the straight version of how artificial intelligence shows up here. If you
            want a human, email{" "}
            <a href="mailto:garthwheckman@gmail.com">garthwheckman@gmail.com</a>.
          </p>

          <h3>What AI is used for</h3>
          <p>
            Development and maintenance of this website may use AI-assisted tools for layout,
            code, drafts of supporting copy, and similar production work. That work is reviewed
            before it goes live.
          </p>

          <h3>What AI is not used for</h3>
          <ul>
            <li>Coaching, speaking, pastoral care, or any reply that is meant to be from Garth.</li>
            <li>Deciding prices, discounts, shipping, tax, or whether an order is valid. The server and the payment processor own that.</li>
            <li>Generating photographs of Garth, his family, or the rooms this site is about. Those pictures are real.</li>
            <li>Training a public chatbot on this site that pretends to be him.</li>
          </ul>

          <h3>Your messages</h3>
          <p>
            Contact forms, speaking inquiries, Simply Church sign-ups and similar mail go to Garth
            or the people running this site. They are not fed into a public AI product as training
            data by us. If a third-party tool is used to help draft a reply, a person still sends it.
          </p>

          <h3>Orders and accounts</h3>
          <p>
            Checkout, PayPal, Printify fulfillment and download delivery are ordinary commerce
            systems. AI is not the authority on whether you paid or what you bought.
          </p>

          <h3>Your content</h3>
          <p>
            Do not paste other people’s private material into a form on this site. Do not use this
            site’s writing or recordings to train a model without written permission.
          </p>

          <h3>Questions</h3>
          <p>
            If something on this page is wrong, or you want a copy of what we hold about you, use{" "}
            <a href="/contact">Connect</a> or the email above. The{" "}
            <a href="/privacy">privacy policy</a> covers data. This page covers machines.
          </p>
        </div>
      </div>
    </LegalShell>
  );
}
