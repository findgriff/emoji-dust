/**
 * Materialise the storefront product list at module load:
 * for each approved quote × each product kind, generate one Product row.
 *
 * If data/products.json exists (after a sync run), enrich each Product with
 * the corresponding Printify product id, external URL, and mirrored mockups.
 */
import { CATALOG, type Product, type ProductKind, productSlug } from './catalog';
import { QUOTES } from './quotes';
import { figureBySlug } from './figures';
import productsData from '../../data/products.json' with { type: 'json' };

const KINDS: ProductKind[] = ['tee', 'tank', 'hoodie', 'mug'];

type CategorizedMockups = {
  on_model: string[];
  flat_front: string[];
  flat_back: string[];
  detail: string[];
};

type Mapping = {
  slug: string;
  printify_product_id: string;
  external_url: string | null;
  mockups?: { light: string[]; dark: string[] }; // legacy, ignored
  mockups_v2?: { light: CategorizedMockups; dark: CategorizedMockups };
};

const MAPPINGS = new Map<string, Mapping>(
  (productsData as Mapping[]).map((m) => [m.slug, m])
);

function titleFor(quote_id: string, kind: ProductKind): string {
  const q = QUOTES.find((x) => x.id === quote_id)!;
  const f = q.figure_slug ? figureBySlug(q.figure_slug) : null;
  const kindLabel = CATALOG[kind].hero_label;
  if (f) return `${f.name} — ${kindLabel}`;
  return `${kindLabel} · EMOJI DUST`;
}

export const PRODUCTS: Product[] = QUOTES.flatMap((q) =>
  KINDS.map<Product>((kind) => {
    const slug = productSlug(q.id, kind);
    const m = MAPPINGS.get(slug);
    return {
      slug,
      quote_id: q.id,
      kind,
      title: titleFor(q.id, kind),
      retail_pence: CATALOG[kind].retail_pence,
      artwork_light_preview: `/designs/${q.id}-preview-light.png`,
      artwork_dark_preview: `/designs/${q.id}-preview-dark.png`,
      editorial_image: `/designs/${q.id}-editorial-black.png`,
      printify_product_id: m?.printify_product_id,
      printify_external_url: m?.external_url ?? undefined,
      mockups: m?.mockups_v2,
    };
  })
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
