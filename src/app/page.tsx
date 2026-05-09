import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from '@/components/product-card';
import { PRODUCTS, FEATURED_QUOTE_IDS } from '@/content/products';
import { CATALOG } from '@/content/catalog';
import { QUOTES } from '@/content/quotes';
import { FIGURES } from '@/content/figures';

export default function HomePage() {
  // Featured tees first — pulls from FEATURED_QUOTE_IDS, all tees
  const featured = FEATURED_QUOTE_IDS.map((id) =>
    PRODUCTS.find((p) => p.quote_id === id && p.kind === 'tee')!,
  );

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-20 md:pt-28 pb-16 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative z-10">
            <div className="text-xs tracking-[0.3em] uppercase text-dust mb-6 font-medium">
              Wisdom · with a wink
            </div>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tighter text-ink">
              Words worth wearing.
              <br />
              <span className="italic text-plum">Made today,</span>
              <br />
              <span className="text-dust">on purpose.</span>{' '}
              <span aria-hidden>✨</span>
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-ink/75">
              Quote-led tees, vests, hoodies and mugs. Words from the great minds —
              and a few of our own — set in beautiful typography and printed in
              the UK and EU.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-6 py-3 text-sm font-medium tracking-wide hover:bg-plum transition-colors"
              >
                Shop the catalogue
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-ink/70 hover:text-ink underline-offset-4 hover:underline"
              >
                Read the brief
              </Link>
            </div>
          </div>

          {/* Hero design tile */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[5/6] max-w-md mx-auto rounded-2xl overflow-hidden shadow-[0_30px_80px_-30px_rgba(26,24,23,0.3)]">
              <Image
                src="/designs/aurelius-impediment.png"
                alt="The impediment to action advances action — Marcus Aurelius"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 lg:-right-12 hidden md:block">
              <div className="bg-cream rounded-full px-4 py-2 text-xs uppercase tracking-widest text-ink/60 border border-ink/10 shadow-sm">
                Marcus Aurelius — Tee
              </div>
            </div>
          </div>
        </div>

        {/* Subtle dust trail */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-dust/40 to-transparent pointer-events-none" />
      </section>

      {/* ─── Product strip ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 mt-12 md:mt-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-muted mb-2">Featured</div>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tighter text-ink">
              Designs to live with.
            </h2>
          </div>
          <Link href="/shop" className="text-sm hover:text-dust">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {featured.slice(0, 8).map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 mt-24 md:mt-32">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs tracking-[0.3em] uppercase text-muted mb-3">Four ways to wear</div>
          <h2 className="font-serif text-3xl md:text-4xl tracking-tighter">
            One quote, your weather.
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(['tee', 'tank', 'hoodie', 'mug'] as const).map((kind) => {
            const meta = CATALOG[kind];
            return (
              <Link
                key={kind}
                href={`/shop?kind=${kind}`}
                className="lift group relative aspect-square rounded-xl bg-cream-deep/60 border border-ink/5 overflow-hidden flex flex-col justify-end p-6"
              >
                <div className="font-serif text-2xl text-ink leading-none">{meta.hero_label}</div>
                <div className="text-xs text-muted mt-1.5">From £{(meta.retail_pence / 100).toFixed(0)} · {meta.provider_country === 'GB' ? 'Printed in UK' : 'Printed in EU'}</div>
                <div className="absolute top-5 right-5 text-xs uppercase tracking-widest text-dust opacity-0 group-hover:opacity-100 transition-opacity">
                  Browse →
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Manifesto strip ──────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 mt-28 md:mt-40 text-center">
        <div className="text-xs tracking-[0.3em] uppercase text-dust mb-5">The brief</div>
        <p className="font-serif text-2xl md:text-3xl leading-snug text-ink tracking-tight">
          Wisdom shouldn&apos;t feel like homework. We pair the great quotes
          with a wink, set them in confident typography, and print them on
          things you&apos;ll actually wear and live with.{' '}
          <span aria-hidden>🤍</span>
        </p>
      </section>

      {/* ─── Figures rail ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 mt-24 md:mt-32">
        <div className="text-xs tracking-[0.3em] uppercase text-muted mb-4">Featuring words from</div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 font-serif text-lg md:text-xl text-ink/80">
          {FIGURES.slice(0, 14).map((f, i) => (
            <Link key={f.slug} href={`/figures/${f.slug}`} className="hover:text-dust transition-colors">
              {f.name}{i < 13 ? ' ·' : ''}
            </Link>
          ))}
          <span className="text-muted">+ {QUOTES.filter((q) => q.kind === 'aphorism').length} originals</span>
        </div>
      </section>
    </>
  );
}
