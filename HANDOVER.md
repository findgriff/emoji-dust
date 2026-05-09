# EMOJI DUST — Handoff

**Updated:** 2026-05-09 (later session — real Printify mockups now live)

---

## Where we are

The full pipeline is operating end-to-end. Run locally:

```bash
pnpm install && pnpm render:designs --no-print && pnpm dev   # http://localhost:3000
```

The site shows:
- 200 SKUs (50 quotes × 4 product kinds)
- Every design carries an emoji + the quote (no exceptions)
- Two preview variants per quote — **light stock** (dark text) and **dark stock** (white text)
- Product pages have a **light/dark switcher** plus an **"On a model"** toggle that swaps the design preview for real Printify mockups
- 12 featured tees + 12 featured hoodies are now actual Printify products with mockups mirrored to `/public/mockups/`

## What I did this round

1. **Every quote now has an emoji.** Hand-picked across 50 quotes — sage 🌱 for action, mirror 🪞 for self-reflection, butterfly 🦋 for change, candle 🕯️ for borrowed faith, and so on. The emoji is the design's pivot, not its decoration.

2. **Light + dark template variants.** The same `minimal-serif-v1` template now takes a `theme` prop. Light = ink type on transparent background, prints on cream/white/sage stock. Dark = cream type on transparent background, prints on black/navy/maroon stock. Both render in 5–15 seconds for the full 50-quote catalogue.

3. **Sync orchestrator pushes both artwork variants.** When a product is created on Printify, the sync uploads the light PNG, uploads the dark PNG, classifies each Bella+Canvas / AWDIS variant by colour name (Black/Navy/Maroon… → dark; Natural/White/Soft Pink… → light), and tells Printify to use the right artwork on each. Printify then renders mockups on actual model photography for both groups.

4. **Curated colour palette per kind.** Printify caps products at 100 enabled variants. Tee has 132 (22 colours × 6 sizes), so we trimmed to 16 colours × 5 sizes = 80. Catalogue lives in `src/content/catalog.ts` — easy to widen later.

5. **Mockup mirroring.** The sync downloads up to 6 mockups per theme (front, back, lifestyle angles) from Printify's CDN to `public/mockups/<quote_id>/<kind>/<theme>-<n>.jpg`. The storefront serves them locally, so we don't depend on Printify's URL stability.

6. **Storefront reads mockup data.** `src/content/products.ts` imports `data/products.json` (written by the sync) and enriches each Product with its Printify product id, external URL (when available), and mirrored mockup paths. The product page's gallery component swaps between design preview and real mockup based on the user's toggle.

7. **Pushed 12 featured tees + 12 featured hoodies.** The 12 featured quotes (Aurelius, Wilde, Lao Tzu, Thoreau, Whitman, Van Gogh, Da Vinci, Rumi, plus 4 EMOJI DUST originals) now have real Printify products with 144 mockups mirrored locally. Total ~9MB of mockup imagery committed to the repo.

## The shop reality

Shop `4353393` is currently `'disconnected'` on Printify. Products are created successfully and mockups generate — but the publish step returns HTTP 400 because there's no active sales channel. This is harmless: the products exist on Printify and become live the moment a channel is reconnected.

**Action needed (you):** go to https://printify.com/app/stores → the disconnected shop → connect a sales channel:

- **Pop-Up Store** → instant `emoji-dust.printify.me/...` URLs, 0% listing fees, ~5% transaction
- **Etsy** → reconnect under your renamed Etsy shop, $0.20/listing/4mo + 6.5% txn
- **Shopify** → if you ever go that route

Once connected, run `pnpm sync:printify --commit --featured --kind tee` again and the `external_url` field populates with the real listing URL. The storefront's "Buy on Printify" button then becomes a working deep-link.

Or for products already created, just publish them via the Printify dashboard — the artwork and variants are already there.

## To complete the catalogue

```bash
# Push remaining 8 product kinds × 38 non-featured quotes = ~150 more products
# Throttled at 8s per product = ~20 minutes. Rate limit: 200 / 30 min.
pnpm sync:printify --commit --kind tee     # all 50 tees (38 more)
pnpm sync:printify --commit --kind hoodie  # all 50 hoodies (38 more)
pnpm sync:printify --commit --kind tank    # all 50 tanks
# mug needs its own template (different aspect ratio) — skip for now
```

## Known limitations

- **Mug template needs work.** Mug print area is 2700×1000 (wide ratio), our current template is 4500×5400 (tall ratio). On the smoke test, the design wrapped around the mug in a way that cropped off the sides. Solution: a separate `minimal-serif-mug.tsx` template tuned for the wide canvas.
- **Tank top variant catalogue is small** (24 variants, 6 colours × 4 sizes). Only 1 colour is genuinely "dark" (Black). Curated allowlist gives 24 enabled — well under the 100 cap.
- **No Printify Pop-Up URL yet** — site shows "Coming soon" on Buy buttons until shop reconnects to a channel.

## Files of interest

- [src/content/quotes.ts](src/content/quotes.ts) — 50 quotes, all with emojis now
- [src/content/catalog.ts](src/content/catalog.ts) — colour allowlists per product kind
- [src/design/templates/minimal-serif.tsx](src/design/templates/minimal-serif.tsx) — light/dark theme handling
- [src/lib/printify/sync.ts](src/lib/printify/sync.ts) — colour-classifying upload/create/publish flow
- [scripts/sync-printify.ts](scripts/sync-printify.ts) — CLI with mockup mirroring
- [data/products.json](data/products.json) — sync results read by the storefront
- [public/mockups/](public/mockups/) — 144+ mirrored Printify mockup JPEGs

## What's next

Once the shop reconnects:

1. Run the full sync to push all 200 products + capture mockups
2. Verify `external_url` populates on each product (will be live URLs on whatever channel)
3. Click through the storefront, every product page should show real mockups + a working Buy button
4. Build the mug-specific Satori template (wide aspect)
5. Roll out remaining work in the spec — admin panel, Drizzle DB migration, Vercel deploy, etc.
