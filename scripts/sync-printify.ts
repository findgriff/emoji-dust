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
import { PRODUCTS } from '../src/content/products';
import { FEATURED_QUOTE_IDS } from '../src/content/products';
import { syncProductToPrintify, type SyncResult } from '../src/lib/printify/sync';
import { printify } from '../src/lib/printify/client';

const MAX_MOCKUPS_PER_THEME = 6; // we don't need 264 — keep 6 (front, back, lifestyle×4)
const THROTTLE_MS = 8000;        // Printify allows 200 product writes / 30 min ≈ 9s spacing

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

type StorefrontProduct = {
  slug: string;
  printify_product_id: string;
  external_url: string | null;
  mockups: { light: string[]; dark: string[] };
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

      // Mirror up to MAX_MOCKUPS_PER_THEME mockups per theme to disk
      const lightMirrored: string[] = [];
      const darkMirrored: string[] = [];
      const seen = new Set<string>();
      for (const m of result.mockups.light) {
        if (lightMirrored.length >= MAX_MOCKUPS_PER_THEME) break;
        if (seen.has(m.url)) continue;
        seen.add(m.url);
        try {
          lightMirrored.push(await mirrorMockup(p.quote_id, p.kind, 'light', lightMirrored.length, m.url));
        } catch (e) { /* skip individual mockup failures */ }
      }
      for (const m of result.mockups.dark) {
        if (darkMirrored.length >= MAX_MOCKUPS_PER_THEME) break;
        if (seen.has(m.url)) continue;
        seen.add(m.url);
        try {
          darkMirrored.push(await mirrorMockup(p.quote_id, p.kind, 'dark', darkMirrored.length, m.url));
        } catch (e) { /* skip */ }
      }

      mappings[p.slug] = {
        slug: p.slug,
        printify_product_id: result.printify_product_id,
        external_url: result.external_url,
        mockups: { light: lightMirrored, dark: darkMirrored },
      };

      console.log(`✓ ${result.printify_product_id}  light=${lightMirrored.length} dark=${darkMirrored.length}`);
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
