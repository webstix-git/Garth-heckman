import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What this site collects, why, and how to ask for it back.",
};

export default function Page() {
  return (
    <LegalShell
      title="Privacy Policy"
      lede="We collect what we need to answer you, fill an order, or keep the site standing. We do not sell your name."
    >
      <div className="wrap-t">
        <p className="meta meta--dim">Last updated 20 August 2026</p>
        <div className="prose mt4">
          <p>
            This policy is for garthheckman.com and the services attached to it: the store, the
            account lookup, the contact forms, and the email lists those forms can add you to.
            Questions go to{" "}
            <a href="mailto:garthwheckman@gmail.com">garthwheckman@gmail.com</a>.
          </p>

          <h3>What we collect</h3>
          <ul>
            <li>
              <strong>Messages.</strong> Name, email, topic and whatever you write in a form —
              Connect, speaking, Simply Church, Relationship Recall, Bridgeworks, and the rest.
            </li>
            <li>
              <strong>Orders.</strong> What you bought, quantities, the email you used, a shipping
              address when something has to be printed or shipped, and payment status. Card numbers
              do not sit on this site. PayPal handles the charge.
            </li>
            <li>
              <strong>Downloads and accounts.</strong> Email and order reference so you can get
              files again.
            </li>
            <li>
              <strong>The cart.</strong> Product ids and quantities in your browser so the bag
              survives a refresh. Prices are not trusted from the cart. The server recomputes them.
            </li>
            <li>
              <strong>Technical noise.</strong> Ordinary logs: IP, browser, pages hit. Needed to
              keep the site up and catch abuse.
            </li>
          </ul>

          <h3>Who else sees it</h3>
          <ul>
            <li>
              <strong>PayPal</strong> (Venmo rides inside it) for payment.
            </li>
            <li>
              <strong>Printify</strong> when a merch order has to be made and shipped.
            </li>
            <li>
              <strong>Supabase</strong> for the database, auth and file storage this site is built
              on.
            </li>
            <li>
              Hosting and email delivery for the pages and the messages themselves.
            </li>
          </ul>
          <p>
            Those companies have their own policies. We do not sell your information, and we do
            not rent the list.
          </p>

          <h3>Cookies and similar</h3>
          <p>
            The cart and a few session flags live in your browser. Checkout and PayPal set what
            they need to complete a payment. You can block cookies in the browser; the store will
            then forget the bag between visits.
          </p>

          <h3>How long</h3>
          <p>
            Messages stay as long as the conversation is open, then as long as we still need them
            for the work. Order records stay as long as tax, fulfillment or a download lookup
            requires. You can ask us to delete what we can legally delete.
          </p>

          <h3>Your choices</h3>
          <ul>
            <li>Ask what we hold, and ask for a copy.</li>
            <li>Ask us to correct it or delete it, where the law allows.</li>
            <li>Unsubscribe from email the same way you got on the list, or by writing to the address above.</li>
            <li>Do not submit a form if you do not want the contents stored.</li>
          </ul>

          <h3>Children</h3>
          <p>
            This site is not aimed at children. Do not send us information about a minor unless
            you are the parent or guardian and you mean it.
          </p>

          <h3>Changes</h3>
          <p>
            If this policy changes in a way that matters, the date at the top moves. Keep using
            the site after that and the new version applies.
          </p>

          <h3>Also on this site</h3>
          <p>
            How machines are used is on the <a href="/ai-policy">AI Policy</a>. Every public URL
            is on the <a href="/sitemap">Sitemap</a>.
          </p>
        </div>
      </div>
    </LegalShell>
  );
}
