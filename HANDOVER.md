# EMOJI DUST — Handoff

**Date:** 2026-05-09
**Author:** Claude (you stepped away mid-brainstorm and asked me to push on while I could)

---

## What this directory is

A new project home for **EMOJI DUST**, the print-on-demand quote brand. Separate from the OpsPocket repo. Not yet pushed to GitHub. Not yet a Next.js project — just docs, brand assets, and a verified Printify integration map.

## What I did while you were away

1. **Set up the project skeleton** at `~/Downloads/emoji-dust/` with `git init`, a strict `.gitignore`, and `.env.local` (chmod 600) holding the Printify token.
2. **Copied your logo** to `brand/emoji-dust-logo.jpeg` so it's portable with the project.
3. **Verified the Printify token works** and explored the catalogue. Found one existing shop ("Fashion Kudos" on Etsy, id 4353393) — we'll need a separate API-channel shop for the EMOJI DUST custom storefront.
4. **Mapped the MVP catalogue against real Printify data** — chose UK/EU print providers throughout. Three of four products fulfil from one UK printer (T Shirt and Sons, Westbury). Details in the spec.
5. **Wrote the full north-star architecture spec** at [`docs/superpowers/specs/2026-05-09-emoji-dust-north-star-design.md`](docs/superpowers/specs/2026-05-09-emoji-dust-north-star-design.md) — covers all 10 deliverables you originally requested, locked the 5 brainstorm decisions, decomposed implementation into 5 sub-projects.
6. **Self-reviewed the spec** for placeholders, contradictions, scope, ambiguity. Made two small tightenings.
7. **Did NOT scaffold any code.** I deliberately stopped at the spec gate — the brainstorming process requires you to review the spec before we move to writing-plans → implementation, and I lacked the credentials to actually deploy anything anyway.

## What you need to do when you return

**In priority order:**

1. **Read [the north-star spec](docs/superpowers/specs/2026-05-09-emoji-dust-north-star-design.md)** — confirm the locked decisions still feel right. If anything reads wrong, tell me and I'll revise. This is the gate before we go further.

2. **Rotate the Printify API token.** It went into a chat transcript. Generate a new one at https://printify.com/app/account/api and replace the value in `.env.local`. Then revoke the old one. The token in `.env.local` is gitignored but assume the value is compromised.

3. **Vectorise the logo.** The current `brand/emoji-dust-logo.jpeg` is fine for the website but won't print sharply on a t-shirt at 4500×5400px. Convert to SVG (Affinity Designer / Illustrator / Vectorizer.AI) before sub-project #2 (Quote + design pipeline). Save to `brand/emoji-dust-logo.svg`.

4. **Create a custom-channel shop in Printify** named "EMOJI DUST" — a second shop separate from the existing Fashion Kudos / Etsy one. Capture the new `shop_id` and add it to `.env.local` as `PRINTIFY_SHOP_ID=...`.

5. **Decide where this project lives long-term.** Options:
   - Stay at `~/Downloads/emoji-dust/` (current, fine for now)
   - Move to `~/Code/emoji-dust/` or similar (recommended)
   - When ready, push to a new GitHub repo (suggest `findgriff/emoji-dust`) — the existing `git init` is local only

6. **Trademark check.** Quick UK/EU/US search for "EMOJI DUST" in classes 25 (apparel) and 21 (mugs). Listed as risk R5 in the spec.

7. **Provision accounts** for the upcoming Foundations sub-project. You'll need:
   - Vercel (free hobby tier)
   - Neon Postgres (free tier)
   - Clerk (free tier covers admin gate)
   - Cloudflare R2 (free 10GB)
   - Anthropic console (for the Haiku key — `ANTHROPIC_API_KEY`)
   - Inngest (free tier)
   - Sentry (free tier)

   Don't paste any of those keys into chat. Add them straight to `.env.local` once it lives in the right repo.

## What's next in the workflow

Once you've reviewed the spec and confirmed the decisions:

```
You approve north-star spec
   ↓
We brainstorm sub-project #1 "Foundations" at higher detail
   ↓
Foundations design spec written + approved
   ↓
Foundations implementation plan written
   ↓
Foundations executed (repo scaffolded, deployed, brand tokens, schema migrated)
   ↓
… repeat for #2, #3, #4, #5
```

The total MVP path is roughly 14–19 focused days of work. The first 2–3 days (Foundations) are where the most "is this real?" satisfaction comes — by the end of #1 you'll have a deployed shell at `emojidust.com` with the database live, even if it's empty.

## Files in this directory

```
emoji-dust/
├── .env.local                            # secrets (gitignored, chmod 600)
├── .gitignore
├── HANDOVER.md                           # this file
├── brand/
│   └── emoji-dust-logo.jpeg              # JPEG; vectorise before launch
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-05-09-emoji-dust-north-star-design.md   # the spec
└── scripts/
    └── _probe-out/                       # Printify API probe results (gitignored)
```

## Questions or pushback you might have

**"Why didn't you just start coding?"**
Three reasons: (1) I'm in the OpsPocket Flutter repo and you didn't tell me where to make a new repo for EMOJI DUST. Better to have a clean spec waiting than half-scaffolded code in the wrong place. (2) The brainstorming workflow requires you to approve the spec before implementation. (3) I don't have your Vercel/Neon/Clerk/R2/Anthropic accounts — I literally couldn't deploy anything that would work end-to-end.

**"Why so much detail in the spec?"**
This is the *north-star*, the document every later sub-project will reference. Getting it right once saves writing it five times. Each sub-project will have its own (shorter, tighter) spec when we get there.

**"What if I disagree with one of the locked decisions?"**
Tell me. They were locked through Q1–Q5 in the brainstorm but they're not commandments. Re-opening one of them costs at most an hour of revision in this doc, and it's much cheaper to do that now than after we've written code on top.

**"Where's the code?"**
There isn't any yet, deliberately. Next session, we brainstorm Foundations together and start scaffolding properly.

---

*See you when you're back.*
