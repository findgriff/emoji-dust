/**
 * Mockup categorization + selection.
 *
 * Each Printify mockup carries a `camera_label` query param (front-2, back-2,
 * person-1, folded, hanging-1, …). We bucket those into four product-page
 * categories so the storefront can lead with the most premium-looking shot
 * available — model-on-body where Printify offers it (hoodies do, tees don't),
 * clean flat-front everywhere else.
 *
 * We also curate which colours to mirror — Printify gives us 4 angles × every
 * variant colour (16+ per product). Mirroring ALL of those would be 60+ files
 * per product. Instead we pick 1–2 representative colours per theme and
 * mirror their full set of angles. That's the catalogue voice: one shirt
 * shown beautifully, with a colour swatcher offering the rest.
 */

import type { ProductKind } from '@/content/catalog';

export type MockupCategory = 'on_model' | 'flat_front' | 'flat_back' | 'detail';
export type MockupTheme = 'light' | 'dark';

/**
 * Categorize a Printify camera_label into one of our four buckets.
 * Order matters — we check the most distinctive patterns first.
 */
export function categorizeCamera(label: string): MockupCategory {
  const l = label.toLowerCase();
  if (/^(person|model|lifestyle|scene|outdoor|urban|wearing)/i.test(l)) return 'on_model';
  if (/^back/i.test(l)) return 'flat_back';
  if (/folded|hanging|detail|close|zoom/i.test(l)) return 'detail';
  return 'flat_front';
}

/**
 * Per-kind hand-curated colour priorities for hero mockups.
 * Two light + two dark per kind — keeps the catalogue visually coherent
 * without flooding the page with samey shots.
 */
const HERO_COLOURS: Record<ProductKind, { light: string[]; dark: string[] }> = {
  tee: {
    light: ['Natural', 'White'],
    dark: ['Black', 'Navy'],
  },
  tank: {
    light: ['White', 'Athletic Heather'],
    dark: ['Black', 'Navy'],
  },
  hoodie: {
    light: ['Arctic White', 'Heather Grey'],
    dark: ['Jet Black', 'Oxford Navy'],
  },
  mug: {
    light: [], // mug only has white
    dark: [],
  },
};

export function heroColoursFor(kind: ProductKind, theme: MockupTheme): string[] {
  return HERO_COLOURS[kind][theme] ?? [];
}

/**
 * Categorized, ordered list of mockup file paths the storefront uses.
 *
 *   { on_model: [...], flat_front: [...], flat_back: [...], detail: [...] }
 *
 * Each list is keyed by category so the gallery can present them in a
 * priority order: on_model first (where it exists), then flat_front, etc.
 */
export type CategorizedMockups = Record<MockupCategory, string[]>;

/**
 * Pick the best mockup to use as the headline tile image on browse pages.
 * Priority: on_model → flat_front → first available.
 */
export function pickHeroMockup(m: CategorizedMockups): string | undefined {
  return m.on_model[0] ?? m.flat_front[0] ?? m.flat_back[0] ?? m.detail[0];
}

export const CATEGORY_ORDER: MockupCategory[] = ['on_model', 'flat_front', 'flat_back', 'detail'];

export const CATEGORY_LABEL: Record<MockupCategory, string> = {
  on_model: 'On a model',
  flat_front: 'Front',
  flat_back: 'Back',
  detail: 'Detail',
};
