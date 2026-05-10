/**
 * Shop grid that alternates between two visual treatments per product:
 *
 *   even index → ProductCard (lifestyle/model mockup with the design)
 *   odd index  → EditorialCard (the quote on black, austere, mug-evoking)
 *
 * Both link to the SAME product detail page — the alternation is a
 * presentation rhythm, not separate SKUs. The detail page surfaces both
 * treatments in its image rail so the customer always gets the full
 * product context regardless of which tile they clicked.
 */

import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/content/catalog';
import { CATALOG, formatPrice } from '@/content/catalog';
import { quoteById } from '@/content/quotes';
import { figureBySlug } from '@/content/figures';
import { ProductCard } from './product-card';

function EditorialCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const quote = quoteById(product.quote_id);
  const figure = quote?.figure_slug ? figureBySlug(quote.figure_slug) ?? null : null;
  const kindMeta = CATALOG[product.kind];

  return (
    <Link href={`/p/${product.slug}`} className="lift block group">
      <div className="relative aspect-[5/6] overflow-hidden rounded-xl border border-ink/5 bg-ink">
        <Image
          src={product.artwork_dark_preview}
          alt={`${quote?.text} — dark stock`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="object-cover"
        />
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-cream/95 text-[10px] font-medium tracking-wider uppercase text-ink/70">
          {kindMeta.hero_label}
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-ink/70 backdrop-blur text-[10px] font-medium tracking-widest uppercase text-cream/80 border border-cream/20">
          Dark stock
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted truncate">
            {figure ? figure.name : 'Emoji Dust Original'}
          </div>
          <div className="mt-0.5 text-sm font-serif font-medium text-ink line-clamp-2 leading-snug group-hover:text-plum transition-colors">
            {quote?.text}
          </div>
        </div>
        <div className="text-sm font-medium text-ink shrink-0 pt-0.5">{formatPrice(product.retail_pence)}</div>
      </div>
    </Link>
  );
}

/**
 * A product "has a real mockup" when Printify gave us at least one model
 * shot, lifestyle shot, or flat-front. Products without a mockup fall back
 * to the rendered design preview — fine on editorial tiles, less hero-y on
 * the regular tile slots.
 */
function hasMockup(p: Product): boolean {
  const m = p.mockups?.light;
  if (!m) return false;
  return (m.on_model.length + m.flat_front.length + m.flat_back.length + m.detail.length) > 0;
}

/**
 * Order products so the FIRST products with real Printify mockups land on
 * even indices (regular product tiles), and unmockup'd products fill odd
 * indices (editorial tiles, where no mockup is needed). Stable within each
 * partition — preserves catalogue order otherwise.
 */
function interleaveForAlternation(products: Product[]): Product[] {
  const mocked: Product[] = [];
  const rest: Product[] = [];
  for (const p of products) (hasMockup(p) ? mocked : rest).push(p);

  const out: Product[] = [];
  let mi = 0;
  let ri = 0;
  for (let i = 0; i < products.length; i++) {
    if (i % 2 === 0) {
      // even slot — render as product card → prefer a real-mockup product
      if (mi < mocked.length) out.push(mocked[mi++]);
      else out.push(rest[ri++]);
    } else {
      // odd slot — editorial card → mockup not required
      if (ri < rest.length) out.push(rest[ri++]);
      else out.push(mocked[mi++]);
    }
  }
  return out;
}

export function AlternatingGrid({ products }: { products: Product[] }) {
  const ordered = interleaveForAlternation(products);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
      {ordered.map((p, i) => {
        const isEditorial = i % 2 === 1;
        const Card = isEditorial ? EditorialCard : ProductCard;
        return <Card key={p.slug} product={p} priority={i < 8} />;
      })}
    </div>
  );
}
