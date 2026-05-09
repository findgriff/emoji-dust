/**
 * CLI: render every quote in src/content/quotes.ts as PNGs into public/designs/.
 *
 * Per quote, three PNGs are produced:
 *   <quote_id>-light.png    transparent bg, dark ink → printed on light shirts
 *   <quote_id>-dark.png     transparent bg, cream type → printed on dark shirts
 *   <quote_id>-preview-light.png   cream backdrop, for storefront tile (light shirt)
 *   <quote_id>-preview-dark.png    ink backdrop, for storefront tile (dark shirt)
 *
 * Run:    pnpm render:designs
 * Filter: pnpm render:designs aurelius-impediment
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { QUOTES } from '../src/content/quotes';
import { figureBySlug } from '../src/content/figures';
import { renderDesignToPng, renderEditorialQuote } from '../src/design/render';

const PRINT_SIZE = { width: 4500, height: 5400 } as const;
const PREVIEW_SIZE = { width: 1200, height: 1440 } as const;
const EDITORIAL_SIZE = { width: 1200, height: 1440 } as const;

const PREVIEW_BG = {
  light: '#F8F4EC', // cream
  dark: '#1A1817',  // ink
} as const;

async function renderOne(quote_id: string, opts: {
  outDir: string;
  print: boolean;
  preview: boolean;
  editorial: boolean;
}) {
  const quote = QUOTES.find((q) => q.id === quote_id);
  if (!quote) throw new Error(`unknown quote: ${quote_id}`);
  const figure = quote.figure_slug ? figureBySlug(quote.figure_slug) ?? null : null;

  const renders: { name: string; size: { width: number; height: number }; theme: 'light' | 'dark'; bg: string }[] = [];

  if (opts.print) {
    renders.push({ name: `${quote_id}-light.png`, size: PRINT_SIZE, theme: 'light', bg: 'transparent' });
    renders.push({ name: `${quote_id}-dark.png`,  size: PRINT_SIZE, theme: 'dark',  bg: 'transparent' });
  }
  if (opts.preview) {
    renders.push({ name: `${quote_id}-preview-light.png`, size: PREVIEW_SIZE, theme: 'light', bg: PREVIEW_BG.light });
    renders.push({ name: `${quote_id}-preview-dark.png`,  size: PREVIEW_SIZE, theme: 'dark',  bg: PREVIEW_BG.dark });
  }

  const bytes: number[] = [];
  for (const r of renders) {
    const png = await renderDesignToPng({
      quote,
      figure,
      width: r.size.width,
      height: r.size.height,
      theme: r.theme,
      background: r.bg,
    });
    await writeFile(join(opts.outDir, r.name), png);
    bytes.push(png.length);
  }

  if (opts.editorial) {
    const png = await renderEditorialQuote({
      quote,
      width: EDITORIAL_SIZE.width,
      height: EDITORIAL_SIZE.height,
      background: '#0E0D0C', // deeper than ink — reads as black on the grid
      foreground: '#F8F4EC',
    });
    await writeFile(join(opts.outDir, `${quote_id}-editorial-black.png`), png);
    bytes.push(png.length);
  }

  return bytes;
}

async function main() {
  const args = process.argv.slice(2);
  const filter = args.find((a) => !a.startsWith('--'));
  const skipPrint = args.includes('--no-print');
  const skipPreview = args.includes('--no-preview');
  const skipEditorial = args.includes('--no-editorial');

  const targets = filter ? QUOTES.filter((q) => q.id === filter) : QUOTES;
  if (targets.length === 0) {
    console.error(`No quotes match filter "${filter}"`);
    process.exit(1);
  }

  const outDir = join(process.cwd(), 'public', 'designs');
  await mkdir(outDir, { recursive: true });

  const fontFile = join(process.cwd(), 'node_modules', '@fontsource', 'fraunces', 'files', 'fraunces-latin-500-normal.woff');
  if (!existsSync(fontFile)) {
    console.error('Fonts missing. Run: pnpm install');
    process.exit(1);
  }

  const variants = (skipPrint ? 0 : 2) + (skipPreview ? 0 : 2) + (skipEditorial ? 0 : 1);
  console.log(`Rendering ${targets.length} quote(s) × ${variants} variant(s) = ${targets.length * variants} PNG(s)…\n`);
  const start = Date.now();

  let success = 0;
  let failed = 0;
  for (const quote of targets) {
    try {
      const bytes = await renderOne(quote.id, {
        outDir,
        print: !skipPrint,
        preview: !skipPreview,
        editorial: !skipEditorial,
      });
      const totalKb = (bytes.reduce((a, b) => a + b, 0) / 1024).toFixed(0);
      console.log(`  ✓ ${quote.id.padEnd(28)}  ${variants} variant(s)  ${totalKb}KB total`);
      success++;
    } catch (err) {
      console.error(`  ✗ ${quote.id} — ${(err as Error).message}`);
      failed++;
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s — ${success} ok, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
