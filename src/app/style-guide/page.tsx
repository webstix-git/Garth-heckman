import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { StyleSwatches, StyleCoverage } from "@/components/StyleGuideFill";
import { Pwyw } from "@/components/Pwyw";
import { ProductCard } from "@/components/ProductCard";
import { Catalog, TAXONOMY } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Design system & commerce handoff",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <SiteChrome nav="">
      <main id="main">
        <section className="phead on-dark grain">
            <div className="wrap">
              <p className="meta meta--gold">Internal · Webstix</p>
              <h1 className="d1 mt3">Design<br />system</h1>
              <p className="lede mt5 mw dim">
                Tokens, components and commerce architecture behind the prototype. Built to lift
                straight into Next.js as the reusable Webstix e-commerce foundation, not just
                Garth's site.
              </p>
            </div>
          </section>

          <nav className="anchors" aria-label="Sections">
            <div className="wrap anchors__in">
              <a href="#type">Type</a><a href="#colour">Colour</a><a href="#space">Space</a>
              <a href="#buttons">Buttons</a><a href="#badges">Badges</a><a href="#forms">Forms</a>
              <a href="#media">Media</a><a href="#content">Content</a><a href="#commerce">Commerce</a>
              <a href="#taxonomy">Taxonomy</a><a href="#model">Data model</a><a href="#routes">Routes</a>
              <a href="#rules">Rules</a><a href="#states">States</a>
              <a href="#coverage">Proposal coverage</a><a href="#open">Open items</a>
            </div>
          </nav>

          {/* ============================================================ TYPE */}
          <section className="sec-s" id="type">
            <div className="wrap">
              <p className="meta meta--gold">Typography</p>
              <h2 className="d2 mt3">One typeface,<br />three voices.</h2>
              <p className="lede mt4 mw dim">
                Archivo variable, worked across its <strong>width</strong> axis rather than mixing
                families. No serif anywhere. The only serif on the site is inside the client's own
                WTFU book lockup, which is artwork, not type.
              </p>

              <div className="block mt6">
                <p className="d1" style={{ fontSize: "clamp(3rem,9vw,7rem)" }}>Aa</p>
                <p className="meta meta--dim mt3">Display · <code>wdth 114 / wght 800</code> · uppercase · tracking −0.042em</p>
              </div>
              <div className="block"><p className="d1" style={{ fontSize: "clamp(2.4rem,5vw,4rem)" }}>Forged by fire</p><p className="meta meta--dim mt3">.d1 · clamp(2.9rem, 8.9vw, 8.75rem)</p></div>
              <div className="block"><p className="d2">Six rooms. Same job.</p><p className="meta meta--dim mt3">.d2 · clamp(2.2rem, 5.6vw, 5rem)</p></div>
              <div className="block"><p className="d3">You would love having Garth at your next event.</p><p className="meta meta--dim mt3">.d3 · clamp(1.55rem, 2.9vw, 2.6rem)</p></div>
              <div className="block">
                <p className="meta meta--gold">Broadcast metadata · wdth 82 · tracking .19em · tabular</p>
                <p className="meta meta--dim mt2">EP. 1736 · 48:12 · 09 AUG 26</p>
                <p className="lede mt4">Lead paragraph: the one sentence under a heading that has to carry the section on its own.</p>
                <p className="body mt3">Body copy at wdth 100, 16px / 1.68. Long-form measure capped at 54ch so the bio does not become a wall.</p>
                <p className="sm dim mt2">Small, dimmed: captions and secondary detail.</p>
                <p className="xs dim mt1">Extra small: legal, SKUs, timestamps.</p>
              </div>
            </div>
          </section>

          {/* ========================================================== COLOUR */}
          <section className="sec-s tint" id="colour">
            <div className="wrap">
              <p className="meta meta--gold">Colour</p>
              <h2 className="d2 mt3">A palette cut from the gradients,<br />not copied from them.</h2>
              <p className="lede mt4 mw dim">
                The client supplied a stock <em>vintage gradient set</em>: a gradient resource, not a
                palette. Colours were sampled from that file and re-cut: a warm near-black ground, one
                gold signal, one ember accent held back for the hardest content, and a cool slate for
                counterweight. Every text pairing meets WCAG AA at its documented use.
              </p>

              <h3 className="d4 mt6 mb4">Ground &amp; text</h3>
              <div className="grid g4" id="sw1">
                <StyleSwatches which="sw1" />
              </div>
              <h3 className="d4 mt6 mb4">Gold, the only signal</h3>
              <div className="grid g4" id="sw2">
                <StyleSwatches which="sw2" />
              </div>
              <h3 className="d4 mt6 mb4">Reserved &amp; semantic</h3>
              <div className="grid g4" id="sw3">
                <StyleSwatches which="sw3" />
              </div>

              <div className="block mt6">
                <p className="meta meta--gold">Rules</p>
                <div className="prose mt3">
                  <ul>
                    <li><strong>Gold is never body text on light.</strong> <code>--gold</code> is 2.1:1 on bone. Use <code>--gold-dp</code> (#7A6030, 5.08:1) for accent text on light; <code>--gold</code> is for dark grounds and gold-filled buttons. The <code>--acc</code> alias picks the right one automatically inside <code>.on-light</code>.</li>
                    <li><strong>Maroon is a ground, never an action.</strong> Client-supplied, cut as an oxblood (<code>#5E232C</code>) rather than the logo's violet, because red-brown shares the warmth of the gold and violet fights it. It owns one domain, Forged by Fire, where it carries the weight of what the section is about. It must not appear on a button, a price or any call to action: gold owns action alone, and the moment a second saturated colour competes for that job the hierarchy is gone. Bone on it is 10.88:1 and gold on it 4.85:1, so it is safe as a ground; it also passes as text on light at 10.88:1 if a domain accent is ever needed.</li>
                    <li><strong>Ember is rationed.</strong> Forged by Fire only. It loses its weight the moment it becomes decoration.</li>
                    <li><strong>The ground is warm, never pure black.</strong> #0E0C0A reads as leather and ink. #000 would read cold and tech, which is the wrong instinct for this brand.</li>
                    <li><strong>Sections alternate dark and light.</strong> That rhythm is what stops a dark site tipping from cinematic into funereal.</li>
                    <li><strong>Cancer is the lightest page on the site.</strong> Deliberate. The story of the fight can be dark; the page somebody opens three days after a diagnosis should not be.</li>
                    <li><strong>No colour from the GH logo.</strong> The plum cross in the mark is deliberately not in the palette, per the client.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================== SPACE */}
          <section className="sec-s" id="space">
            <div className="wrap">
              <p className="meta meta--gold">Space, edges, motion</p>
              <div className="grid g2 mt5">
                <div className="block">
                  <p className="meta meta--gold">Edges</p>
                  <div className="row mt4">
                    <div style={{ width: "88px", height: "56px", background: "var(--bg-3)", border: "1px solid var(--line)" }}></div>
                    <div style={{ width: "56px", height: "56px", background: "var(--gold)", borderRadius: "50%" }}></div>
                  </div>
                  <p className="body sm mt3">Square, always. The only radii on the site are the play button, the cart count and the avatar-scale dots. Rounded cards are the fastest way to make a page look template-generated.</p>
                  <p className="meta meta--gold mt5">Shadow</p>
                  <p className="body sm mt2">None. Depth comes from hairlines and ground shifts, not from drop shadows. The one exception is the sticky header blur.</p>
                  <p className="meta meta--gold mt5">Grid</p>
                  <p className="body sm mt2">No decorative column overlay. An earlier build carried six hairline guides across the dark sections, but they were six equal slices of the viewport while the layout is a padded, uneven split, so they landed on no real edge and cut across the hero portrait. Structure is expressed by the hairlines that do real work: card borders, section rules and the corner ticks on image slots.</p>
                </div>
                <div className="block">
                  <p className="meta meta--gold">Section rhythm</p>
                  <div className="code mt3" dangerouslySetInnerHTML={{ __html: `--gutter  clamp(20px, 3.4vw, 60px)
        --wrap    1560px            <c>// full</c>
        .wrap-n   1140px            <c>// checkout, account</c>
        .wrap-t    820px            <c>// article, form</c>
        .sec      clamp(60px, 7.5vw, 132px)
        .sec-s    clamp(40px, 5vw, 80px)` }} />
                  <p className="meta meta--gold mt5">Motion</p>
                  <div className="code mt3" dangerouslySetInnerHTML={{ __html: `--t1  150ms   <c>// hover, focus</c>
        --t2  300ms   <c>// state change</c>
        --t3  700ms   <c>// reveal, panel</c>
        --out cubic-bezier(.16, 1, .3, 1)` }} />
                  <p className="body sm mt3">Everything respects <code>prefers-reduced-motion</code>. No parallax, no scroll-jacking, no counters.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= BUTTONS */}
          <section className="sec-s tint" id="buttons">
            <div className="wrap">
              <p className="meta meta--gold">Buttons &amp; links</p>
              <div className="block mt5">
                <div className="row">
                  <button className="btn">Primary gold</button>
                  <button className="btn btn--ink">Ink</button>
                  <button className="btn btn--line">Line</button>
                  <button className="btn btn--quiet">Quiet</button>
                  <button className="btn" disabled>Disabled</button>
                </div>
                <div className="row mt4">
                  <button className="btn btn--lg">Large</button>
                  <button className="btn btn--line">Default</button>
                  <button className="btn btn--line btn--sm">Small</button>
                </div>
                <div className="row mt5"><a className="tlink" href="#buttons">Text link with arrow</a></div>
                <p className="body sm mt5">Gold is the money action, one per view. Ink is the secondary commit. Line is navigation. Quiet is tertiary or destructive-adjacent.</p>
              </div>
            </div>
          </section>

          {/* ========================================================== BADGES */}
          <section className="sec-s" id="badges">
            <div className="wrap">
              <p className="meta meta--gold">Badges, chips, notices</p>
              <div className="block mt5">
                <div className="row">
                  <span className="badge badge--gold">Pay what you want</span>
                  <span className="badge badge--ink">New</span>
                  <span className="badge">Instant download</span>
                  <span className="badge badge--warn">Low stock</span>
                  <span className="badge badge--bad">Sold out</span>
                  <span className="badge badge--ok">Paid</span>
                </div>
                <div className="row mt5">
                  <button className="chip on">Selected ✕</button>
                  <button className="chip">Chip <small>12</small></button>
                </div>
                <div className="mt5" style={{ display: "grid", gap: "10px" }}>
                  <div className="notice notice--info"><span><strong>Info.</strong> Mixed order: downloads are instant, printed items ship separately.</span></div>
                  <div className="notice notice--ok"><span><strong>Success.</strong> Downloads unlock the moment payment clears.</span></div>
                  <div className="notice notice--warn"><span><strong>Warning.</strong> Only 2 left in this size.</span></div>
                  <div className="notice notice--bad"><span><strong>Error.</strong> 3 fields need attention.</span></div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================== FORMS */}
          <section className="sec-s tint" id="forms">
            <div className="wrap">
              <p className="meta meta--gold">Forms</p>
              <div className="grid g2 mt5">
                <div className="block">
                  <div className="field"><label className="label" htmlFor="d1">Text input<span className="req">*</span></label><input className="input" id="d1" placeholder="Placeholder" /><p className="hint">Helper text sits under the field.</p></div>
                  <div className="field bad"><label className="label" htmlFor="d2">Invalid state<span className="req">*</span></label><input className="input" id="d2" defaultValue="not-an-email" /><p className="hint">That does not look like an email address.</p></div>
                  <div className="field"><label className="label" htmlFor="d3">Select</label><select className="select" id="d3"><option>Choose…</option><option>Option</option></select></div>
                  <div className="field"><label className="label" htmlFor="d4">Textarea</label><textarea className="textarea" id="d4" placeholder="As much or as little as you want."></textarea></div>
                </div>
                <div className="block">
                  <p className="label">Quantity stepper</p>
                  <div className="qty"><button type="button" data-step="down">−</button><input type="number" defaultValue="1" min={1} aria-label="Quantity" /><button type="button" data-step="up">+</button></div>

                  <p className="label mt5">Colour swatches</p>
                  <div className="swatches">
                    <button className="swatch" style={{ backgroundColor: "#1E1913" }} aria-pressed="true" aria-label="Black"></button>
                    <button className="swatch" style={{ backgroundColor: "#E3DACB" }} aria-label="Bone"></button>
                    <button className="swatch" style={{ backgroundColor: "#49535C" }} aria-label="Slate"></button>
                  </div>

                  <p className="label mt5">Size options, including sold out</p>
                  <div className="sizes">
                    <button className="size" aria-pressed="true">S</button><button className="size">M</button>
                    <button className="size">L</button><button className="size" disabled>XL</button>
                  </div>

                  <p className="label mt5">Radio cards</p>
                  <label className="radio"><input type="radio" name="demo" defaultChecked /><span><b>PayPal</b><i>Card details never touch the site.</i></span></label>
                  <label className="radio"><input type="radio" name="demo" /><span><b>Venmo</b><i>Handled through PayPal's gateway.</i></span></label>

                  <p className="label mt5">Checkbox</p>
                  <label className="check"><input type="checkbox" defaultChecked /><span>Send me Garth's occasional email.</span></label>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================== MEDIA */}
          <section className="sec-s" id="media">
            <div className="wrap">
              <p className="meta meta--gold">Photo slots</p>
              <p className="lede mt3 mw dim">
                Real photography is supplied by the client. Until it arrives every image slot renders
                a framed placeholder with crop ticks, grain and a caption strip, so the layout reads
                as designed rather than broken, and so the photographer's brief is visible in the page.
              </p>
              <div className="grid g4 mt5">
                <div className="shot r4-3"><span className="shot__tick"><i></i><i></i><i></i><i></i></span><span className="shot__cap meta"><b>Default</b><span>Warm neutral</span></span></div>
                <div className="shot shot--pale r4-3"><span className="shot__tick"><i></i><i></i><i></i><i></i></span><span className="shot__cap meta"><b>Pale</b><span>Archive / product</span></span></div>
                <div className="shot shot--warm r4-3"><span className="shot__tick"><i></i><i></i><i></i><i></i></span><span className="shot__cap meta"><b>Warm</b><span>Forged by fire</span></span></div>
                <div className="shot shot--cool r4-3"><span className="shot__tick"><i></i><i></i><i></i><i></i></span><span className="shot__cap meta"><b>Cool</b><span>Church / leadership</span></span></div>
              </div>
              <div className="notice notice--warn mt5">
                <span><strong>Photography is the biggest risk to this design.</strong> Dark interface plus dark, moody portraits reads oppressive. Dark interface plus warm, well-lit, human faces reads cinematic. That single note matters more than any CSS in this file.</span>
              </div>
            </div>
          </section>

          {/* ========================================================= CONTENT */}
          <section className="sec-s tint" id="content">
            <div className="wrap">
              <p className="meta meta--gold">Content components</p>
              <div className="grid g3 hair mt5">
                <div><p className="card__n">1</p><h3 className="card__t">Hairline grid cell</h3><p className="card__d">Children of <code>.hair</code> sit on a 1px line background. The default grouping pattern: no cards, no shadows.</p></div>
                <div><p className="card__n">2</p><h3 className="card__t">Card</h3><p className="card__d">Used only where a block needs to lift off the ground: forms, asides, receipts.</p></div>
                <div><p className="card__n">3</p><h3 className="card__t">Quote</h3><p className="card__d">Gold left rule, heavy sans, no italics. Pull quotes are statements, not decoration.</p></div>
              </div>

              <div className="block mt5">
                <p className="meta meta--gold">Work switcher: the "What I Do" pattern</p>
                <p className="body sm mt2">A numbered index on the left, one focused panel on the right. Replaced an earlier six-row list that read as a services grid. Full <code>tab</code>/<code>tabpanel</code> roles, arrow-key/Home/End navigation, and one thing on screen at a time.</p>
              </div>
              <div className="block">
                <p className="meta meta--gold">Episode grid</p>
                <p className="body sm mt2">A 3-column hairline grid with a 2×2 featured cell. Same component carries the homepage podcast section and the Journal listing: episodes, articles and video all render through it.</p>
              </div>
              <div className="block">
                <p className="meta meta--gold">Now playing</p>
                <p className="body sm mt2">Overlaps the hero's lower edge. Play/pause, 92-bar waveform that fills as it plays, click-to-scrub, live timecode. In production this binds to a real <code>&lt;audio&gt;</code> element and the RSS feed.</p>
              </div>
            </div>
          </section>

          {/* ======================================================== COMMERCE */}
          <section className="sec-s" id="commerce">
            <div className="wrap">
              <p className="meta meta--gold">Commerce components</p>
              <h2 className="d3 mt3">Four product types. One set of components.</h2>
              <p className="lede mt3 mw dim">
                The buy box is assembled from the product's <code>type</code> and <code>fulfillment</code>,
                never from its category. That single decision is what makes this reusable for the next
                client's catalogue.
              </p>

              <div className="grid g2 mt6">
                <div className="block">
                  <p className="meta meta--gold">Pay what you want</p>
                  <p className="body sm mt2">Labelled anchor so $15 does not feel like the cheapskate option. "Other" is a chip that reveals a field rather than a field competing with the ladder. The what-you-get line is doing real work. Without it the block reads as a donation and people hesitate.</p>
                  <div className="mt4" id="pwywDemo">
                    <Pwyw product={Catalog.bySlug("wtfu-book")!} compact />
                  </div>
                </div>
                <div className="block">
                  <p className="meta meta--gold">Product card</p>
                  <p className="body sm mt2">One component. The price slot renders per type; badges stack from product state.</p>
                  <div className="pgrid mt4" id="cardDemo" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
                    <ProductCard p={Catalog.byId("p_wtfu_journal")!} />
                  </div>
                </div>
              </div>

              <div className="block mt5">
                <p className="meta meta--gold">Buy box composition</p>
                <div className="scroll-x mt3">
                  <table className="otable">
                    <thead><tr><th>Type</th><th>Price UI</th><th>Options</th><th>CTA</th><th>Trust row</th></tr></thead>
                    <tbody>
                      <tr><td><code>pwyw</code></td><td>Labelled ladder + Other</td><td>None</td><td>Get the book</td><td>Ships · PayPal · Email</td></tr>
                      <tr><td><code>variable</code></td><td>Price + compare-at</td><td>Swatches + sizes, unavailable disabled</td><td>Add to cart</td><td>Print on demand · PayPal · Email</td></tr>
                      <tr><td><code>digital</code></td><td>Price</td><td>None</td><td>Add to cart</td><td>Instant download · Email · PayPal</td></tr>
                      <tr><td><code>simple</code></td><td>Price</td><td>None</td><td>Add to cart</td><td>Ships · PayPal · Email</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="notice notice--info mt5">
                <span><strong>Two lanes for the book.</strong> The homepage block is the express lane: pick an amount, straight to checkout, for people who already know Garth from the podcast or a stage. <a href="/product/wtfu-book" style={{ color: "var(--acc)", textDecoration: "underline" }}>The product page</a> is the persuasion lane, and it is what gets the shareable URL, the Product schema and the search traffic.</span>
              </div>
            </div>
          </section>

          {/* ======================================================== TAXONOMY */}
          <section className="sec-s tint" id="taxonomy">
            <div className="wrap">
              <p className="meta meta--gold">Product taxonomy</p>
              <h2 className="d3 mt3">Categories are the tree. Collections are the merchandising.</h2>
              <p className="lede mt3 mw dim">Keeping these separate lets a future client reuse the storefront without bending the navigation. A product has one primary category path and any number of collections.</p>
              <div className="grid g2 mt5">
                <div className="block"><p className="meta meta--gold">Category tree</p><div className="code mt3" id="tree">{TAXONOMY.categories.map((c) => c.slug + "  ·  " + c.name + "\n" + (c.children || []).map((k) => "  └─ " + k.slug + "  ·  " + k.name).join("\n")).join("\n")}</div></div>
                <div className="block">
                  <p className="meta meta--gold">Collections (orthogonal)</p>
                  <div className="code mt3" id="coll">{TAXONOMY.collections.map((c) => c.slug + "  ·  " + c.name).join("\n")}</div>
                  <p className="meta meta--gold mt5">Garth's live catalogue</p>
                  <div className="scroll-x mt3"><table className="otable" id="cat">
                    <thead><tr><th>Product</th><th>Type</th><th>Fulfilment</th><th>Price</th></tr></thead>
                    <tbody>
                      {Catalog.all().map((p) => (
                        <tr key={p.id}>
                          <td><a href={`/product/${p.slug}`}>{p.title}</a></td>
                          <td><code>{p.type}</code></td>
                          <td><code>{p.fulfillment}</code></td>
                          <td className="tnum">{p.type === "pwyw" ? "Pay what you can" : p.price.amount == null ? "TBC" : `$${(p.price.amount / 100).toFixed(2)}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          </section>

          {/* ====================================================== DATA MODEL */}
          <section className="sec-s" id="model">
            <div className="wrap">
              <p className="meta meta--gold">Product data model</p>
              <p className="lede mt3 mw dim">Deliberately over-specified. Garth uses about two thirds of it; the next client will need the rest. Working version in <code>assets/js/catalog.js</code>.</p>
              <div className="code mt5" dangerouslySetInnerHTML={{ __html: `Product {
          id, sku, slug, status: <k>'active' | 'draft' | 'coming-soon' | 'archived'</k>,
          type: <k>'simple' | 'variable' | 'digital' | 'pwyw'</k>,        <c>// drives the buy box</c>
          fulfillment: <k>'self' | 'printify' | 'download'</k>,           <c>// drives checkout steps</c>

          title, subtitle,
          categories: [<k>slug</k>],          <c>// primary path, deepest last</c>
          collections: [<k>slug</k>],         <c>// featured, new, wtfu-collection…</c>
          tags: [<k>string</k>],
          badge: { label, variant },

          price: {
            currency, amount, compareAt,
            suggested, min, max, presets: []          <c>// pwyw only</c>
          },

          media:  [{ kind, variant, ratio, label, note, src, alt }],
          descriptionShort, descriptionLong: [], details: [{ label, value }],

          options:  [{ name, type: <k>'swatch'|'button'</k>, values: [{ label, value, hex }] }],
          variants: [{ id, sku, options: {}, price, inventory, image }],

          inventory: { tracked, quantity, allowBackorder },
          shipping:  { required, weightOz, originNote },
          digital:   { files: [{ name, sizeMb }], downloadLimit, expiryDays },

          related: [<k>id</k>],
          seo: { title, description }
        }` }} />

              <p className="meta meta--gold mt6">Cart line</p>
              <div className="code mt3" dangerouslySetInnerHTML={{ __html: `CartLine {
          key,                       <c>// productId | variantId | pwyw amount: the uniqueness rule</c>
          productId, slug, variantId, sku,
          title, subtitle, optionsLabel,
          type, fulfillment,
          unitPrice, qty,
          shipping: <k>boolean</k>,       <c>// copied from product.shipping.required</c>
          media
        }` }} />
              <p className="body sm mt3">Two copies of the same book bought at different contribution amounts are two lines, not one line of quantity 2. That is what <code>key</code> encodes.</p>
            </div>
          </section>

          {/* ========================================================== ROUTES */}
          <section className="sec-s tint" id="routes">
            <div className="wrap">
              <p className="meta meta--gold">Route map</p>
              <div className="scroll-x mt5">
                <table className="otable">
                  <thead><tr><th>Prototype</th><th>Next.js route</th><th>Notes</th></tr></thead>
                  <tbody>
                    <tr><td><a href="/">index.html</a></td><td><code>app/page.tsx</code></td><td>Podcast, work switcher and story anchor from the nav</td></tr>
                    <tr><td><a href="/story">story.html</a></td><td><code>app/story/page.tsx</code></td><td>Static</td></tr>
                    <tr><td><a href="/coaching">coaching.html</a> + 5 siblings</td><td><code>app/(topics)/[topic]/page.tsx</code></td><td>Coaching, speaking, cancer, simply-church, relationship-recall, bridgeworks</td></tr>
                    <tr><td><a href="/store">store.html</a></td><td><code>app/store/page.tsx</code></td><td>Filters and search are query params: <code>?category=&amp;q=&amp;sort=</code>, server-rendered, shareable, indexable</td></tr>
                    <tr><td><a href="/product/wtfu-book">product.html?slug=</a></td><td><code>app/store/[slug]/page.tsx</code></td><td><code>generateStaticParams</code> from the catalogue; Product JSON-LD lives here, not on the homepage</td></tr>
                    <tr><td><a href="/cart">cart.html</a></td><td><code>app/cart/page.tsx</code></td><td>Client component over a cart context</td></tr>
                    <tr><td><a href="/checkout">checkout.html</a></td><td><code>app/checkout/page.tsx</code></td><td>Shipping fieldset renders only when the cart holds a physical line</td></tr>
                    <tr><td><a href="/order-confirmation">order-confirmation.html</a></td><td><code>app/order/[number]/page.tsx</code></td><td>Signed download links, not localStorage</td></tr>
                    <tr><td><a href="/account">account.html</a></td><td><code>app/account/page.tsx</code></td><td>Phase 2: magic-link auth, no passwords</td></tr>
                    <tr><td><a href="/blog">blog.html</a> / <a href="/blog-post">blog-post.html</a></td><td><code>app/journal/[slug]</code></td><td>Client-editable from the admin portal; episodes come from the podcast RSS</td></tr>
                    <tr><td><a href="/contact">contact.html</a></td><td><code>app/connect/page.tsx</code></td><td>Server action → DB + notification email</td></tr>
                    <tr><td>None</td><td><code>app/admin/*</code></td><td>Orders, products, posts, form submissions</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* =========================================================== RULES */}
          <section className="sec-s" id="rules">
            <div className="wrap">
              <p className="meta meta--gold">Cart &amp; checkout rules</p>
              <div className="grid g2 mt5">
                <div className="block">
                  <p className="meta meta--gold">Conditional logic</p>
                  <div className="prose mt3">
                    <ul>
                      <li><strong>Shipping step</strong> renders only if any line has <code>shipping: true</code>. Digital-only orders drop from four steps to three.</li>
                      <li><strong>Mixed orders</strong> get an explicit notice in the cart.</li>
                      <li><strong>Express lane.</strong> The homepage book block goes straight to checkout. A one-item cart page is friction with no purpose.</li>
                      <li><strong>Shipping cost</strong> is flat $6.95, free over $75. Replace with a Printify rate call.</li>
                      <li><strong>Tax</strong> is a 6.875% Minnesota placeholder. Replace with a real tax service.</li>
                      <li><strong>PWYW amount is editable in the cart</strong>, not only on the PDP. Changing it re-keys the line.</li>
                      <li><strong>Sold-out variants</strong> are disabled, not hidden. The shopper should see the size exists.</li>
                    </ul>
                  </div>
                </div>
                <div className="block">
                  <p className="meta meta--gold">Fulfilment routing</p>
                  <div className="scroll-x mt3">
                    <table className="otable">
                      <thead><tr><th>Fulfilment</th><th>Address</th><th>Goes to</th></tr></thead>
                      <tbody>
                        <tr><td><code>self</code></td><td>Required</td><td>Garth, signed and shipped by hand</td></tr>
                        <tr><td><code>printify</code></td><td>Required</td><td>Printify API on order paid</td></tr>
                        <tr><td><code>download</code></td><td>Not collected</td><td>Signed URL + email</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="meta meta--gold mt5">Order states</p>
                  <div className="row mt3" style={{ gap: "8px" }}>
                    <span className="badge">pending</span><span className="badge badge--ok">paid</span>
                    <span className="badge">processing</span><span className="badge">shipped</span>
                    <span className="badge badge--ok">completed</span>
                    <span className="badge badge--bad">cancelled</span><span className="badge badge--bad">refunded</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================== STATES */}
          <section className="sec-s tint" id="states">
            <div className="wrap">
              <p className="meta meta--gold">States</p>
              <p className="lede mt3 mw dim">All built in the prototype. Click through rather than taking it on trust.</p>
              <div className="scroll-x mt5">
                <table className="otable">
                  <thead><tr><th>Screen</th><th>State</th><th>Where</th></tr></thead>
                  <tbody>
                    <tr><td>Listing</td><td>No results</td><td><a href="/store?q=zzzz">store.html?q=zzzz</a></td></tr>
                    <tr><td>Listing</td><td>Filtered by category</td><td><a href="/store?category=digital">store.html?category=digital</a></td></tr>
                    <tr><td>PDP</td><td>Pay what you want</td><td><a href="/product/wtfu-book">wtfu-book</a></td></tr>
                    <tr><td>PDP</td><td>Variants, some sold out</td><td><a href="/product/wtfu-tee">wtfu-tee</a>: Slate/S and Black/3XL are out</td></tr>
                    <tr><td>PDP</td><td>Digital download</td><td><a href="/product/burn-this-book">burn-this-book</a></td></tr>
                    <tr><td>PDP</td><td>Free, $0 product</td><td><a href="/product/generations-training-deck">generations-training-deck</a></td></tr>
                    <tr><td>Checkout</td><td>Free order, no payment step</td><td>Add the deck on its own, then check out</td></tr>
                    <tr><td>PDP</td><td>Not found</td><td><a href="/product/nope">product.html?slug=nope</a></td></tr>
                    <tr><td>Cart</td><td>Empty</td><td><a href="/cart">cart.html</a> with nothing added</td></tr>
                    <tr><td>Cart</td><td>Mixed physical + digital</td><td>Add the book and a PDF</td></tr>
                    <tr><td>Checkout</td><td>Validation errors</td><td>Submit the form empty</td></tr>
                    <tr><td>Checkout</td><td>Digital-only, no shipping step</td><td>Cart with only a PDF</td></tr>
                    <tr><td>Confirmation</td><td>Downloads + shipping</td><td>Complete a mixed order</td></tr>
                    <tr><td>Journal</td><td>Filter + load more</td><td><a href="/blog">blog.html</a></td></tr>
                    <tr><td>Account</td><td>Empty / populated</td><td><a href="/account">account.html</a></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ================================================ PROPOSAL COVERAGE */}
          <section className="sec-s tint" id="coverage">
            <div className="wrap">
              <p className="meta meta--gold">Proposal coverage</p>
              <h2 className="d2 mt3">Every line of the proposal,<br />and where it lives.</h2>
              <p className="lede mt4 mw dim">
                Checked against <em>Webstix / Garth Heckman / New Website Proposal</em>, 6 Aug 2026.
                Green means it exists in the prototype and you can click it.
              </p>
              <div className="scroll-x mt5">
                <table className="otable">
                  <thead><tr><th style={{ width: "34%" }}>Proposal item</th><th>Status</th><th>Where</th></tr></thead>
                  <tbody id="cov">
                    <StyleCoverage />
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ====================================================== OPEN ITEMS */}
          <section className="sec" id="open">
            <div className="wrap">
              <p className="meta meta--gold">Open items</p>
              <h2 className="d2 mt3">Decisions still needed</h2>
              <p className="lede mt4 mw dim">Each of these is answered with an assumption so the flow is complete. All need confirming with Tony or Garth before build.</p>
              <div className="grid g2 hair mt6">
                <div>
                  <span className="badge badge--gold">Payment</span>
                  <p className="d4 mt3">PayPal or Venmo, or both?</p>
                  <p className="body sm mt2">The proposal says "Venmo checkout" on page 3 but specifies the PayPal gateway on pages 6 and 11. Garth also supplied a personal Venmo QR code. The prototype uses PayPal as the gateway with Venmo as an option inside it.</p>
                </div>
                <div>
                  <span className="badge badge--gold">Pricing</span>
                  <p className="d4 mt3">Printify list price vs selling price</p>
                  <p className="body sm mt2">The merchandise sells at roughly half the Printify list figure, which is what the client asked for. The list price is kept on each product as <code>listPrice</code> for margin maths only. It is never shown struck through, because a price the item never actually sold at is a reference-pricing problem rather than a promotion.</p>
                </div>
                <div>
                  <span className="badge badge--gold">Assets</span>
                  <p className="d4 mt3">Audiobook files</p>
                  <p className="body sm mt2">The audiobook is now live as pay-what-you-want, $1 floor and $15 suggested, matching the book. The recording itself is still outstanding, so the download is a placeholder file.</p>
                </div>
                <div>
                  <span className="badge badge--gold">Photography</span>
                  <p className="d4 mt3">Every image is a placeholder</p>
                  <p className="body sm mt2">The design leans on large editorial photography: portrait, stage, archive family shots, episode art. Sourcing these is the biggest single risk to the look.</p>
                </div>
                <div>
                  <span className="badge badge--gold">Podcast</span>
                  <p className="d4 mt3">Platform links and episode data</p>
                  <p className="body sm mt2">The show is <a href="https://tda.podbean.com/" target="_blank" rel="noopener" style={{ color: "var(--acc)", textDecoration: "underline" }}>The David Alliance on Podbean</a>, and the feed is wired. Podbean lists <strong>1,736 episodes</strong>, so the numbering here is now real, but every episode title, date and duration is still placeholder and should come from the feed at build time. Podbean shows no Apple or Spotify links, so those chips are removed until Garth confirms whether the show is distributed there. The YouTube URL is still outstanding.</p>
                </div>
                <div>
                  <span className="badge badge--gold">Scope</span>
                  <p className="d4 mt3">Customer accounts</p>
                  <p className="body sm mt2">Not in the proposal. <code>account.html</code> is a Phase 2 pattern because the reusable foundation needs it. Guest checkout plus order lookup covers Garth's launch.</p>
                </div>
              </div>
            </div>
          </section>
      </main>
    </SiteChrome>
  );
}
