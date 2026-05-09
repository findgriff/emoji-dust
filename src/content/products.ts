/**
 * Materialise the storefront product list at module load:
 * for each approved quote × each product kind, generate one Product row.
 *
 * Until Printify-Pop-Up sync runs, printify_external_url is undefined and
 * the Buy CTA on the product page falls back to "Coming soon."
 */
import { CATALOG, type Product, type ProductKind, productSlug } from './catalog';
import { QUOTES } from './quotes';
import { figureBySlug } from './figures';

const KINDS: ProductKind[] = ['tee', 'tank', 'hoodie', 'mug'];

function titleFor(quote_id: string, kind: ProductKind): string {
  const q = QUOTES.find((x) => x.id === quote_id)!;
  const f = q.figure_slug ? figureBySlug(q.figure_slug) : null;
  const kindLabel = CATALOG[kind].hero_label;
  if (f) return `${f.name} — ${kindLabel}`;
  return `${kindLabel} · EMOJI DUST`;
}

export const PRODUCTS: Product[] = QUOTES.flatMap((q) =>
  KINDS.map<Product>((kind) => ({
    slug: productSlug(q.id, kind),
    quote_id: q.id,
    kind,
    title: titleFor(q.id, kind),
    retail_pence: CATALOG[kind].retail_pence,
    artwork_path: `/designs/${q.id}.png`,
  }))
);

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

/** Featured = the 12 most visually iconic for the landing hero rail. Curated by hand. */
export const FEATURED_QUOTE_IDS = [
  'aurelius-impediment',
  'wilde-stars',
  'ed-smallest-unit',
  'thoreau-direction',
  'rumi-seeking',
  'ed-soft-strategy',
  'lao-tzu-step',
  'ed-plot-twist',
  'whitman-sunshine',
  'da-vinci-simplicity',
  'ed-night-sky',
  'van-gogh-dream',
];
