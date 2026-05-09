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
};

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
  },
  mug: {
    kind: 'mug',
    blueprint_id: 441,
    blueprint_title: 'Ceramic Mug (EU)',
    brand: 'EMOJI DUST',
    provider_id: 30,
    provider_title: 'OPT OnDemand',
    provider_country: 'CZ',
    retail_pence: 1400,
    default_color: 'White',
    hero_label: 'Mug',
    description:
      'Glossy 11oz ceramic, dishwasher and microwave safe. Printed in Prague.',
    print_positions: ['front'],
  },
};

/**
 * Canonical product type — what gets listed on the storefront.
 * One quote × one product kind = one product. Slug is stable.
 */
export type Product = {
  slug: string;
  quote_id: string;
  kind: ProductKind;
  title: string;
  retail_pence: number;
  printify_external_url?: string; // populated after Printify Pop-Up sync
  artwork_path: string; // /designs/<quote_id>.png
};

export const productSlug = (quote_id: string, kind: ProductKind) => `${quote_id}-${kind}`;

export const formatPrice = (pence: number, currency: 'GBP' = 'GBP') => {
  const value = pence / 100;
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(value);
};
