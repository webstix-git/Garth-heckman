"use client";

import { Catalog, TAXONOMY } from "@/lib/catalog";
import { formatMoney, formatMoney0 } from "@/lib/money";
import { Pwyw } from "@/components/Pwyw";
import { ProductCard } from "@/components/ProductCard";

const SW1 = [
  ["--ink", "#0E0C0A", "Ground. Warm near-black, never #000."],
  ["--char", "#17140F", "Raised surface on dark."],
  ["--soot", "#211D17", "Third surface."],
  ["--iron", "#332D25", "Inert marks: episode numbers."],
  ["--stone", "#6B5C4C", "Body text on light, 5.33:1."],
  ["--ash", "#8B7C6A", "Dimmed text on dark, 4.83:1."],
  ["--taupe", "#B0A18E", "Body text on dark, 7.64:1."],
  ["--sand", "#CFC2AC", "Emphasis on dark, 10.1:1."],
  ["--linen", "#E6E0D4", "Light surface, alt."],
  ["--bone", "#F4F1EA", "Light page ground."],
  ["--paper", "#FBF9F4", "Light card surface."],
] as const;
const SW2 = [
  ["--gold", "#C2A061", "Signal on dark, 7.66:1. Gold buttons."],
  ["--gold-hi", "#E0C88E", "Hover on gold fills."],
  ["--gold-dp", "#7A6030", "Accent TEXT on light, 5.08:1."],
] as const;
const SW3 = [
  ["--maroon", "#5E232C", "Ground and domain accent. Never an action."],
  ["--maroon-dp", "#3A1620", "Forged by Fire ground, top of the gradient."],
  ["--ember", "#CD8F44", "Forged by Fire only, 6.86:1 on ink."],
  ["--ok", "#6F8A5C", "Confirmations, paid state."],
  ["--bad", "#C4634C", "Errors, sold out. Warm, not fire-engine."],
  ["--warn", "#C39A3C", "Low stock, cautions."],
] as const;

function Swatches({ rows }: { rows: readonly (readonly [string, string, string])[] }) {
  return (
    <>
      {rows.map((s) => (
        <div className="sw" key={s[0]}>
          <div className="sw__c" style={{ background: s[1] }}></div>
          <div className="sw__m">
            <p className="meta">{s[0]}</p>
            <code>{s[1]}</code>
            <p className="xs dim mt1">{s[2]}</p>
          </div>
        </div>
      ))}
    </>
  );
}

const COV: Array<[string, string, "done" | "part" | "open", string]> = [
  ["p2", "Modern, professional design reflecting the personal brand", "done", "Homepage + 25 pages"],
  ["p4", "Fully responsive across desktop, tablet, mobile", "done", "Verified 320–1920px, no overflow"],
  ["p4", "Site guides visitors to the book, merch or the contact form", "done", "Hero CTA, book block, band, drawer"],
  ["p4", "Built fresh from supplied content, replaces the current site", "done", "All copy from Garth’s document"],
  ["p5", "Contact Us form, native to the site", "done", "contact"],
  ["p5", "Secure admin portal to view form submissions", "done", "admin → Form submissions"],
  ["p6", "Online store: browse, cart, check out without leaving", "done", "store + cart drawer"],
  ["p6", "WTFU on a pay-what-you-want basis", "done", "wtfu-book"],
  ["p6", "Branded merchandise fulfilled through Printify", "done", "Tee, mug, journal via fulfillment: printify"],
  ["p6", "Venmo for checkout", "open", "Offered inside PayPal, needs confirming"],
  ["p6", "Order confirmation emails to customer and to Garth", "done", "Templates on admin"],
  ["p7", "Audio book", "part", "Live, pay what you want, $1 floor, awaiting the recording"],
  ["p7", "Burn This Book PDF, $5", "done", "burn-this-book"],
  ["p7", "Generations Training Deck, free", "done", "Free, checkout skips payment entirely"],
  ["p7", "Triple C Survivor set, five PDFs at $5", "done", "On cancer and in the store"],
  ["p8", "Product listing page with grid, names, prices, CTAs", "done", "store"],
  ["p8", "WTFU featured prominently at the top of the shop", "done", "Pinned feature block"],
  ["p9", "Product detail pages with images, options, Add to Cart", "done", "wtfu-tee, size and colour"],
  ["p10", "Cart: list, update quantity, remove, running total", "done", "Drawer + cart"],
  ["p11", "PayPal gateway, no card data on the site", "done", "checkout"],
  ["p12", "Printify integration explained and modelled", "done", "Fulfilment routing in the data model"],
  ["p13", "Admin area to view and manage orders", "done", "admin → Orders"],
  ["p14", "Blog with write, images, preview, publish, list", "done", "blog + admin → Blog posts"],
  ["p15", "XML sitemap", "open", "Next.js sitemap at build"],
  ["p15", "Robots.txt", "open", "Next.js robots at build"],
  ["p15", "Canonical tags", "done", "On every indexable page"],
  ["p15", "Optimised titles and meta descriptions", "done", "Unique per page"],
  ["p15", "Structured data (JSON-LD)", "done", "Person, PodcastSeries, Blog. Product schema on PDPs at build"],
  ["p15", "Internal linking structure", "done", "Every area cross-links; no orphan pages"],
  ["p15", "301 redirects", "open", "Needs the old Wix URL list"],
  ["p15", "Image optimisation", "open", "Next/Image at build, placeholders for now"],
  ["p15", "GA4 + Search Console", "open", "Set up at launch"],
  [
    "p16",
    "Sitemap: Home, My Story, Coaching, Speaking, Cancer, Simply Church, Relationship Recall, Bridgeworks, Store, Contact",
    "done",
    "All built as separate pages",
  ],
  ["p20", "YouTube clips linking out to YouTube", "done", "podcast → Clips"],
  ["p20", "Podcast clips", "done", "podcast"],
  ["p20", "Garth can run content himself", "done", "Blog + episodes + products, all admin-managed"],
];

const LBL = {
  done: ["ok", "Built"],
  part: ["warn", "Built, needs a decision"],
  open: ["bad", "Not yet"],
} as const;

export function StyleSwatches({ which }: { which: "sw1" | "sw2" | "sw3" }) {
  const rows = which === "sw1" ? SW1 : which === "sw2" ? SW2 : SW3;
  return <Swatches rows={rows} />;
}

export function StyleTaxonomy() {
  const tree = TAXONOMY.categories
    .map((c) => {
      return (
        c.slug +
        "  ·  " +
        c.name +
        "\n" +
        (c.children || []).map((k) => "  └─ " + k.slug + "  ·  " + k.name).join("\n")
      );
    })
    .join("\n");
  const coll = TAXONOMY.collections.map((c) => c.slug + "  ·  " + c.name).join("\n");
  return (
    <>
      <div className="block">
        <p className="meta meta--gold">Category tree</p>
        <div className="code mt3" id="tree">
          {tree}
        </div>
      </div>
      <div className="block">
        <p className="meta meta--gold">Collections</p>
        <div className="code mt3" id="coll">
          {coll}
        </div>
      </div>
      <div className="block" style={{ gridColumn: "1 / -1" }}>
        <p className="meta meta--gold">Catalogue</p>
        <div className="scroll-x mt3">
          <table className="otable" id="cat">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Fulfilment</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {Catalog.all().map((p) => {
                const price =
                  p.type === "pwyw"
                    ? formatMoney0(p.price.suggested ?? 0) + " suggested"
                    : p.price.amount == null
                      ? "TBC"
                      : formatMoney(p.price.amount);
                return (
                  <tr key={p.id}>
                    <td>
                      <a href={`/product/${p.slug}`}>{p.title}</a>
                    </td>
                    <td>
                      <code>{p.type}</code>
                    </td>
                    <td>
                      <code>{p.fulfillment}</code>
                    </td>
                    <td className="tnum">{price}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function StyleCoverage() {
  return (
    <>
      {COV.map((r, i) => {
        const s = LBL[r[2]];
        return (
          <tr key={i}>
            <td>
              <span className="xs dim">{r[0]}</span>
              <br />
              <strong>{r[1]}</strong>
            </td>
            <td>
              <span className={`badge badge--${s[0]}`}>{s[1]}</span>
            </td>
            <td>{r[3]}</td>
          </tr>
        );
      })}
    </>
  );
}

export function StyleCommerceDemos() {
  const book = Catalog.bySlug("wtfu-book")!;
  const journal = Catalog.byId("p_wtfu_journal")!;
  return (
    <>
      <div className="mt4" id="pwywDemo">
        <Pwyw product={book} compact />
      </div>
      <div className="pgrid mt4" id="cardDemo" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
        <ProductCard p={journal} />
      </div>
    </>
  );
}
