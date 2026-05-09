import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PRODUCTS, productBySlug } from '@/content/products';
import { CATALOG, formatPrice, type ProductKind } from '@/content/catalog';
import { quoteById } from '@/content/quotes';
import { figureBySlug } from '@/content/figures';
import { ProductCard } from '@/components/product-card';

type Params = Promise<{ slug: string }>;

const KINDS: ProductKind[] = ['tee', 'tank', 'hoodie', 'mug'];

export async function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};
  const quote = quoteById(product.quote_id);
  const figure = quote?.figure_slug ? figureBySlug(quote.figure_slug) : null;
  return {
    title: figure ? `${figure.name} — ${CATALOG[product.kind].hero_label}` : `${CATALOG[product.kind].hero_label}`,
    description: quote?.text,
    openGraph: {
      images: [{ url: product.artwork_path, width: 1200, height: 1440 }],
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const quote = quoteById(product.quote_id)!;
  const figure = quote.figure_slug ? figureBySlug(quote.figure_slug) ?? null : null;
  const kindMeta = CATALOG[product.kind];
  const isAphorism = quote.kind === 'aphorism';

  // Same quote, other kinds
  const sameQuoteOtherKinds = PRODUCTS.filter(
    (p) => p.quote_id === quote.id && p.slug !== product.slug,
  );

  // Other quotes from same figure
  const otherFromFigure = figure
    ? PRODUCTS.filter(
        (p) =>
          quoteById(p.quote_id)?.figure_slug === figure.slug &&
          p.kind === product.kind &&
          p.slug !== product.slug,
      ).slice(0, 4)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      {/* breadcrumbs */}
      <div className="text-xs uppercase tracking-widest text-muted mb-8">
        <Link href="/shop" className="hover:text-ink">Shop</Link> /{' '}
        <Link href={`/shop?kind=${product.kind}`} className="hover:text-ink">{kindMeta.hero_label}s</Link>
        {figure && <> / <Link href={`/figures/${figure.slug}`} className="hover:text-ink">{figure.name}</Link></>}
      </div>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* artwork */}
        <div className="relative aspect-[5/6] rounded-2xl overflow-hidden bg-cream-deep/60 border border-ink/5 lg:sticky lg:top-24">
          <Image
            src={product.artwork_path}
            alt={`${quote.text}${figure ? ' — ' + figure.name : ''}`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 600px"
          />
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-cream/90 text-[11px] font-medium tracking-widest uppercase text-ink/70 border border-ink/5">
            Design preview
          </div>
        </div>

        {/* details */}
        <div className="lg:pt-2">
          <div className="text-xs uppercase tracking-[0.25em] text-dust mb-4 font-medium">
            {isAphorism ? 'Emoji Dust Original' : `${figure?.name}${quote.source_work ? ' · ' + quote.source_work : ''}`}
          </div>

          <h1 className="font-serif text-3xl md:text-4xl tracking-tight leading-snug text-ink">
            {quote.text}
          </h1>

          <div className="mt-8 flex items-baseline gap-3">
            <div className="text-2xl font-medium text-ink">{formatPrice(product.retail_pence)}</div>
            <div className="text-sm text-muted">· {kindMeta.hero_label} · {kindMeta.brand}</div>
          </div>

          {/* CTA */}
          <div className="mt-8 space-y-3">
            {product.printify_external_url ? (
              <a
                href={product.printify_external_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-ink text-cream px-7 py-4 font-medium tracking-wide hover:bg-plum transition-colors"
              >
                Buy on Printify
                <span aria-hidden>↗</span>
              </a>
            ) : (
              <button
                disabled
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-ink/20 text-cream/80 px-7 py-4 font-medium tracking-wide cursor-not-allowed"
                title="Listing live on Printify Pop-Up Store soon"
              >
                Coming soon · syncing to Printify
              </button>
            )}
            <p className="text-xs text-muted leading-relaxed max-w-md">
              Purchasing, dispatch and delivery are handled by Printify — your payment, shipping address and order history live with them. We never see card data.
            </p>
          </div>

          {/* about */}
          <div className="mt-12 prose prose-sm max-w-none">
            <h2 className="font-serif text-xl text-ink mb-3">About this {kindMeta.hero_label.toLowerCase()}</h2>
            <p className="text-ink/75 leading-relaxed">{kindMeta.description}</p>
          </div>

          {/* attribution panel for real quotes */}
          {!isAphorism && figure && (
            <div className="mt-10 p-6 rounded-2xl bg-cream-deep/40 border border-ink/5">
              <div className="text-xs uppercase tracking-[0.25em] text-muted mb-2">About the quote</div>
              <div className="font-serif text-lg text-ink mb-2">{figure.name}</div>
              <div className="text-xs text-muted mb-3">{figure.era} · {figure.domains.join(' · ')}</div>
              <p className="text-sm text-ink/70 leading-relaxed mb-3">{figure.bio}</p>
              <a
                href={figure.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs uppercase tracking-widest text-dust hover:text-ink"
              >
                More on Wikiquote ↗
              </a>
            </div>
          )}

          {/* same quote, other products */}
          {sameQuoteOtherKinds.length > 0 && (
            <div className="mt-10">
              <div className="text-xs uppercase tracking-widest text-muted mb-4">Same quote, other ways</div>
              <div className="flex flex-wrap gap-2">
                {KINDS.filter((k) => k !== product.kind).map((k) => {
                  const alt = sameQuoteOtherKinds.find((p) => p.kind === k);
                  if (!alt) return null;
                  return (
                    <Link
                      key={k}
                      href={`/p/${alt.slug}`}
                      className="px-4 py-2 rounded-full bg-cream-deep/60 text-sm hover:bg-ink hover:text-cream transition-colors"
                    >
                      {CATALOG[k].hero_label} · {formatPrice(alt.retail_pence)}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* more from this figure */}
      {otherFromFigure.length > 0 && (
        <section className="mt-24 md:mt-32">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-serif text-2xl md:text-3xl tracking-tighter">
              More from {figure?.name}
            </h2>
            <Link href={`/figures/${figure?.slug}`} className="text-sm hover:text-dust">All quotes →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-10">
            {otherFromFigure.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
