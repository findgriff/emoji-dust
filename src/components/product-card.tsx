import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/content/catalog';
import { CATALOG, formatPrice } from '@/content/catalog';
import { quoteById } from '@/content/quotes';
import { figureBySlug } from '@/content/figures';

/**
 * Pick the hero image for a browse tile.
 * Apparel: on-model first (a person wearing it sells the vibe).
 * Mugs: flat-front first — Printify's mug `context-N` shots are angled so
 * the design clips off the visible face. The clean centred front-face shot
 * is the most honest preview; the context shot becomes a secondary angle.
 */
function heroImage(product: Product): { src: string; isModel: boolean } {
  const m = product.mockups?.light;
  if (product.kind === 'mug') {
    if (m?.flat_front?.[0]) return { src: m.flat_front[0], isModel: false };
    if (m?.on_model?.[0]) return { src: m.on_model[0], isModel: true };
  } else {
    if (m?.on_model?.[0]) return { src: m.on_model[0], isModel: true };
    if (m?.flat_front?.[0]) return { src: m.flat_front[0], isModel: false };
  }
  return { src: product.artwork_light_preview, isModel: false };
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const quote = quoteById(product.quote_id);
  const figure = quote?.figure_slug ? figureBySlug(quote.figure_slug) ?? null : null;
  const kindMeta = CATALOG[product.kind];
  const hero = heroImage(product);
  const hasDarkVariant = (product.mockups?.dark?.on_model?.[0] || product.mockups?.dark?.flat_front?.[0]);

  return (
    <Link href={`/p/${product.slug}`} className="lift block group">
      <div className="relative aspect-[5/6] overflow-hidden rounded-xl bg-cream-deep/60 border border-ink/5">
        <Image
          src={hero.src}
          alt={`${quote?.text} — ${kindMeta.hero_label}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="object-cover"
        />
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-cream/90 text-[10px] font-medium tracking-wider uppercase text-ink/70">
          {kindMeta.hero_label}
        </div>
        {hasDarkVariant && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            <span className="w-3 h-3 rounded-full border border-cream/95 bg-cream shadow" />
            <span className="w-3 h-3 rounded-full border border-cream/95 bg-ink shadow" />
          </div>
        )}
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
