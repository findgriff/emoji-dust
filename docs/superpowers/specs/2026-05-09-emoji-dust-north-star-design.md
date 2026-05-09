# EMOJI DUST — North-Star Architecture

**Status:** Draft for owner review
**Date:** 2026-05-09
**Author:** Claude Opus 4.7 (1M context), commissioned by Craig
**Purpose:** Strategic architecture across all 10 originally-requested deliverables. This doc is the "north star" — it does not provide enough detail to implement against. Each numbered sub-project listed in §11 will have its own design spec → implementation plan → execution cycle, written when we get to it.

---

## Decisions locked during brainstorm (2026-05-09)

The following choices are settled. Sub-project specs may refine but should not revisit them.

| # | Question | Choice | Rationale |
|---|---|---|---|
| Q1 | Quote sourcing | **Hybrid: curated real-figure quotes + LLM-generated unattributed aphorisms branded under EMOJI DUST** | Legally clean (no fake-attributed quotes), infinitely expandable, two pipelines but both small |
| Q2 | Artwork generation | **Pure typography compositions, server-rendered SVG → PNG via Satori + Resvg** | Matches typography-first brief, free per render, templates as React components, sub-second renders, Vercel-native |
| Q3 | Brand tone | **Playful-premium hybrid — "winking philosopher"** — emoji as jewellery, not full costume | Logo signals warmth + wink; brief signals weight + minimalism; this is the bridge |
| Q4 | Attribution placement | **A as default, C for unreliable substrates.** Wearable apparel: small attribution under the EMOJI DUST signature on the design itself. Mugs and small placements: attribution lives on the product page + inside care label only. | Honest credit, customer sees the figure's name, brand still signs the work |
| Q5 | Tech stack + hosting | **Stack A: Next.js 15 App Router + Tailwind + shadcn/ui + Postgres on Neon + Clerk auth + Cloudflare R2 storage + Satori rendering, deployed to Vercel** | Fastest path to a production storefront, best DX, ~£20–40/mo at MVP scale |

The combined effect: a typographically-driven storefront where playful wit and reverence for great minds coexist, fulfilled by UK printers, deployable in days not months, costing tens of pounds a month until traction justifies more.

---

## §0 — Brand identity foundations

These ground every visual decision downstream.

### Logo
The EMOJI DUST mark is a script wordmark — "Emoji" and "Dust" — separated by a winking smiley with sparkle accents and a gold dust trail underneath. Warm dark charcoal type, gold/amber accents.

The logo file is at `brand/emoji-dust-logo.jpeg` in the repo. Before launch, this should be replaced with a vector (SVG) version — a JPEG won't print sharply at scale and won't recolour cleanly for dark/light contexts.

### Tone-of-voice principles
- Wisdom delivered with a wink, not solemnity
- Quote selection bias: actionable + warm, not nihilistic or harsh
- Original aphorisms speak in second person ("You are…", "Here's what nobody tells you…")
- Emoji punctuate meaning, not decorate. One emoji per design at most. The emoji becomes the design's pivot, not its garnish.

### Palette (proposed — refine in Foundations spec)
| Role | Hex | Use |
|---|---|---|
| Charcoal | `#1A1817` | Primary type, default ink |
| Cream | `#F8F4EC` | Default background, "off-white tee" colour |
| Dust Gold | `#E8B23E` | Logo trail, accent only |
| Sparkle | `#FFD86B` | Hover/active, sparingly |
| Deep Plum | `#3A1E32` | Secondary heading, premium product accent |

### Typography
- **Display / quote:** A pairing of one warm serif (e.g., Fraunces, GT Sectra) for weighty quotes + one geometric sans (e.g., Söhne, Inter) for original aphorisms. Final pick in Foundations spec.
- **Logo:** existing script wordmark (vectorised before launch)
- **Body / UI:** Inter or Geist Sans — reads at all sizes

---

## §1 — Complete technical architecture

```
                                                     ┌─────────────────────────┐
                                                     │      Vercel Edge        │
   Browser ──────────────────────────────────────────►│  Next.js 15 (RSC + RH) │
   (mobile-first storefront +                         │  - Storefront           │
    /admin gated by Clerk)                            │  - /admin (Clerk-gated) │
                                                     │  - Route handlers (API) │
                                                     └────────────┬────────────┘
                                                                  │
                                  ┌───────────────────────────────┼───────────────────────────────┐
                                  │                               │                               │
                                  ▼                               ▼                               ▼
                       ┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
                       │ Postgres (Neon)  │            │ Cloudflare R2    │            │ Anthropic API    │
                       │  - quotes        │            │  designs/        │            │  (Claude Haiku)  │
                       │  - designs       │            │   ├ artwork PNGs │            │  - aphorism gen  │
                       │  - products      │            │   ├ mockups      │            │  - quote vetting │
                       │  - variants      │            │   └ logo assets  │            └──────────────────┘
                       │  - admin audit   │            └──────────────────┘
                       └──────────────────┘                                              ┌──────────────────┐
                                                                                        │ Printify v1 API  │
                                                                                        │  catalog +       │
                                                                                        │  uploads +       │
                                                                                        │  products +      │
                                                                                        │  webhooks (later)│
                                                                                        └──────────────────┘
                                  ▲                                                              ▲
                                  │                                                              │
                                  └─────────────── Inngest jobs ────────────────────────────────┘
                                  (scheduled + queued: design generation, Printify product
                                   creation, mockup retrieval, sync, all admin-approved)
```

**Key patterns:**
- **Edge-rendered storefront** — all customer pages served from Vercel's edge cache; mockup URLs resolve to R2 via Cloudflare's CDN (sub-100ms TTFB anywhere)
- **Background jobs via Inngest** — every Printify or LLM call happens inside a job, never inline in a request handler. This isolates failures and gives us retry/observability for free. Inngest has a generous free tier and works natively with Vercel.
- **Admin separation by Clerk role** — `/admin/**` routes check `org_role == 'admin'` in middleware; the same Next.js app, two audiences
- **Strict no-secrets-in-frontend** — Printify token, Anthropic key, Stripe secret all server-only; the frontend never sees them

---

## §2 — Technology stack (locked)

### Core
| Layer | Choice | Why |
|---|---|---|
| Runtime | Node 22 LTS | Native Resvg bindings, stable |
| Framework | Next.js 15 (App Router, RSC) | Server components match the "render once, serve from cache" pattern; built-in route handlers replace a separate API; native Satori support |
| Language | TypeScript 5.6+ strict mode | Non-negotiable for a multi-domain product (quotes, designs, products, variants) |
| Styling | Tailwind 4 + shadcn/ui (selectively) | Tailwind for layout, shadcn for accessible primitives (dialog, select, dropdown). No design-system overreach. |
| ORM | Drizzle ORM | Type-safe queries, migrations as code, lighter than Prisma, plays nicely with Neon serverless driver |
| DB | Postgres on Neon | Serverless, scales to zero, branching for staging |
| Auth | Clerk | Admin gate at MVP; customer auth comes free when checkout lands |
| Storage | Cloudflare R2 | Cheap, S3-compatible, free egress to Cloudflare's edge |
| Background jobs | Inngest | Replays, observability, native to Vercel |
| Image rendering | Satori + `@resvg/resvg-js` | Server-side SVG → PNG, sub-200ms per design |
| Emoji rendering | Twemoji (CDN'd PNG) | Consistent emoji look across every design regardless of viewer's OS — non-negotiable for a brand named EMOJI DUST |
| LLM | Claude Haiku 4.5 via `@anthropic-ai/sdk` | Aphorism generation + curation assist; Haiku is cheap and fast enough |
| Observability | Sentry (errors) + Vercel Analytics + Logtail (free tier) | Triage without paying for Datadog |
| Email (later) | Resend | Already in OpsPocket muscle memory; £0/mo to 3k/month |

### Deferred to "post-MVP" — not in scope yet
- Stripe (checkout)
- Algolia or Typesense (search) — Postgres trigram + ILIKE works for thousands of products
- Sanity/CMS — pages live as MDX in repo
- i18n — UK/US English only at launch

### What not to use, and why
| Considered | Rejected because |
|---|---|
| Prisma | Slower cold-starts on serverless; Drizzle is materially better here |
| Supabase | We don't need Postgres + Auth + Storage from one vendor; Clerk + Neon + R2 each best-of-breed |
| WordPress / WooCommerce | Wrong tool. Brand needs a custom design language; CMS-first is friction |
| Shopify | Could work, but constrains product page + checkout. Custom build wins because the design-rendering pipeline is the moat. |
| Pure static (Astro) | Admin panel + on-demand artwork rendering needs server runtime. Astro fits a "later" version where the storefront is mostly static and admin is a separate app. |
| AI image generation | Decided in Q2 — wrong direction for a typography-first brand |

---

## §3 — Database schema

Postgres via Drizzle. Foreign keys explicit, soft deletes preferred, all timestamps `timestamptz`.

```sql
-- ─── PEOPLE & QUOTES ──────────────────────────────────────────────────────

create table figures (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,                      -- "marcus-aurelius"
  name            text not null,                             -- "Marcus Aurelius"
  era             text,                                      -- "Roman, 2nd C."
  domains         text[] default '{}',                       -- {philosopher, emperor}
  bio_short       text,                                      -- 1-line for product page
  source_url      text,                                      -- canonical Wikiquote/Wikipedia
  is_public_domain boolean default true,                     -- gating for use-in-design
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create type quote_kind as enum ('attributed', 'aphorism'); -- aphorism = unattributed EMOJI DUST original

create table quotes (
  id              uuid primary key default gen_random_uuid(),
  kind            quote_kind not null,
  text            text not null,                             -- the quote, sentence-cased
  text_normalized text generated always as (lower(regexp_replace(text,'\s+',' ','g'))) stored,
  figure_id       uuid references figures(id),               -- null when kind='aphorism'
  source_work     text,                                      -- "Meditations", "letter to Lucilius"
  source_year     int,                                       -- 170 (CE)
  emoji           text,                                      -- "✨", "🌅" — single emoji or null
  themes          text[] default '{}',                       -- {stoicism, action, courage}
  status          text not null default 'pending',           -- pending | approved | rejected | retired
  reviewed_by     text,                                      -- clerk user id
  reviewed_at     timestamptz,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (text_normalized, figure_id)                        -- prevents duplicate ingest
);

create index quotes_status_idx on quotes(status);
create index quotes_themes_idx on quotes using gin (themes);

-- ─── DESIGNS (artwork rendered for a specific quote × template) ───────────

create table design_templates (
  id              text primary key,                          -- "minimal-serif-v1", "split-emoji-v1"
  name            text not null,
  description     text,
  product_kinds   text[] not null,                           -- {tee, tank, hoodie, mug}
  component_path  text not null,                             -- "templates/MinimalSerif.tsx"
  is_active       boolean default true,
  created_at      timestamptz default now()
);

create table designs (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references quotes(id),
  template_id     text not null references design_templates(id),
  product_kind    text not null,                             -- tee|tank|hoodie|mug — drives canvas size
  artwork_url     text not null,                             -- R2 URL of rendered PNG
  artwork_width   int not null,                              -- e.g. 4500
  artwork_height  int not null,                              -- e.g. 5400
  variant_inputs  jsonb not null,                            -- snapshot of params used to render
  status          text not null default 'pending',           -- pending | approved | rejected
  reviewed_by     text,
  reviewed_at     timestamptz,
  created_at      timestamptz default now(),
  unique (quote_id, template_id, product_kind)
);

-- ─── PRINTIFY MIRROR (cache of catalog + our created products) ────────────

create table printify_blueprints (
  id              int primary key,                           -- printify blueprint id (12, 39, 92, 441)
  title           text not null,
  brand           text,
  raw             jsonb not null,                            -- full Printify payload, refresh on schedule
  fetched_at      timestamptz default now()
);

create table printify_providers (
  id              int primary key,
  title           text not null,
  country         text,
  city            text,
  raw             jsonb not null,
  fetched_at      timestamptz default now()
);

create table printify_variants (
  id              int primary key,                           -- printify variant id (e.g. 18060)
  blueprint_id    int not null references printify_blueprints(id),
  provider_id     int not null references printify_providers(id),
  size            text,
  color           text,
  placeholders    jsonb not null,                            -- print position metadata
  raw             jsonb not null,
  fetched_at      timestamptz default now()
);

-- ─── PRODUCTS (our SKUs in the storefront, each = quote × template × kind) ─

create table products (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,                      -- "the-impediment-to-action-tee"
  design_id       uuid not null references designs(id),
  product_kind    text not null,                             -- tee|tank|hoodie|mug
  blueprint_id    int not null references printify_blueprints(id),
  provider_id     int not null references printify_providers(id),
  printify_product_id text,                                  -- set after Printify create
  printify_shop_id   int,
  title           text not null,                             -- shown on product page
  description     text,                                      -- generated from quote/figure
  base_price_pence int not null,                             -- our retail price in GBP pence
  currency        char(3) default 'GBP',
  status          text not null default 'draft',             -- draft | live | retired
  published_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table product_variants (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  printify_variant_id int not null,
  size            text,
  color           text,
  is_enabled      boolean default true,
  cost_pence      int,                                       -- printify cost
  retail_pence    int not null,                              -- what we charge
  unique (product_id, printify_variant_id)
);

create table product_mockups (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  variant_id      uuid references product_variants(id),
  position        text not null,                             -- "front", "back", "lifestyle-1"
  url             text not null,                             -- R2 URL (mirrored from Printify)
  printify_url    text,                                      -- original Printify URL (audit)
  width           int,
  height          int,
  is_default      boolean default false,
  fetched_at      timestamptz default now()
);

-- ─── ADMIN AUDIT ──────────────────────────────────────────────────────────

create table admin_actions (
  id              uuid primary key default gen_random_uuid(),
  actor_clerk_id  text not null,
  action          text not null,                             -- "approve_quote", "publish_product"
  target_type     text not null,                             -- "quote", "design", "product"
  target_id       uuid not null,
  metadata        jsonb default '{}',
  created_at      timestamptz default now()
);
```

**Notable decisions:**
- **`quotes.text_normalized`** — generated column for de-duplication and search; prevents accidental duplicates from formatting differences
- **`designs.variant_inputs`** — JSONB snapshot of every parameter that produced the PNG (template version, font names, emoji char, dimensions). Makes regeneration deterministic and lets us reason about why a render looks the way it does.
- **Printify mirror tables** — we cache blueprints/providers/variants locally so the storefront never makes a synchronous call to Printify. Refresh nightly via Inngest.
- **Soft delete via `status`** — deleted designs and products linger so we never break order history when checkout lands

---

## §4 — API routes / endpoints

Next.js Route Handlers. Public routes are GET-only and cache-friendly; mutating routes are admin-gated.

### Public storefront
| Method | Route | Purpose |
|---|---|---|
| GET | `/` | Landing page (RSC, ISR 1h) |
| GET | `/shop` | Browse all live products, filterable by kind/theme/figure |
| GET | `/shop/figures/[slug]` | All products quoting one figure |
| GET | `/shop/themes/[theme]` | All products in a theme |
| GET | `/p/[slug]` | Product detail page |
| GET | `/about`, `/journal`, `/contact` | MDX-rendered marketing pages |

### Internal API (server-only)
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/admin/quotes` | Submit a curated quote (admin) |
| POST | `/api/admin/quotes/[id]/approve` | Move quote → approved |
| POST | `/api/admin/quotes/generate-aphorisms` | Triggers Inngest job: LLM produces N candidates |
| POST | `/api/admin/designs/render` | Triggers Inngest job: render quote × template × kind |
| POST | `/api/admin/products/create-on-printify` | Triggers Inngest: upload artwork + create Printify product |
| POST | `/api/admin/products/[id]/publish` | Sets status='live', enables on storefront |
| GET  | `/api/admin/printify/sync` | Refresh blueprint/provider/variant cache |
| POST | `/api/printify/webhook` | (later) receive Printify status updates |

### Inngest jobs (event-driven, not user-callable directly)
| Event | Job | Description |
|---|---|---|
| `quotes.approved` | `auto-render-default-design` | When a quote is approved, render it with the default template across all 4 product kinds |
| `designs.approved` | `create-printify-products` | Upload artwork to Printify, create product record per blueprint, fetch mockups |
| `printify.products.created` | `mirror-mockups` | Download Printify mockup URLs to R2 (so we control them long-term) |
| `cron / 0 3 * * *` | `refresh-printify-catalog` | Nightly refresh of blueprints/providers/variants |

---

## §5 — Printify integration workflow

This is the most operationally important section. Grounded in real responses from probes run 2026-05-09.

### Auth
Bearer token in `Authorization: Bearer <PRINTIFY_API_TOKEN>`. Token lives in `PRINTIFY_API_TOKEN` env var, server-only. Scopes verified for our token: `shops.manage shops.read catalog.read orders.read orders.write products.read products.write webhooks.read webhooks.write uploads.read uploads.write print_providers.read user.info` — covers everything we need including future order submission.

### MVP Catalog (locked, real Printify data)

| Product | Blueprint | Provider | Variants | Sizes | Colours | Print positions |
|---|---|---|---|---|---|---|
| **T-shirt** | `12` Bella+Canvas Unisex Jersey Tee | `6` T Shirt and Sons (GB Westbury) | 129 | S–3XL | 22 | front, back |
| **Tank/Vest** | `39` Bella+Canvas Unisex Jersey Tank | `6` T Shirt and Sons (GB Westbury) | 24 | S–XL | 6 (Athletic Heather, Black, Navy, Red, True Royal, White) | front, back |
| **Hoodie** | `92` AWDIS Unisex College Hoodie | `6` T Shirt and Sons (GB Westbury) | 82 | XS–2XL | 15 | front, back |
| **Mug** | `441` Ceramic Mug (EU) | `30` OPT OnDemand (CZ Prague) | 2 | 11oz, 15oz | white | front |

Three out of four products fulfil from one UK provider — simpler shipping, single point of operational contact, lower combined-order shipping if a customer buys multiple items in future.

### Existing shop note
The current Printify account has one shop: **Fashion Kudos** (id `4353393`, sales channel `etsy`). For the EMOJI DUST custom storefront we need a second shop with a non-Etsy channel — Printify supports an "API/Custom Integration" channel for this. **Action required (owner):** create a new Printify shop named "EMOJI DUST" with the Custom Integration channel; capture its `shop_id` into `PRINTIFY_SHOP_ID` env var. This is a one-time setup step.

### Product creation flow (per design × blueprint)

```
1. Design approved in admin
   └─> Inngest job: createPrintifyProduct(designId, blueprintId, providerId)

2. Upload artwork PNG to Printify
   POST /v1/uploads/images.json
        body: { file_name, contents (base64 of artwork PNG from R2) }
   ← returns image_id

3. Build variant list from cached printify_variants for blueprint × provider

4. Build product payload
   POST /v1/shops/{shop_id}/products.json
        body: {
          title, description,
          blueprint_id, print_provider_id,
          variants: [{ id: <variant_id>, price: <pence>, is_enabled }],
          print_areas: [{
            variant_ids: [...],
            placeholders: [{ position: 'front', images: [{ id: <image_id>, x, y, scale, angle }] }]
          }]
        }
   ← returns Printify product object with mockup URLs

5. Persist printify_product_id on our products row, mirror mockups to R2

6. (Optional) Publish to Printify storefront channel
   POST /v1/shops/{shop_id}/products/{product_id}/publish.json
   — for the API channel this is a no-op marker; orders flow through us regardless
```

### Mockup mirroring strategy
Printify's mockup URLs are CDN'd but we should **download them to our R2 bucket** at product creation time. Reasons: (1) they can change/expire, (2) we want our own image-optimisation pipeline (Next.js `<Image>` from R2 → automatic AVIF/WebP), (3) Printify CDN going down doesn't take down our storefront.

### Future: order submission (post-MVP)
When checkout lands, we'll add:
- `POST /v1/shops/{shop_id}/orders.json` — submit order for fulfilment
- Webhook subscription on `order:fulfilled`, `order:shipment:created`, etc.

---

## §6 — Quote / design generation workflow

### Quote ingestion
**Curated path (real-figure quotes, kind=`attributed`):**
1. Source from Wikiquote, Project Gutenberg, public-domain anthologies
2. Manual or semi-manual ingest via `/admin/quotes/ingest` form (or CSV upload in v2)
3. LLM verifier (Claude Haiku) checks: (a) is this quote actually attributed to this figure on the source URL? (b) is the figure's body of work in the public domain or fair-use safe?
4. Admin reviews, sets `themes[]`, picks emoji, approves

**Generative path (aphorisms, kind=`aphorism`):**
1. Admin runs "Generate aphorisms" job in admin, optionally seeded with a theme prompt
2. Claude Haiku produces N candidates in EMOJI DUST voice
3. Each candidate enters quotes table with `status='pending'`, `figure_id=null`
4. Admin reviews, approves the keepers, rejects the rest
5. The brand voice of these aphorisms is critical — they must sound *like* EMOJI DUST, not generic motivational. Voice guide lives in the prompt template, refined over time.

### Design rendering
1. Approved quote triggers `auto-render-default-design` job
2. Job iterates: for each `(template, product_kind)` combo configured as default
3. Render via Satori:
   - Template is a React component receiving `{ quote, figure, emoji, kind }` props
   - Satori → SVG → Resvg → PNG at the canvas size required by the product (tee/hoodie: 4500×5400 @300dpi for the 15"×18" front print area; mug: 2700×1050 for the wrap)
   - Twemoji used for emoji rendering — embedded via `<img>` tag pointing to Twemoji CDN; Satori resolves and inlines
4. Upload PNG to R2: `designs/{designId}/{kind}.png`
5. Insert designs row, status='pending'
6. Admin previews artwork in `/admin/designs/[id]`, approves or rejects
7. On approval: `designs.approved` event triggers Printify product creation (§5)

### Template strategy at MVP
Three templates is enough for variety without overwhelming the catalogue:
1. **`minimal-serif-v1`** — Quote in serif, centred, generous whitespace, logo signature, attribution caption. The "premium-minimal" look.
2. **`split-emoji-v1`** — Quote split around a single large emoji as visual anchor. The "winking-philosopher" look.
3. **`stacked-cap-v1`** — Quote in tall sans-serif uppercase, dust-gold underline, logo signature. Sportier — best for tanks.

Templates are React components in `src/templates/`. Adding a new template = adding a new file + an entry in `design_templates` table. No DB migration needed.

### Cost / volume model
- Aphorism generation: Claude Haiku ~$0.001 per quote candidate. Generating 50 candidates per session ≈ 5¢. Negligible.
- Design rendering: free (CPU time on Vercel function, ~250ms per design)
- Storage: R2 ~$0.015/GB. 1000 designs × 4 kinds × ~500KB = 2GB = 3¢/month.
- LLM verification: Haiku ~$0.005 per quote verified. 1000 quotes = $5 one-off.

The catalogue is genuinely cheap to scale. The expensive resource is taste, not compute.

---

## §7 — Product page UX structure

### Mobile-first product page (single-column on phones, two-column on desktop)

```
┌─────────────────────────────────────┐
│ [Nav: EMOJI DUST     Shop  About]   │  Sticky, transparent over hero
├─────────────────────────────────────┤
│                                     │
│   [Mockup carousel — front, back,   │
│    lifestyle, detail]               │  Mockups from R2, lazy AVIF
│                                     │
│   ⓘ Dot indicators                  │
├─────────────────────────────────────┤
│  THE QUOTE — set in product type     │  Hero typography matching the design itself
│                                     │
│  — Marcus Aurelius · Meditations    │  Attribution full + readable
│                                     │
│  £24.00                             │  Price prominent
│                                     │
│  Size:    [S][M][L][XL][2XL][3XL]   │  Variant pickers
│  Colour:  ●○○○○○○○○○                │  Swatches
│                                     │
│  [   Add to bag (disabled MVP)   ]  │  CTA — disabled with tooltip until checkout
│  [   Notify me when shipping      ] │  Email-capture fallback at MVP
│                                     │
│  ───────────────────────────────    │
│  About this design                  │
│  Three sentences about the quote +  │  AI-assisted, admin-edited blurb
│  the figure + the design template.  │
│                                     │
│  Materials: 100% combed cotton…     │  Pulled from blueprint metadata
│  Print: Direct-to-garment, UK       │  Pulled from provider metadata
│  Care: Machine wash cold, inside out│  Static text per kind
│                                     │
│  ─── More from Marcus Aurelius ─── │  Cross-link to figure's other quotes
│  [ tile ] [ tile ] [ tile ]         │
│                                     │
└─────────────────────────────────────┘
```

### Why this layout
- **Mockup-first because that's what's being bought** — the wearable design *is* the product
- **Price and variant pickers above the fold** — purchase intent is decided in 8–10 seconds on mobile
- **Attribution gets full real estate on the page** — contrasts with the deliberate restraint on the design itself (per Q4 decision)
- **"Notify me" is a real feature at MVP** — captures emails without checkout, lets us soft-launch + measure demand per design

### Performance budget
- LCP < 1.5s on 4G mobile
- All mockups served as AVIF from R2 via Next/Image
- Critical CSS inlined, fonts preloaded, no client JS for product page beyond variant picker (a small client island)

### Accessibility floor
- All mockups have alt text describing the design (auto-generated from quote + figure + colour)
- Variant pickers are keyboard-navigable, swatch hovers announce colour names
- Contrast ratio ≥ 4.5:1 on all text

---

## §8 — Admin workflow

### Routes (all under `/admin/**`, Clerk-gated)
| Route | Purpose |
|---|---|
| `/admin` | Dashboard — pending counts, recent activity |
| `/admin/figures` | List + add public figures |
| `/admin/quotes` | Pending queue + approved/rejected tabs |
| `/admin/quotes/new` | Manual quote entry form |
| `/admin/quotes/generate` | Trigger aphorism generation, review candidates |
| `/admin/designs` | Designs awaiting approval — preview each render |
| `/admin/products` | Products: draft → ready-for-printify → live |
| `/admin/products/[id]` | Edit title/description/price, choose mockups, publish |
| `/admin/printify` | Refresh catalog, view sync status, view shop info |
| `/admin/audit` | Last 100 admin actions |

### The lifecycle of a single product
```
Quote (pending)
   → admin approves
   → auto-render fires across {minimal-serif-v1} × {tee, tank, hoodie, mug}
   → 4 designs (pending)
   → admin reviews each design preview, approves the keepers
   → for each approved design: Printify upload + product create job
   → 4 products (draft, with mockups)
   → admin sets price, picks default mockup, publishes
   → 4 products (live) on the storefront
```

End-to-end, with one admin pass, time-on-task ~5 minutes per quote across 4 products. With three templates instead of one, you'd net 12 products from one approved quote.

### Approval gates (intentional)
There are deliberately three approval gates: **quote**, **design**, **product**. Auto-publishing AI-touched goods is a brand risk — small effort, large protection. As trust builds with specific templates, we can add a per-template "auto-approve design if quote.status=approved" bypass.

---

## §9 — Implementation plan

The work decomposes into five sub-projects. Each has its own design spec → implementation plan → execution cycle. **This document does not authorise any implementation.** Each sub-project gets brainstormed at its own gate.

| # | Sub-project | What it delivers | Approx. effort | Blocker / dependency |
|---|---|---|---|---|
| **1** | **Foundations** | Repo scaffold, env, DB schema migrated, Drizzle setup, Clerk wired, R2 wired, Vercel deployed empty shell, design-token system, brand assets vectorised | 2–3 days | Owner provides: new repo URL, Vercel/Neon/Clerk/R2/Anthropic accounts |
| **2** | **Quote + design pipeline** | Quote CRUD, aphorism generator, three Satori templates, design renderer, R2 upload, admin preview UI | 3–4 days | #1 |
| **3** | **Printify sync layer** | Catalog mirror cron, upload + product create flow, mockup mirror, Inngest job orchestration | 2–3 days | #1, plus owner creates EMOJI DUST shop in Printify |
| **4** | **Admin workflow UI** | All `/admin/**` pages above, audit log, end-to-end "approve quote → live product in 5 min" | 3–4 days | #2, #3 |
| **5** | **Public storefront** | Landing, shop browse, product page, MDX marketing pages, performance hardening | 4–5 days | #4 (some products live to display) |
| 6 *(post-MVP)* | Checkout + orders | Stripe Checkout, order webhook → Printify order submit, customer order page | 3–4 days | live storefront, Stripe credentials |
| 7 *(post-MVP)* | Customer accounts + email | Clerk customer tier, order history, transactional emails via Resend | 2–3 days | #6 |

**Total MVP effort: ~14–19 focused days.** Realistically 3–4 calendar weeks at sustainable pace.

The sequence is strict: 1 → 2 → 3 → 4 → 5. Don't parallelise. Each later sub-project depends on the data shapes and conventions established earlier.

---

## §10 — MVP scope vs future

### In MVP (sub-projects 1–5)
- 4 product types: tee, tank, hoodie, mug
- Storefront browseable + product pages purchasable in *visible* terms (mockup, variant pick, price, "Notify me")
- 3 design templates
- Hybrid quote sourcing (curated + aphorisms) with full admin approval flow
- 1 Printify shop, UK/EU providers only
- Three templates exist in code; one (`minimal-serif-v1`) is marked default and auto-renders on quote approval. The other two render on demand from admin.
- Launch maths: ~50 approved quotes × 4 product kinds × 1 auto-template = **200 live SKUs at launch**, expandable to 600 by triggering the other two templates as taste allows
- GBP only, UK/EU shipping only

### Explicitly NOT in MVP
- Checkout / payments (sub-project 6)
- Customer accounts + order history
- Transactional emails (welcome, order confirm, shipping)
- Discount codes / gift cards
- Search beyond basic Postgres `ILIKE`
- Multi-currency, multi-language
- Mobile app
- Wholesale or B2B
- US-based fulfilment
- Multiple Printify shops / channels

### Roadmap after MVP (priority order)
1. **Checkout** — Stripe + Printify order submission. Single most valuable feature post-launch.
2. **Customer accounts + transactional email** — order history, shipping notifications, post-purchase nudges
3. **Email capture → conversion drip** — turn the "Notify me" signups into customers when checkout opens
4. **Search + improved discovery** — figures index, themes, search by mood/occasion
5. **Multiple templates per design** — give the customer template choice on the product page (one design, three style options)
6. **Per-figure landing pages** — editorial layout per figure, mini-biography, all quotes
7. **Gift mode** — gift wrap, message card, send to a different address
8. **Wholesale / bulk** — for indie bookshops, museum gift shops
9. **US fulfilment** — when US sales prove demand, enable a US provider per blueprint to halve shipping cost for US buyers
10. **Mobile app** — last; the storefront is mobile-first, an app adds friction not value at this stage

---

## §11 — Environment variables

```bash
# Printify — server only
PRINTIFY_API_TOKEN=...                # provided 2026-05-09, ROTATE after first use
PRINTIFY_SHOP_ID=...                  # set after EMOJI DUST shop created in Printify

# Database
DATABASE_URL=postgresql://...         # Neon, with ?sslmode=require

# Auth
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=emoji-dust
R2_PUBLIC_URL=https://cdn.emojidust.com

# LLM
ANTHROPIC_API_KEY=sk-ant-...

# Background jobs
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Observability
SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...

# Site
NEXT_PUBLIC_SITE_URL=https://emojidust.com

# Future (post-MVP)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
```

---

## §12 — Error handling philosophy

- **Fail loud at boundaries, fail soft inside.** Printify timing out on a single product create should retry (Inngest auto-retries) and surface to admin as "this product needs human attention," not crash the page.
- **No customer ever sees a Printify error.** All Printify operations are background jobs. The customer's product page renders from our cached state, not live API calls.
- **Idempotency on creates.** Every `createPrintifyProduct` job carries a deterministic key (`design_id + blueprint_id`) so a retry doesn't double-create.
- **Sentry for unexpected, structured logs for expected.** Stripe/Printify/Anthropic non-2xx responses log structured (Logtail). True bugs throw and reach Sentry.
- **Soft-degradation on render failures.** If Satori fails to render a design, the design row gets `status='render_failed'` with the error stored, and admin sees a clear retry button. No half-rendered PNGs uploaded.

---

## §13 — Deployment recommendations

| Environment | Domain | Branch | Purpose |
|---|---|---|---|
| Production | `emojidust.com` | `main` | Public store |
| Preview | `*.emoji-dust.vercel.app` | per-PR | Vercel auto-previews |
| Staging | `staging.emojidust.com` | `staging` | Pre-prod manual QA before promoting to main |

**Database:** Neon's branching feature creates a copy-on-write DB per Vercel preview deployment automatically. Each PR gets its own isolated Postgres branch. This is genuinely magical for migrations.

**DNS:** Cloudflare → Vercel for app, Cloudflare → R2 for `cdn.emojidust.com`.

**CI:** GitHub Actions runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` on every PR. Vercel deploys preview on green.

**Monitoring:** Sentry on errors, Vercel Analytics on Core Web Vitals, Logtail on structured app logs, UptimeRobot or Better Stack on a 1-minute public-page healthcheck.

---

## §14 — Risks + open questions

| # | Risk / question | Severity | Mitigation / next step |
|---|---|---|---|
| R1 | Token in this transcript is compromised | High | Owner rotates token after returning to this work |
| R2 | Logo file is JPEG, won't print sharply at scale | High | Vectorise to SVG before product creation in #2 |
| R3 | Printify shop on Etsy channel; need separate API channel shop | High | Owner creates EMOJI DUST shop in Printify dashboard, captures shop_id |
| R4 | Brand voice for aphorism generator is undefined | Medium | Pipeline spec (sub-project #2) defines voice guide + few-shot prompt examples — voice is the moat |
| R5 | "EMOJI DUST" trademark availability | Medium | Owner verifies UK + EU + US trademark search before public launch |
| R6 | Right of publicity for living figures | Medium | Hard rule: only deceased, public-domain figures at MVP. Living figures need explicit licensing or stay out of catalog. Encode in figure.is_public_domain check. |
| R7 | Pricing model not finalised | Low | Tee £20, tank £18, hoodie £35, mug £12 are reasonable defaults; owner reviews against COGS in Foundations spec |
| R8 | Etsy shop "Fashion Kudos" exists in account — is it active business? | Low | Owner confirms; doesn't block MVP either way |
| R9 | Twemoji licence (CC-BY 4.0) | Low | Compatible with commercial use; attribution in site footer required |
| R10 | UK fulfilment may be cheaper but US sales will eat shipping margin until US providers added | Low | Phase 9 of roadmap |

---

## §15 — Legal + compliance notes (preliminary)

- **Public-domain quote sources only at MVP.** Wikiquote with explicit "free quote" tag, or pre-1928 published works. No Maya Angelou, Mandela, Rumi-translations-by-living-translators without explicit licensing.
- **GDPR**: customer data minimal at MVP (only "Notify me" email captures). Resend handles bounce/unsubscribe; we keep an opt-out flag column when checkout lands.
- **VAT**: when we open checkout, UK VAT registration threshold is £90k — we register voluntarily before that to keep accounting clean from day one.
- **Cookies**: Vercel Analytics is cookieless. Clerk uses session cookies but only on `/admin` until customer accounts ship. Cookie banner not needed at MVP.

---

## §16 — How this doc relates to the rest of the work

```
This file ─── north-star (high-level, all 10 deliverables, no code commitments)
   │
   ├──→ docs/superpowers/specs/2026-MM-DD-foundations-design.md      (sub-project #1)
   │       └──→ implementation plan
   │              └──→ execution
   │
   ├──→ docs/superpowers/specs/2026-MM-DD-quote-design-pipeline-design.md   (#2)
   │
   ├──→ docs/superpowers/specs/2026-MM-DD-printify-sync-design.md           (#3)
   │
   ├──→ docs/superpowers/specs/2026-MM-DD-admin-workflow-design.md          (#4)
   │
   └──→ docs/superpowers/specs/2026-MM-DD-storefront-design.md              (#5)
```

When the owner returns and approves this north-star doc, the immediate next step is brainstorming the **Foundations** sub-project at the right level of detail to actually scaffold and ship.

---

*End of document.*
