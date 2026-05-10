/**
 * CLI: re-pull mockups for products that already exist on Printify.
 *
 * Reads data/products.json, fetches each product's full image list via
 * GET /shops/{id}/products/{id}.json, categorizes by camera angle and
 * colour, mirrors a curated set per category, and updates the mapping.
 *
 * Use this after changing mockup categorization logic without recreating
 * Printify products. Runs ~3s per product (no Printify rate-limit issue
 * since we're only doing GETs).
 *
 * Usage:
 *   pnpm mockups:remirror                  # re-pull all 24 existing products
 *   pnpm mockups:remirror aurelius-impediment-tee   # one specific product
 */

import { writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { URL as NodeURL } from 'node:url';
import { printify, type PrintifyVariant } from '../src/lib/printify/client';
import { CATALOG, type ProductKind } from '../src/content/catalog';
import {
  categorizeCamera,
  heroColoursFor,
  type CategorizedMockups,
  type MockupCategory,
  type MockupTheme,
} from '../src/lib/printify/mockups';

const SHOP_ID = Number(process.env.PRINTIFY_SHOP_ID || '0');
const MAX_PER_CATEGORY = 6; // up to 6 shots per (category, theme) — plenty of variety

type Mapping = {
  slug: string;
  printify_product_id: string;
  external_url: string | null;
  /** Old shape (flat string[]). Kept for back-compat — overwritten on remirror. */
  mockups?: { light: string[]; dark: string[] };
  /** New shape (categorized). Populated by remirror. */
  mockups_v2?: { light: CategorizedMockups; dark: CategorizedMockups };
};

function emptyCategorized(): CategorizedMockups {
  return { on_model: [], flat_front: [], flat_back: [], detail: [] };
}

async function downloadTo(url: string, outPath: string): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buf);
  return buf.length;
}

// Cache: blueprint+provider → variant_id → colour name
const VARIANT_COLOUR_CACHE = new Map<string, Map<number, string>>();

async function fetchVariantsWithRetry(blueprintId: number, providerId: number, attempts = 5): Promise<PrintifyVariant[]> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const { variants } = await printify.catalog.variants(blueprintId, providerId);
      return variants;
    } catch (err) {
      lastErr = err;
      const msg = (err as Error).message;
      if (msg.includes('429') || msg.includes('Too Many')) {
        const backoff = 5000 * Math.pow(2, i); // 5s, 10s, 20s, 40s, 80s
        console.warn(`    rate limited on variants ${blueprintId}/${providerId}, waiting ${backoff/1000}s…`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function getVariantColours(blueprintId: number, providerId: number): Promise<Map<number, string>> {
  const key = `${blueprintId}:${providerId}`;
  const cached = VARIANT_COLOUR_CACHE.get(key);
  if (cached) return cached;
  const variants = await fetchVariantsWithRetry(blueprintId, providerId);
  const map = new Map<number, string>();
  for (const v of variants) {
    const colour = (v.options as any)?.color ?? '';
    map.set(v.id, colour);
  }
  VARIANT_COLOUR_CACHE.set(key, map);
  return map;
}

async function remirrorOne(slug: string, productId: string): Promise<{ light: CategorizedMockups; dark: CategorizedMockups } | null> {
  const kind = slug.split('-').pop() as ProductKind;
  const meta = CATALOG[kind];
  if (!meta) {
    console.warn(`  unknown kind for ${slug}`);
    return null;
  }

  // 1. Fetch the live product
  let product: any;
  try {
    const res = await fetch(`https://api.printify.com/v1/shops/${SHOP_ID}/products/${productId}.json`, {
      headers: { Authorization: `Bearer ${process.env.PRINTIFY_API_TOKEN}` },
    });
    if (!res.ok) throw new Error(`GET → ${res.status}`);
    product = await res.json();
  } catch (err) {
    console.warn(`  failed to fetch ${productId}: ${(err as Error).message}`);
    return null;
  }

  const images: Array<{ src: string; variant_ids: number[]; position: string; is_default: boolean }> = product.images ?? [];
  if (images.length === 0) return null;

  // 2. Look up cached colours for this blueprint+provider
  const variantColour = await getVariantColours(meta.blueprint_id, meta.provider_id);

  // 3. For each image, derive { camera, colour }
  const enriched = images.map((img) => {
    const u = new NodeURL(img.src);
    const camera = u.searchParams.get('camera_label') ?? img.position ?? 'front';
    // an image's variant_ids belong to one colour group (same colour, all sizes)
    const sample = img.variant_ids[0];
    const colour = sample ? (variantColour.get(sample) ?? '') : '';
    return { url: img.src, camera, colour, category: categorizeCamera(camera) };
  });

  // 4. Curate: keep images whose colour is in the hero priority list per theme
  const themes: MockupTheme[] = ['light', 'dark'];
  const out: { light: CategorizedMockups; dark: CategorizedMockups } = {
    light: emptyCategorized(),
    dark: emptyCategorized(),
  };

  // Wipe the existing mockup directory for this product so old files don't linger
  const productMockupDir = join(process.cwd(), 'public', 'mockups', slug.replace(/-(?:tee|tank|hoodie|mug)$/, ''), kind);
  if (existsSync(productMockupDir)) {
    await rm(productMockupDir, { recursive: true, force: true });
  }
  await mkdir(productMockupDir, { recursive: true });

  for (const theme of themes) {
    const heroColours = heroColoursFor(kind, theme);
    if (heroColours.length === 0 && theme === 'dark' && !meta.supports_dark) continue;

    // For light, also accept any image whose colour isn't in the dark priority list — fallback
    const isPriority = (colour: string) => heroColours.some((c) => c.toLowerCase() === colour.toLowerCase());

    // Sort enriched into the right theme bucket. If hero list is empty, pick first available colour.
    let candidates = enriched.filter((e) => isPriority(e.colour));
    if (candidates.length === 0) {
      // Pick any colour group as fallback (e.g. mug only has white)
      candidates = enriched;
    }

    // Group by category, dedupe by URL
    const byCategory: Record<MockupCategory, typeof candidates> = {
      on_model: [],
      flat_front: [],
      flat_back: [],
      detail: [],
    };
    for (const c of candidates) byCategory[c.category].push(c);

    // Hash-based interleaved (camera × colour) picking — same algorithm as
    // sync-printify.ts. Without this, adjacent products in the catalogue
    // get IDENTICAL first-mockups because Printify's API returns images in
    // a stable order and naive slice(0, MAX_PER_CATEGORY) picks the same
    // camera+colour pair every time.
    const slugHash = (() => {
      let h = 2166136261 >>> 0; // FNV-1a basis
      for (let i = 0; i < slug.length; i++) {
        h ^= slug.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      return h;
    })();

    for (const cat of ['on_model', 'flat_front', 'flat_back', 'detail'] as MockupCategory[]) {
      const items = byCategory[cat];
      if (items.length === 0) continue;

      // Group by camera angle, sort cameras alphabetically for determinism
      const byCamera = new Map<string, typeof items>();
      for (const it of items) {
        const arr = byCamera.get(it.camera) ?? [];
        arr.push(it);
        byCamera.set(it.camera, arr);
      }
      const cameras = Array.from(byCamera.keys()).sort();

      // Rotate camera order so different products start with different cameras
      const rotation = slugHash % cameras.length;
      const ordered = [...cameras.slice(rotation), ...cameras.slice(0, rotation)];

      // Within each camera, sort colours alphabetically then offset by hash
      const sortedByCamera = new Map<string, typeof items>();
      for (const cam of ordered) {
        sortedByCamera.set(
          cam,
          [...byCamera.get(cam)!].sort((a, b) => a.colour.localeCompare(b.colour)),
        );
      }

      // Multi-pass interleave: pass 0 picks one shot per camera (each with
      // a different colour offset), pass 1 picks again with shifted offsets,
      // and so on until we hit MAX_PER_CATEGORY.
      const orderedPicks: typeof items = [];
      const maxColours = Math.max(...ordered.map((c) => sortedByCamera.get(c)!.length));
      for (let pass = 0; pass < maxColours; pass++) {
        for (let ci = 0; ci < ordered.length; ci++) {
          if (orderedPicks.length >= MAX_PER_CATEGORY) break;
          const cam = ordered[ci];
          const colourOptions = sortedByCamera.get(cam)!;
          if (colourOptions.length === 0) continue;
          const colourIdx = (slugHash + ci * 7 + pass * 11) % colourOptions.length;
          orderedPicks.push(colourOptions[colourIdx]);
        }
        if (orderedPicks.length >= MAX_PER_CATEGORY) break;
      }

      const seen = new Set<string>();
      let written = 0;
      for (const pick of orderedPicks) {
        if (written >= MAX_PER_CATEGORY) break;
        if (seen.has(pick.url)) continue;
        seen.add(pick.url);
        const fileName = `${theme}-${cat}-${written}.jpg`;
        const outPath = join(productMockupDir, fileName);
        try {
          await downloadTo(pick.url, outPath);
          out[theme][cat].push(`/mockups/${slug.replace(/-(?:tee|tank|hoodie|mug)$/, '')}/${kind}/${fileName}`);
          written++;
        } catch (err) {
          console.warn(`    skipped ${fileName}: ${(err as Error).message}`);
        }
      }
    }
  }

  return out;
}

async function main() {
  if (!process.env.PRINTIFY_API_TOKEN || !SHOP_ID) {
    console.error('PRINTIFY_API_TOKEN + PRINTIFY_SHOP_ID required');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const kindIdx = args.indexOf('--kind');
  const kindFilter = kindIdx >= 0 ? args[kindIdx + 1] : undefined;
  const slugFilter = args.find((a, i) => !a.startsWith('--') && a !== kindFilter);
  const path = join(process.cwd(), 'data', 'products.json');
  const mappings: Mapping[] = JSON.parse(await import('node:fs').then((fs) => fs.promises.readFile(path, 'utf8')));

  let targets = mappings;
  if (slugFilter) targets = targets.filter((m) => m.slug === slugFilter);
  if (kindFilter) targets = targets.filter((m) => m.slug.endsWith(`-${kindFilter}`));
  console.log(`Remirroring ${targets.length} product(s)…\n`);

  // Pre-warm variant cache so rate-limit pain happens once, upfront
  const seenKinds = new Set<ProductKind>();
  for (const m of targets) {
    const kind = m.slug.split('-').pop() as ProductKind;
    if (seenKinds.has(kind)) continue;
    seenKinds.add(kind);
    const meta = CATALOG[kind];
    if (!meta) continue;
    process.stdout.write(`  pre-fetching variants for ${kind} (bp ${meta.blueprint_id} × pp ${meta.provider_id})… `);
    try {
      await getVariantColours(meta.blueprint_id, meta.provider_id);
      console.log('cached');
    } catch (err) {
      console.log(`failed: ${(err as Error).message.slice(0, 100)}`);
    }
  }
  console.log();

  let success = 0;
  let failed = 0;
  for (let i = 0; i < targets.length; i++) {
    const m = targets[i];
    process.stdout.write(`  [${i + 1}/${targets.length}] ${m.slug}…  `);
    try {
      const v2 = await remirrorOne(m.slug, m.printify_product_id);
      if (v2) {
        m.mockups_v2 = v2;
        // Drop the legacy flat shape so it doesn't get used by accident
        delete m.mockups;
        const counts = `light: model=${v2.light.on_model.length} front=${v2.light.flat_front.length} back=${v2.light.flat_back.length} detail=${v2.light.detail.length}, dark: model=${v2.dark.on_model.length} front=${v2.dark.flat_front.length} back=${v2.dark.flat_back.length} detail=${v2.dark.detail.length}`;
        console.log(`✓ ${counts}`);
        success++;
      } else {
        console.log(`✗ no images`);
        failed++;
      }
    } catch (err) {
      console.log(`✗ ${(err as Error).message.slice(0, 100)}`);
      failed++;
    }
    // persist after each product
    await writeFile(path, JSON.stringify(mappings, null, 2));
  }

  console.log(`\nDone: ${success} ok, ${failed} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
