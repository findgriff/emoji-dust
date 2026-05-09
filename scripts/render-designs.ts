/**
 * CLI: render every quote in src/content/quotes.ts as a PNG into public/designs/.
 *
 * Run:    pnpm render:designs
 * Filter: pnpm render:designs aurelius-impediment
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { QUOTES } from '../src/content/quotes';
import { figureBySlug } from '../src/content/figures';
import { renderDesignToPng, CANVAS_SIZE } from '../src/design/render';

async function main() {
  const filter = process.argv[2];
  const targets = filter ? QUOTES.filter((q) => q.id === filter) : QUOTES;

  if (targets.length === 0) {
    console.error(`No quotes match filter "${filter}"`);
    process.exit(1);
  }

  const outDir = join(process.cwd(), 'public', 'designs');
  await mkdir(outDir, { recursive: true });

  // Verify fonts are installed via @fontsource
  const fontFile = join(process.cwd(), 'node_modules', '@fontsource', 'fraunces', 'files', 'fraunces-latin-500-normal.woff');
  if (!existsSync(fontFile)) {
    console.error('Fonts missing. Run: pnpm install');
    process.exit(1);
  }

  console.log(`Rendering ${targets.length} design(s) at ${CANVAS_SIZE.preview.width}×${CANVAS_SIZE.preview.height}…\n`);
  const start = Date.now();

  let success = 0;
  let failed = 0;
  for (const quote of targets) {
    const figure = quote.figure_slug ? figureBySlug(quote.figure_slug) ?? null : null;
    try {
      const png = await renderDesignToPng({
        quote,
        figure,
        ...CANVAS_SIZE.preview,
      });
      const outPath = join(outDir, `${quote.id}.png`);
      await writeFile(outPath, png);
      console.log(`  ✓ ${quote.id.padEnd(28)}  ${(png.length / 1024).toFixed(0)}KB`);
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
