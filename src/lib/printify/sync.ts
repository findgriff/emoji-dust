/**
 * Sync orchestrator: take an EMOJI DUST product and create the corresponding
 * Printify product, applying the LIGHT artwork to light-coloured variants
 * and the DARK artwork to dark-coloured variants.
 *
 * Flow:
 *   1. Render light + dark print-size PNGs in memory (4500×5400 transparent)
 *   2. Upload both to Printify → light_image_id, dark_image_id
 *   3. Fetch variants for the (blueprint_id, provider_id) pair
 *   4. Classify each variant as 'light' or 'dark' based on colour name
 *   5. POST /shops/{shop_id}/products.json with TWO print_areas blocks:
 *        - one for light variants pointing to light_image_id
 *        - one for dark variants pointing to dark_image_id
 *   6. POST /publish.json — surfaces the listing on whatever channel the
 *      shop is connected to (Pop-Up, Etsy, etc.)
 *   7. Return product id, mockup URLs, external_handle if available
 */

import { printify, type PrintifyProduct, type PrintifyVariant } from './client';
import { CATALOG, classifyColour, type Product } from '@/content/catalog';
import { quoteById } from '@/content/quotes';
import { figureBySlug } from '@/content/figures';
import { renderDesignToPng } from '@/design/render';

export type SyncResult = {
  product_slug: string;
  printify_product_id: string;
  external_url: string | null;
  mockups: Record<'light' | 'dark', { url: string; position: string; variant_ids: number[] }[]>;
};

export async function syncProductToPrintify(product: Product, shopId: number): Promise<SyncResult> {
  const quote = quoteById(product.quote_id);
  if (!quote) throw new Error(`Quote not found: ${product.quote_id}`);
  const figure = quote.figure_slug ? figureBySlug(quote.figure_slug) : null;
  const meta = CATALOG[product.kind];

  // 1. Render print-size PNGs in memory (transparent backgrounds)
  const PRINT_SIZE = { width: 4500, height: 5400 };
  const lightPng = await renderDesignToPng({
    quote,
    figure: figure ?? null,
    ...PRINT_SIZE,
    theme: 'light',
    background: 'transparent',
  });

  const lightUpload = await printify.uploads.fromBase64(
    `${product.quote_id}-light.png`,
    lightPng.toString('base64'),
  );

  let darkUpload = null;
  if (meta.supports_dark) {
    const darkPng = await renderDesignToPng({
      quote,
      figure: figure ?? null,
      ...PRINT_SIZE,
      theme: 'dark',
      background: 'transparent',
    });
    darkUpload = await printify.uploads.fromBase64(
      `${product.quote_id}-dark.png`,
      darkPng.toString('base64'),
    );
  }

  // 2. Fetch variants
  const { variants } = await printify.catalog.variants(meta.blueprint_id, meta.provider_id);

  // 3. Filter to the curated allowlist (Printify caps products at 100 enabled variants)
  const colourAllow = new Set(meta.enabled_colours);
  const sizeAllow = new Set(meta.enabled_sizes);
  const filtered = variants.filter((v) => {
    const colour = v.options?.color ?? '';
    const size = v.options?.size ?? '';
    const colourOk = colourAllow.size === 0 || colourAllow.has(colour);
    const sizeOk = sizeAllow.size === 0 || sizeAllow.has(size);
    return colourOk && sizeOk;
  });
  if (filtered.length === 0) {
    throw new Error(`No variants matched allowlist for ${product.kind} — check enabled_colours/enabled_sizes in catalog.ts`);
  }
  if (filtered.length > 100) {
    throw new Error(`${filtered.length} variants enabled, Printify caps at 100. Trim enabled_colours.`);
  }

  // 4. Classify variants by colour
  const lightVariantIds: number[] = [];
  const darkVariantIds: number[] = [];
  for (const v of filtered) {
    const colour = v.options?.color ?? '';
    if (meta.supports_dark && classifyColour(colour) === 'dark') {
      darkVariantIds.push(v.id);
    } else {
      lightVariantIds.push(v.id);
    }
  }

  // 4. Build product payload
  const description = figure
    ? `"${quote.text}" — ${figure.name}${quote.source_work ? ', ' + quote.source_work : ''}.\n\n${figure.bio}`
    : `An EMOJI DUST original.\n\n"${quote.text}"`;

  const cleanText = quote.text.replace(/\s+/g, ' ').trim();
  const truncatedQuote = cleanText.length > 50 ? cleanText.slice(0, 50) + '…' : cleanText;
  const title = figure
    ? `${truncatedQuote} — ${figure.name} ${meta.hero_label}`
    : `${truncatedQuote} ${meta.hero_label} · EMOJI DUST`;

  const allVariantIds = [...lightVariantIds, ...darkVariantIds];
  const printAreas: unknown[] = [
    {
      variant_ids: lightVariantIds,
      placeholders: [
        {
          position: 'front',
          images: [{ id: lightUpload.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
        },
      ],
    },
  ];
  if (darkUpload && darkVariantIds.length > 0) {
    printAreas.push({
      variant_ids: darkVariantIds,
      placeholders: [
        {
          position: 'front',
          images: [{ id: darkUpload.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
        },
      ],
    });
  }

  const payload = {
    title,
    description,
    blueprint_id: meta.blueprint_id,
    print_provider_id: meta.provider_id,
    variants: allVariantIds.map((id) => ({
      id,
      price: product.retail_pence,
      is_enabled: true,
    })),
    print_areas: printAreas,
    tags: ['EMOJI DUST', meta.hero_label, ...(quote.themes ?? [])].slice(0, 13),
  };

  // 5. Create
  const created: PrintifyProduct = await printify.products.create(shopId, payload);

  // 6. Publish (best-effort — fails on disconnected shops, that's ok)
  try {
    await printify.products.publish(shopId, created.id);
  } catch (err) {
    console.warn(`[printify] publish skipped for ${created.id}: ${(err as Error).message.slice(0, 100)}`);
  }

  // 7. Group mockups by colour theme (variant_ids → light/dark)
  const lightSet = new Set(lightVariantIds);
  const lightMockups: { url: string; position: string; variant_ids: number[] }[] = [];
  const darkMockups: { url: string; position: string; variant_ids: number[] }[] = [];
  for (const img of created.images ?? []) {
    if (!img.src) continue;
    const isLight = (img.variant_ids ?? []).some((id) => lightSet.has(id));
    const target = isLight ? lightMockups : darkMockups;
    target.push({ url: img.src, position: img.position ?? 'front', variant_ids: img.variant_ids ?? [] });
  }

  return {
    product_slug: product.slug,
    printify_product_id: created.id,
    external_url: created.external?.handle ?? null,
    mockups: { light: lightMockups, dark: darkMockups },
  };
}

export async function getEnabledVariants(
  blueprint_id: number,
  provider_id: number,
): Promise<PrintifyVariant[]> {
  const { variants } = await printify.catalog.variants(blueprint_id, provider_id);
  return variants;
}
