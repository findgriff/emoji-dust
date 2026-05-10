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

      // Deterministic hash of slug — same product always picks same combos
      // (idempotent across re-syncs) but adjacent products diverge.
      const slugHash = (() => {
        let h = 2166136261 >>> 0; // FNV-1a basis
        for (let i = 0; i < p.slug.length; i++) {
          h ^= p.slug.charCodeAt(i);
          h = Math.imul(h, 16777619) >>> 0;
        }
        return h;
      })();

      async function mirrorByCategory(
        themeMockups: typeof result.mockups.light,
        targetBuckets: CategorizedMockups,
        theme: 'light' | 'dark',
      ) {
        // Decode camera_label and colour-group from each mockup
        const items = themeMockups.map((m) => {
          const cam = new NodeURL(m.url).searchParams.get('camera_label') ?? m.position ?? 'front';
          // Use first variant_id as the "colour group" key — every variant in a
          // mockup's variant_ids array is the same colour, different sizes.
          const colourKey = (m.variant_ids?.[0] ?? 0).toString();
          return { ...m, camera: cam, colourKey, category: categorizeCamera(cam) };
        });

        const byCat: Record<MockupCategory, typeof items> = {
          on_model: [], flat_front: [], flat_back: [], detail: [],
        };
        for (const it of items) byCat[it.category].push(it);

        for (const cat of ['on_model','flat_front','flat_back','detail'] as MockupCategory[]) {
          // Pick varied (camera × colour) combos using slugHash:
          // 1. Group by camera angle within the category
          // 2. Sort cameras alphabetically for determinism
          // 3. Rotate camera order by slugHash so different products start at different angles
          // 4. For each camera, pick a colour offset by (slugHash + cameraIndex) — different
          //    products get different colours on the same camera angle, and within one product
          //    different cameras land on different colours
          const byCamera = new Map<string, typeof items>();
          for (const it of byCat[cat]) {
            const arr = byCamera.get(it.camera) ?? [];
            arr.push(it);
            byCamera.set(it.camera, arr);
          }
          const cameras = Array.from(byCamera.keys()).sort();
          if (cameras.length === 0) continue;

          const rotation = slugHash % cameras.length;
          const ordered = [...cameras.slice(rotation), ...cameras.slice(0, rotation)];

          // Generate (camera, colour) picks in interleaved priority:
          //   1st pass: cam[0]-colour[a], cam[1]-colour[b], cam[2]-colour[c]…
          //   2nd pass: cam[0]-colour[d], cam[1]-colour[e]… (different colour per camera)
          // This way: blueprints with many cameras (tees, 17 model angles) get one
          // colour per camera; blueprints with few cameras (hoodies, 2 model angles)
          // cycle through all colours of the few cameras.
          const sortedByCamera = new Map<string, typeof items>();
          for (const cam of ordered) {
            sortedByCamera.set(cam, [...byCamera.get(cam)!].sort((a, b) =>
              a.colourKey.localeCompare(b.colourKey),
            ));
          }

          const orderedPicks: typeof items = [];
          const maxColoursAcrossCameras = Math.max(...ordered.map((c) => sortedByCamera.get(c)!.length));
          for (let pass = 0; pass < maxColoursAcrossCameras; pass++) {
            for (let ci = 0; ci < ordered.length; ci++) {
              if (orderedPicks.length >= MAX_PER_CATEGORY) break;
              const cam = ordered[ci];
              const colourOptions = sortedByCamera.get(cam)!;
              if (colourOptions.length === 0) continue;
              // Each (camera, pass) gets a different colour offset
              const colourIdx = (slugHash + ci * 7 + pass * 11) % colourOptions.length;
              orderedPicks.push(colourOptions[colourIdx]);
            }
            if (orderedPicks.length >= MAX_PER_CATEGORY) break;
          }

          for (const pick of orderedPicks) {
            if (targetBuckets[cat].length >= MAX_PER_CATEGORY) break;
            if (seen.has(pick.url)) continue;
            seen.add(pick.url);
            try {
              const fileName = `${theme}-${cat}-${targetBuckets[cat].length}.jpg`;
              const dir = join(process.cwd(), 'public', 'mockups', p.quote_id, p.kind);
              await mkdir(dir, { recursive: true });
              const res = await fetch(pick.url);
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
