/**
 * CLI: push EMOJI DUST products to Printify and capture Pop-Up URLs + mockups.
 *
 * Usage:
 *   pnpm sync:printify                          # dry-run all
 *   pnpm sync:printify --commit                 # push everything (~35 min, throttled)
 *   pnpm sync:printify --commit --kind tee      # one product kind
 *   pnpm sync:printify --commit --featured      # only the 12 featured quotes
 *   pnpm sync:printify --commit aurelius-impediment   # one quote
 *
 * Env required:
 *   PRINTIFY_API_TOKEN
 *   PRINTIFY_SHOP_ID
 *
 * Side effects:
 *   - Creates products on Printify (and tries to publish — fails harmlessly on disconnected shops)
 *   - Mirrors mockup JPEGs to public/mockups/<quote_id>/<kind>/<theme>-<n>.jpg
 *   - Writes data/products.json with the mapping our pages use to render mockups
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { URL as NodeURL } from 'node:url';
import { PRODUCTS } from '../src/content/products';
import { FEATURED_QUOTE_IDS } from '../src/content/products';
import { syncProductToPrintify, type SyncResult } from '../src/lib/printify/sync';
import { printify } from '../src/lib/printify/client';
import { categorizeCamera, type MockupCategory } from '../src/lib/printify/mockups';

const MAX_PER_CATEGORY = 6;       // up to 6 shots per (category, theme)
const THROTTLE_MS = 8000;         // Printify allows 200 product writes / 30 min ≈ 9s spacing

async function mirrorMockup(quote_id: string, kind: string, theme: string, idx: number, url: string): Promise<string> {
  const dir = join(process.cwd(), 'public', 'mockups', quote_id, kind);
  await mkdir(dir, { recursive: true });
  const fileName = `${theme}-${idx}.jpg`;
  const outPath = join(dir, fileName);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mockup fetch failed: ${url} → ${res.status}`);
  await writeFile(outPath, Buffer.from(await res.arrayBuffer()));
  return `/mockups/${quote_id}/${kind}/${fileName}`;
}

type CategorizedMockups = {
  on_model: string[];
  flat_front: string[];
  flat_back: string[];
  detail: string[];
};

type StorefrontProduct = {
  slug: string;
  printify_product_id: string;
  external_url: string | null;
  /** New shape — categorized */
  mockups_v2?: { light: CategorizedMockups; dark: CategorizedMockups };
  /** Legacy — kept for backward compat */
  mockups?: { light: string[]; dark: string[] };
};

async function loadExistingMappings(): Promise<Record<string, StorefrontProduct>> {
  const path = join(process.cwd(), 'data', 'products.json');
  if (!existsSync(path)) return {};
  try {
    const raw = JSON.parse(await readFile(path, 'utf8')) as StorefrontProduct[];
    return Object.fromEntries(raw.map((r) => [r.slug, r]));
  } catch {
    return {};
  }
}

async function persist(mappings: Record<string, StorefrontProduct>) {
  const dir = join(process.cwd(), 'data');
  await mkdir(dir, { recursive: true });
  const list = Object.values(mappings).sort((a, b) => a.slug.localeCompare(b.slug));
  await writeFile(join(dir, 'products.json'), JSON.stringify(list, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes('--commit');
  const featuredOnly = args.includes('--featured');
  const kindIdx = args.indexOf('--kind');
  const kindArg = kindIdx >= 0 ? args[kindIdx + 1] : undefined;
  const positional = args.find((a, i) => !a.startsWith('--') && a !== kindArg && (i === 0 || !args[i - 1].startsWith('--')));

  // Verify env
  const shopIdRaw = process.env.PRINTIFY_SHOP_ID;
  if (!shopIdRaw) {
    console.error('PRINTIFY_SHOP_ID not set in .env.local');
    process.exit(1);
  }
  const shopId = Number(shopIdRaw);

  const shops = await printify.shops();
  const shop = shops.find((s) => s.id === shopId);
  if (!shop) {
    console.error(`Shop ${shopId} not found.`);
    process.exit(1);
  }

  // Filter
  let targets = PRODUCTS;
  if (featuredOnly) targets = targets.filter((p) => FEATURED_QUOTE_IDS.includes(p.quote_id));
  if (kindArg) targets = targets.filter((p) => p.kind === kindArg);
  if (positional) targets = targets.filter((p) => p.quote_id === positional);

  console.log(`\nShop: ${shop.id} (${shop.title}, channel=${shop.sales_channel})`);
  console.log(`Target: ${targets.length} product(s)\n`);

  if (!commit) {
    console.log('Dry run — pass --commit to push.\n');
    targets.slice(0, 10).forEach((p) => console.log(`  would create: ${p.slug}`));
    if (targets.length > 10) console.log(`  ... and ${targets.length - 10} more`);
    return;
  }

  const mappings = await loadExistingMappings();

  let success = 0;
  let failed = 0;
  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    process.stdout.write(`  [${i + 1}/${targets.length}] ${p.slug}…  `);
    try {
      const result: SyncResult = await syncProductToPrintify(p, shopId);

      // Categorize each create-response mockup BEFORE Printify garbage-collects
      // the non-default ones (Printify keeps ~16 of 132 long-term — model shots
      // are typically pruned, so we must mirror them now).
      const lightBuckets: CategorizedMockups = { on_model: [], flat_front: [], flat_back: [], detail: [] };
      const darkBuckets: CategorizedMockups = { on_model: [], flat_front: [], flat_back: [], detail: [] };
      const seen = new Set<string>();

      async function mirrorByCategory(
        themeMockups: typeof result.mockups.light,
        targetBuckets: CategorizedMockups,
        theme: 'light' | 'dark',
      ) {
        // Sort: place on_model first so they're prioritised even if disk space tight
        const items = themeMockups.map((m) => {
          const cam = new NodeURL(m.url).searchParams.get('camera_label') ?? m.position ?? 'front';
          return { ...m, camera: cam, category: categorizeCamera(cam) };
        });
        // Group by category
        const byCat: Record<MockupCategory, typeof items> = {
          on_model: [], flat_front: [], flat_back: [], detail: [],
        };
        for (const it of items) byCat[it.category].push(it);
        // Mirror up to MAX_PER_CATEGORY per category
        for (const cat of ['on_model','flat_front','flat_back','detail'] as MockupCategory[]) {
          for (const it of byCat[cat]) {
            if (targetBuckets[cat].length >= MAX_PER_CATEGORY) break;
            if (seen.has(it.url)) continue;
            seen.add(it.url);
            try {
              const fileName = `${theme}-${cat}-${targetBuckets[cat].length}.jpg`;
              const dir = join(process.cwd(), 'public', 'mockups', p.quote_id, p.kind);
              await mkdir(dir, { recursive: true });
              const res = await fetch(it.url);
              if (!res.ok) continue;
              await writeFile(join(dir, fileName), Buffer.from(await res.arrayBuffer()));
              targetBuckets[cat].push(`/mockups/${p.quote_id}/${p.kind}/${fileName}`);
            } catch { /* skip */ }
          }
        }
      }

      await mirrorByCategory(result.mockups.light, lightBuckets, 'light');
      await mirrorByCategory(result.mockups.dark, darkBuckets, 'dark');

      mappings[p.slug] = {
        slug: p.slug,
        printify_product_id: result.printify_product_id,
        external_url: result.external_url,
        mockups_v2: { light: lightBuckets, dark: darkBuckets },
      };

      const ls = `light: model=${lightBuckets.on_model.length} front=${lightBuckets.flat_front.length} back=${lightBuckets.flat_back.length} detail=${lightBuckets.detail.length}`;
      const ds = `dark: model=${darkBuckets.on_model.length} front=${darkBuckets.flat_front.length} back=${darkBuckets.flat_back.length} detail=${darkBuckets.detail.length}`;
      console.log(`✓ ${result.printify_product_id}  ${ls}, ${ds}`);
      success++;
    } catch (err) {
      console.log(`✗ ${(err as Error).message.slice(0, 100)}`);
      failed++;
    }

    // persist after each product so a crash doesn't lose progress
    await persist(mappings);

    // throttle (last iteration skips the wait)
    if (i < targets.length - 1) {
      await new Promise((r) => setTimeout(r, THROTTLE_MS));
    }
  }

  console.log(`\nDone: ${success} ok, ${failed} failed. Mappings written to data/products.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
