/**
 * Sync orchestrator: take an EMOJI DUST product (quote × kind) and create
 * the corresponding Printify product, capturing the Pop-Up listing URL so
 * the storefront's Buy CTA deep-links there.
 *
 * Flow:
 *   1. Read the rendered design PNG from public/designs/<quote_id>.png
 *   2. Upload to Printify → image_id
 *   3. Fetch variants for the (blueprint_id, provider_id) pair
 *   4. POST /shops/{shop_id}/products.json with print_areas
 *   5. POST /publish.json so the listing surfaces on the Pop-Up Store
 *   6. Return the external_handle URL
 *
 * This file is intentionally pure / functional — no DB, no Drizzle.
 * The Foundations sub-project will wrap it with persistence once the DB lands.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { printify, type PrintifyProduct } from './client';
import { CATALOG } from '@/content/catalog';
import { quoteById } from '@/content/quotes';
import { figureBySlug } from '@/content/figures';
import type { Product } from '@/content/catalog';

export type SyncResult = {
  product_slug: string;
  printify_product_id: string;
  external_url: string | null;
};

export async function syncProductToPrintify(product: Product, shopId: number): Promise<SyncResult> {
  const quote = quoteById(product.quote_id);
  if (!quote) throw new Error(`Quote not found: ${product.quote_id}`);
  const figure = quote.figure_slug ? figureBySlug(quote.figure_slug) : null;
  const meta = CATALOG[product.kind];

  // 1. Read the artwork
  const pngPath = join(process.cwd(), 'public', 'designs', `${product.quote_id}.png`);
  const png = await readFile(pngPath);
  const base64 = png.toString('base64');

  // 2. Upload artwork
  const upload = await printify.uploads.fromBase64(`${product.quote_id}.png`, base64);

  // 3. Fetch variants for this blueprint × provider
  const { variants } = await printify.catalog.variants(meta.blueprint_id, meta.provider_id);
  const enabledVariantIds = variants.map((v) => v.id);

  // 4. Build the create payload
  const description = figure
    ? `"${quote.text}" — ${figure.name}${quote.source_work ? ', ' + quote.source_work : ''}. ${figure.bio}`
    : `An EMOJI DUST original. ${quote.text}`;

  const title = figure
    ? `${quote.text.length > 40 ? quote.text.slice(0, 40) + '…' : quote.text} — ${figure.name} ${meta.hero_label}`
    : `${quote.text.length > 50 ? quote.text.slice(0, 50) + '…' : quote.text} ${meta.hero_label}`;

  const payload = {
    title,
    description,
    blueprint_id: meta.blueprint_id,
    print_provider_id: meta.provider_id,
    variants: enabledVariantIds.map((id) => ({
      id,
      price: product.retail_pence, // Printify accepts price in pence (cents) for GBP shop
      is_enabled: true,
    })),
    print_areas: [
      {
        variant_ids: enabledVariantIds,
        placeholders: [
          {
            position: 'front',
            images: [
              {
                id: upload.id,
                x: 0.5,
                y: 0.5,
                scale: 1,
                angle: 0,
              },
            ],
          },
        ],
      },
    ],
  };

  // 5. Create the product
  const created: PrintifyProduct = await printify.products.create(shopId, payload);

  // 6. Publish (for Pop-Up channel this surfaces the listing)
  try {
    await printify.products.publish(shopId, created.id);
  } catch (err) {
    console.warn(`[printify] publish failed for ${created.id}: ${(err as Error).message}`);
  }

  // 7. Pop-Up listings expose external.handle = full URL
  const external_url = created.external?.handle ?? null;

  return {
    product_slug: product.slug,
    printify_product_id: created.id,
    external_url,
  };
}
