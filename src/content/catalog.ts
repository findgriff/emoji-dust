/**
 * The MVP catalog. Each row pairs a Printify blueprint with its print provider,
 * the variants we'll surface on the storefront, and the GBP retail price.
 *
 * Pricing logic: retail ≈ 2.4× Printify base cost (rough indie POD margin).
 * Numbers are placeholder — owner reviews against real provider quotes in
 * the Foundations sub-project.
 */

export type ProductKind = 'tee' | 'tank' | 'hoodie' | 'mug';

export type CatalogEntry = {
  kind: ProductKind;
  blueprint_id: number;
  blueprint_title: string;
  brand: string;
  provider_id: number;
  provider_title: string;
  provider_country: string;
  retail_pence: number;
  default_color: string;
  hero_label: string;
  description: string;
  print_positions: ('front' | 'back')[];
  /** Whether this product can be ordered on dark-coloured stock at all */
  supports_dark: boolean;
  /**
   * Curated colour allowlist. Printify caps products at 100 enabled
   * variants — full Bella+Canvas tee has 22 colours × 6 sizes = 132,
   * so we narrow to a tight palette that fits the brand.
   * Empty array = enable everything available.
   */
  enabled_colours: string[];
  /** Curated size allowlist. Empty array = all available sizes. */
  enabled_sizes: string[];
};

/**
 * Classify a Printify variant colour as 'light' or 'dark' for theming.
 * Colours that take dark text well = 'light'.
 * Colours that need white text = 'dark'.
 */
const DARK_COLOUR_PATTERNS = [
  /black/i, /jet/i, /charcoal/i, /asphalt/i,
  /navy/i, /oxford/i,
  /maroon/i, /burgundy/i, /wine/i,
  /forest/i, /army/i, /bottle green/i, /kelly green/i,
  /chocolate/i, /brown/i,
  /purple/i, /plum/i,
  /dark grey heather/i, /dark heather/i,
];

export function classifyColour(colourName: string): 'light' | 'dark' {
  return DARK_COLOUR_PATTERNS.some((p) => p.test(colourName)) ? 'dark' : 'light';
}

export const CATALOG: Record<ProductKind, CatalogEntry> = {
  tee: {
    kind: 'tee',
    blueprint_id: 12,
    blueprint_title: 'Bella+Canvas Unisex Jersey Short Sleeve Tee',
    brand: 'Bella+Canvas',
    provider_id: 6,
    provider_title: 'T Shirt and Sons',
    provider_country: 'GB',
    retail_pence: 2400,
    default_color: 'Natural',
    hero_label: 'T-Shirt',
    description:
      'Soft-handed combed cotton, retail-fit, cut to last. Direct-to-garment printed in Westbury, England.',
    print_positions: ['front'],
    // Tees are light-only at MVP. Reason: Printify's mockup studio only
    // renders 4 angles per colour-group when a product has TWO print_areas
    // (one for light artwork, one for dark). With a SINGLE print_area —
    // light artwork applied uniformly across light-coloured stock — we
    // unlock 33 mockup angles including 17 model/duo/lifestyle shots.
    // The fashion-brand mockup variety beats having dark tee variants at
    // this stage. Dark tees can return as a separate hero product later.
    supports_dark: false,
    enabled_colours: ['Natural', 'White', 'Soft Pink', 'Athletic Heather'],
    enabled_sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
  tank: {
    kind: 'tank',
    blueprint_id: 39,
    blueprint_title: 'Bella+Canvas Unisex Jersey Tank',
    brand: 'Bella+Canvas',
    provider_id: 6,
    provider_title: 'T Shirt and Sons',
    provider_country: 'GB',
    retail_pence: 2200,
    default_color: 'Athletic Heather',
    hero_label: 'Vest',
    description:
      'Lightweight cotton-poly jersey, breathable cut. For workouts, summer, off-duty Sundays.',
    print_positions: ['front'],
    // Same trade-off as tees: light-only for full mockup variety.
    supports_dark: false,
    enabled_colours: ['Athletic Heather', 'White'],
    enabled_sizes: ['S', 'M', 'L', 'XL'],
  },
  hoodie: {
    kind: 'hoodie',
    blueprint_id: 92,
    blueprint_title: 'AWDIS Unisex College Hoodie',
    brand: 'AWDIS',
    provider_id: 6,
    provider_title: 'T Shirt and Sons',
    provider_country: 'GB',
    retail_pence: 4200,
    default_color: 'Jet Black',
    hero_label: 'Hoodie',
    description:
      'Heavyweight 280gsm brushed-back fleece, twin-needle stitched. British heritage cut, printed in England.',
    print_positions: ['front'],
    // Hoodies keep dual stock — AWDIS blueprint's mockup studio caps at
    // 5 angles (front, back, person-1, person-2, size-chart) regardless,
    // so dual print_areas costs us nothing. We already get the on-model
    // shots from this provider.
    supports_dark: true,
    enabled_colours: [
      'Arctic White', 'Heather Grey',
      'Jet Black', 'Oxford Navy', 'Burgundy', 'Bottle Green', 'Charcoal', 'Hot Chocolate',
    ],
    enabled_sizes: ['S', 'M', 'L', 'XL'],
  },
  mug: {
    kind: 'mug',
    blueprint_id: 535,
    blueprint_title: 'ORCA 11oz White Mug',
    brand: 'ORCA Coatings',
    provider_id: 6,
    provider_title: 'T Shirt and Sons',
    provider_country: 'GB',
    retail_pence: 1400,
    default_color: 'White',
    hero_label: 'Mug',
    description:
      'Premium ORCA-coated 11oz ceramic, dishwasher and microwave safe. Dye-sublimation printed in Westbury, England.',
    print_positions: ['front'],
    supports_dark: false,
    enabled_colours: [],  // mug only comes in white
    enabled_sizes: ['11oz'],
  },
};

/**
 * Canonical product type — what gets listed on the storefront.
 * One quote × one product kind = one product. Slug is stable.
 *
 * Each product has TWO design previews (light + dark) plus, when synced to
 * Printify, a structured set of mockup imagery categorized by camera angle:
 * on_model (where the provider supplies model shots), flat_front, flat_back,
 * and detail (folded / hanging).
 */
export type Product = {
  slug: string;
  quote_id: string;
  kind: ProductKind;
  title: string;
  retail_pence: number;
  printify_external_url?: string;
  printify_product_id?: string;
  artwork_light_preview: string;
  artwork_dark_preview: string;
  /** Editorial graphic — quote text on black, no decoration. Used in shop
      grid alternation tiles + product page detail rail. */
  editorial_image: string;
  /** Categorized Printify mockups, populated by `pnpm mockups:remirror`. */
  mockups?: {
    light: { on_model: string[]; flat_front: string[]; flat_back: string[]; detail: string[] };
    dark: { on_model: string[]; flat_front: string[]; flat_back: string[]; detail: string[] };
  };
};

export const productSlug = (quote_id: string, kind: ProductKind) => `${quote_id}-${kind}`;

export const formatPrice = (pence: number, currency: 'GBP' = 'GBP') => {
  const value = pence / 100;
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(value);
};
