/**
 * CLI: push EMOJI DUST products to Printify and capture Pop-Up URLs.
 *
 * Usage:
 *   pnpm sync:printify                    # dry-run (logs intended payloads)
 *   pnpm sync:printify --commit           # actually create products on Printify
 *   pnpm sync:printify --commit --kind tee  # only one product kind
 *   pnpm sync:printify --commit aurelius-impediment  # one specific quote
 *
 * Env required:
 *   PRINTIFY_API_TOKEN
 *   PRINTIFY_SHOP_ID    (the Pop-Up Store shop id; "Fashion Kudos" is Etsy and won't work)
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PRODUCTS } from '../src/content/products';
import { syncProductToPrintify } from '../src/lib/printify/sync';
import { printify } from '../src/lib/printify/client';

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes('--commit');
  const kindArg = args[args.indexOf('--kind') + 1];
  const quoteArg = args.find((a) => !a.startsWith('--') && a !== kindArg);

  // Verify env
  const shopIdRaw = process.env.PRINTIFY_SHOP_ID;
  if (!shopIdRaw) {
    console.error('PRINTIFY_SHOP_ID not set in .env.local. Create a Pop-Up Store in Printify dashboard first.');
    process.exit(1);
  }
  const shopId = Number(shopIdRaw);

  // Verify the shop exists and is the right channel
  const shops = await printify.shops();
  const shop = shops.find((s) => s.id === shopId);
  if (!shop) {
    console.error(`Shop id ${shopId} not found. Available shops:`);
    shops.forEach((s) => console.error(`  ${s.id}  ${s.title}  (${s.sales_channel})`));
    process.exit(1);
  }
  if (shop.sales_channel !== 'api' && shop.sales_channel !== 'pop-up' && shop.sales_channel !== 'storefront') {
    console.warn(`⚠ shop ${shop.id} is on '${shop.sales_channel}' channel. EMOJI DUST expects an API/Pop-Up channel — products may behave unexpectedly.`);
  }

  // Filter
  let targets = PRODUCTS;
  if (kindArg) targets = targets.filter((p) => p.kind === kindArg);
  if (quoteArg) targets = targets.filter((p) => p.quote_id === quoteArg);

  console.log(`Target: ${targets.length} product(s) → shop ${shop.id} (${shop.title}, ${shop.sales_channel})`);
  if (!commit) {
    console.log('Dry run. Pass --commit to actually push.\n');
    targets.slice(0, 5).forEach((p) => console.log(`  would create: ${p.slug}`));
    if (targets.length > 5) console.log(`  ... and ${targets.length - 5} more`);
    return;
  }

  const outDir = join(process.cwd(), 'data');
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, 'printify-sync-results.json');

  const results: Array<Awaited<ReturnType<typeof syncProductToPrintify>>> = [];
  for (const p of targets) {
    try {
      console.log(`  → ${p.slug}`);
      const r = await syncProductToPrintify(p, shopId);
      results.push(r);
      // throttle: 200 product writes / 30 min = ~9s between requests
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    } catch (err) {
      console.error(`    ✗ ${(err as Error).message}`);
    }
  }

  await writeFile(outPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${results.length} sync result(s) to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
