# EMOJI DUST — Handoff

**Updated:** 2026-05-09 (mid-session — site is now live locally)

---

## Where we are

The storefront is fully built and locally runnable. Run `pnpm install && pnpm render:designs && pnpm dev` and you'll see a complete site at `localhost:3000` with:

- A landing page with hero design, featured grid, four-kind category cards, manifesto, and figures rail
- A shop browse page that filters across 200 SKUs (50 quotes × 4 product kinds: tees, vests, hoodies, mugs)
- Product detail pages for every SKU with quote-led typography, attribution panel, "Coming soon" Buy CTA (becomes "Buy on Printify" once the shop is live), about-the-quote panel
- A figures index + per-figure pages for all 20 public-domain figures
- An about page explaining the brand
- 50 rendered design PNGs in `public/designs/` — typography-led, Twemoji-rendered emoji where intentional, EMOJI DUST signature, real attribution where applicable

Tech: Next.js 15 + Tailwind + Satori + Resvg, all OFL-licensed fonts via `@fontsource`. Typecheck clean, all routes return 200.

Repo: https://github.com/findgriff/emoji-dust

## What's blocked, waiting for you

**To turn "Coming soon" CTAs into real Buy links, three owner actions are needed:**

1. **Rotate the Printify token.** It's in this transcript and `.env.local`. Generate a new one at https://printify.com/app/account/api, replace the value in `.env.local`, revoke the old.

2. **Create an EMOJI DUST Pop-Up Store in Printify.** The existing shop ("Fashion Kudos", id 4353393) is on Etsy and doesn't fit the custom-storefront flow. Steps:
   - Go to https://printify.com/app/stores
   - "Add new store" → choose **"Pop-Up Store"**
   - Name it "Emoji Dust"
   - Pick a slug (e.g. `emoji-dust` → URL becomes `emoji-dust.printify.me`)
   - Copy the new shop's id, add to `.env.local` as `PRINTIFY_SHOP_ID=...`

3. **Run the sync** — pushes the 200 SKUs to Printify and captures the Pop-Up listing URL on each. Note: Printify rate-limits product writes to ~200 per 30 min, so the script throttles. Full sync takes ~35 minutes.
   ```bash
   pnpm sync:printify --commit
   ```
   Or do one product kind first to sanity-check:
   ```bash
   pnpm sync:printify --commit --kind mug
   ```

After that, the site's Buy CTAs become live deep-links to Printify and the brand is technically in business.

## What I built this session

Detailed session log:

1. ✅ Pushed scaffold + spec to https://github.com/findgriff/emoji-dust
2. ✅ Updated north-star spec with Q6 Printify-as-checkout pivot — deleted Stripe, customer accounts, order management entirely
3. ✅ Confirmed Printify shop creation requires dashboard (API returns 405)
4. ✅ Scaffolded Next.js 15 + TS strict + Tailwind + brand tokens
5. ✅ Curated 30 attributed quotes from 20 public-domain figures (Marcus Aurelius, Seneca, Wilde, Twain, Thoreau, Emerson, Whitman, Nietzsche, van Gogh, da Vinci, Shakespeare, Rumi, Einstein, Austen, Heraclitus, Lao Tzu, Confucius, Aristotle, Plato, Socrates)
6. ✅ Wrote 20 EMOJI DUST original aphorisms in brand voice
7. ✅ Built `minimal-serif-v1` Satori template — quote in Fraunces, optional emoji pivot, EMOJI DUST signature with gold dust trail underline, attribution caption for real quotes
8. ✅ Rendered all 50 designs to `public/designs/*.png` (5.9 seconds for the full set)
9. ✅ Built site chrome (sticky nav, footer)
10. ✅ Built landing page with hero, featured grid, categories, manifesto, figures rail
11. ✅ Built shop browse with kind-filter pills (?kind=tee|tank|hoodie|mug)
12. ✅ Built product detail pages with breadcrumbs, attribution panel, same-quote-other-kinds rail, more-from-figure rail
13. ✅ Built figures index + per-figure pages
14. ✅ Built about page
15. ✅ Wrote Printify v1 API client (`src/lib/printify/client.ts`) — minimal, typed
16. ✅ Wrote sync orchestrator (`src/lib/printify/sync.ts`) and CLI script — read PNG, upload, create product, publish, capture URL
17. ✅ Typecheck clean, dev server boots, all 5 routes return 200, design PNGs serve correctly

## Sample rendered design

`public/designs/aurelius-impediment.png`:

> The impediment to action advances action. What stands in the way becomes the way.
> 🌱
> *Emoji 😉 Dust*
> MARCUS AURELIUS · MEDITATIONS

— set in Fraunces medium serif, Twemoji 🌱 above, the EMOJI DUST signature with gold dust trail beneath, attribution in small caps Inter below.

## What's intentionally not done

| What | Why |
|---|---|
| Database (Drizzle + Postgres) | Content sits in TS modules. Equivalent shape, swap-in later. Foundations sub-project formalises. |
| Admin panel | Sub-project #4 in the spec. Not needed until quote pipeline scales. |
| 2nd & 3rd Satori templates | Sub-project #2 adds `split-emoji-v1` (emoji as the visual anchor) and `stacked-cap-v1` (sportier sans-serif tank treatment) |
| Vercel deployment | Needs your Vercel/Neon/Clerk/R2 accounts. The site builds, just no host yet. |
| Real Printify mockups on product page | Currently the design PNG itself is shown. After Printify sync, mockups (shirt-on-model PNGs from Printify) replace the design preview on product pages. Sub-project #3. |
| Inngest job queue | Manual `pnpm render:designs` + `pnpm sync:printify --commit` for now. Fine until volume grows. |
| Customer accounts / orders / Stripe | Deleted by the Q6 pivot. Printify Pop-Up handles all transaction surface. |

## Files that matter most

- [docs/superpowers/specs/2026-05-09-emoji-dust-north-star-design.md](docs/superpowers/specs/2026-05-09-emoji-dust-north-star-design.md) — architecture
- [src/content/quotes.ts](src/content/quotes.ts) — the 50 quotes
- [src/content/figures.ts](src/content/figures.ts) — the 20 figures
- [src/design/templates/minimal-serif.tsx](src/design/templates/minimal-serif.tsx) — the template
- [src/design/render.ts](src/design/render.ts) — Satori → Resvg pipeline
- [src/lib/printify/sync.ts](src/lib/printify/sync.ts) — the upload+create+publish flow
- [scripts/sync-printify.ts](scripts/sync-printify.ts) — the CLI to push to Printify

## Next session, in priority order

1. **Verify the locally-running site looks right** to your eye (open it, walk through every page, look at every product). Tell me what to refine — typography, spacing, copy, hero treatment, anything.
2. Create the Pop-Up Store, run the sync, watch the Buy buttons go live.
3. Move into Foundations sub-project: replace the in-memory content layer with Drizzle + Postgres, add the admin panel, deploy to Vercel.
4. Vectorise the logo (`brand/emoji-dust-logo.jpeg` → `.svg`) for crisp scaling.
5. Trademark search for "EMOJI DUST" in classes 21 (mugs) and 25 (apparel) before any paid marketing.

— *Built with care while you stepped away.*
