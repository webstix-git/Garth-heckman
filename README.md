# Garth Heckman — Next.js build

Personal brand site and store for garthheckman.com. This is also the first
pass at Webstix's reusable Next.js commerce base: the commerce layer is
deliberately over-specified, and the generic parts get extracted into a base
package once this site has shipped and we know what actually repeated.

**Status: foundation only.** The design system is ported and verified. The
data layer, commerce and real pages are not built yet.

---

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in
npm run dev                  # http://localhost:4400
```

`/` is currently a **parity harness**, not a real page. It exercises the parts
of the design system most likely to break in the port (width axis, theme flip,
buttons, cards, form controls) so regressions surface immediately. It gets
replaced by the real homepage.

---

## Stack, and why

| Choice | Reason |
| --- | --- |
| Next.js 16, App Router, TypeScript | Server components keep pricing on the server, which is the whole point (below). |
| **Plain CSS, no Tailwind** | `src/styles/design-system.css` is a finished design system: tokenised, themed by class, variable-font type scale. It re-themes per client by swapping tokens, which is exactly what a reusable base needs. Utilities would lose that layer. |
| Supabase | Postgres plus auth, storage and row-level security in one. Magic-link sign-in and signed download URLs come nearly free. |
| PayPal + Venmo | Client's decision. Venmo rides inside the PayPal gateway. |
| Printify | Merchandise is print on demand. |

---

## The one rule that shapes everything

**The server is the authority on price. Always.**

The static prototype computed prices, discounts, tax and totals in the browser
and kept the cart in `localStorage`. Fine for a prototype, unsafe in
production: a cart held in the client is a *claim*, never an authority.

In this build:

- the cart stores **product id, variant id and quantity only**;
- the server recomputes every line price, pay-what-you-want floor and ceiling,
  promo discount, shipping and tax from the database at checkout;
- client-side validation stays, but purely as UX. It never decides anything.

Money is stored and computed in **integer cents**. Floating-point dollars
already produced a real bug in the prototype — `41.150000000000006` landing in
an order record. Integers remove that class of bug at the source instead of
rounding it away at the edges.

---

## Design system

`src/styles/design-system.css` — do not fork it per page.

- **Tokens** on `:root`; `.on-dark` re-points `--bg/--fg/--acc/--line`, so a
  component never needs to know which ground it sits on.
- **One typeface**, Archivo variable, worked across its `wdth` axis. Loaded via
  `next/font` with `axes: ["wdth"]` declared. **If that axis is ever dropped,
  every `font-variation-settings` rule silently becomes a no-op** and the
  display type loses its character without throwing an error.
- No serif anywhere. No marquee. Nothing below 13px.
- Gold (`--gold`) is the primary action, one per view.
- Maroon (`--maroon`) is a ground and a domain accent. It never appears on a
  button, a price, or any call to action.

### Deliberately not inherited from the scaffold

- `create-next-app` sets `overflow-x: hidden` on `html, body`. Removed: it
  hides horizontal-overflow bugs rather than fixing them.
- Turbopack `root` is pinned in `next.config.ts`; otherwise a stray lockfile in
  the home directory makes it infer the wrong workspace root.

---

## Reference

The original static build is in `../Prototype` and is the visual and
behavioural reference. It is fully audited: 25 page variants at four
breakpoints, no console errors, no overflow, no duplicate ids, no broken
links, no unlabelled fields, AA contrast throughout. When in doubt about
intended behaviour, check there and match it.

`../Prototype/style-guide.html` documents the component set, the four product
types, and the open questions with the client.

---

## Known gaps

Content and legal blockers rather than code:

- No Privacy, Terms or Refunds pages. Required before taking payments.
- Social links have no real URLs yet.
- Product photography and cover art are placeholders.
- The audiobook recording does not exist yet; the product is live as
  pay-what-you-want against a placeholder file.
- The `$1` audiobook floor is worth revisiting — processor fees consume most
  of a one-dollar contribution.
