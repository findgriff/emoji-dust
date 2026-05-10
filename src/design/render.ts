/**
 * Renders a quote into a PNG via Satori → Resvg.
 *
 * Used both:
 *  - At dev/build time from scripts/render-designs.ts to pre-render artwork
 *    into public/designs/<quote_id>.png
 *  - At Printify-upload time (later) to send the same PNG to /v1/uploads/images.json
 *
 * Fonts are loaded once per process (cached in module scope).
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MinimalSerifTemplate, type Theme } from './templates/minimal-serif';
import { MinimalSerifMugTemplate } from './templates/minimal-serif-mug';
import { MinimalQuoteTemplate } from './templates/minimal-quote';
import type { Quote } from '@/content/quotes';
import type { Figure } from '@/content/figures';

export type { Theme };

type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type FontEntry = {
  name: string;
  data: ArrayBuffer;
  weight: Weight;
  style: 'normal' | 'italic';
};

let cachedFonts: FontEntry[] | null = null;

async function loadFonts(): Promise<FontEntry[]> {
  if (cachedFonts) return cachedFonts;

  // Fonts come from @fontsource packages — deterministic, OFL-licensed,
  // shipped in .woff format which Satori supports natively.
  const fsRoot = join(process.cwd(), 'node_modules', '@fontsource');
  const files: { path: string; name: string; weight: Weight; style: 'normal' | 'italic' }[] = [
    { path: 'fraunces/files/fraunces-latin-500-normal.woff', name: 'Fraunces', weight: 500, style: 'normal' },
    { path: 'fraunces/files/fraunces-latin-500-italic.woff', name: 'Fraunces', weight: 500, style: 'italic' },
    { path: 'inter/files/inter-latin-400-normal.woff', name: 'Inter', weight: 400, style: 'normal' },
    { path: 'inter/files/inter-latin-500-normal.woff', name: 'Inter', weight: 500, style: 'normal' },
    { path: 'pacifico/files/pacifico-latin-400-normal.woff', name: 'Pacifico', weight: 400, style: 'normal' },
  ];

  const loaded: FontEntry[] = [];
  for (const f of files) {
    try {
      const buf = await readFile(join(fsRoot, f.path));
      loaded.push({
        name: f.name,
        data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
        weight: f.weight,
        style: f.style,
      });
    } catch (err) {
      console.warn(`[render] missing font ${f.path} — install @fontsource packages: pnpm install`);
      throw err;
    }
  }
  cachedFonts = loaded;
  return loaded;
}

export type RenderOptions = {
  quote: Quote;
  figure: Figure | null;
  width: number;
  height: number;
  theme: Theme;
  /** Layout — 'apparel' for tall canvas (tee/tank/hoodie), 'mug' for wide. */
  layout?: 'apparel' | 'mug';
  /** Override background. Defaults to transparent for print files. */
  background?: string;
};

export async function renderDesignToPng(opts: RenderOptions): Promise<Buffer> {
  const fonts = await loadFonts();

  const tree = opts.layout === 'mug'
    ? MinimalSerifMugTemplate({
        quote: opts.quote,
        figure: opts.figure,
        width: opts.width,
        height: opts.height,
        theme: opts.theme,
        background: opts.background,
      })
    : MinimalSerifTemplate({
        quote: opts.quote,
        figure: opts.figure,
        width: opts.width,
        height: opts.height,
        theme: opts.theme,
        background: opts.background,
      });

  const svg = await satori(tree, {
    width: opts.width,
    height: opts.height,
    fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: f.style })),
    loadAdditionalAsset: async (code, segment) => {
      if (code === 'emoji') return await loadTwemoji(segment);
      return segment;
    },
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: opts.width },
    background: opts.background ?? 'rgba(0,0,0,0)',
  });
  return resvg.render().asPng();
}

/** Convert an emoji character to its Twemoji codepoint URL. */
async function loadTwemoji(emojiChar: string): Promise<string> {
  const codepoints = Array.from(emojiChar)
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== 'fe0f') // strip variation selectors
    .join('-');
  const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Twemoji fetch failed for ${emojiChar} (${codepoints})`);
  const text = await res.text();
  return `data:image/svg+xml;base64,${Buffer.from(text).toString('base64')}`;
}

/** Standard canvas sizes per product kind. */
export const CANVAS_SIZE = {
  // 15"×18" front print at 300dpi
  apparel: { width: 4500, height: 5400 },
  // Square preview for storefront cards (cheap to ship to browser)
  preview: { width: 1200, height: 1440 },
  // Mug wrap (separate template handles this — placeholder)
  mug: { width: 2700, height: 1050 },
} as const;

/**
 * Render a "quote-only" editorial graphic — just the quote, no decoration,
 * on a solid background. Used as the alternating tile in the shop grid.
 */
export type EditorialOptions = {
  quote: Quote;
  width: number;
  height: number;
  background: string;
  foreground: string;
};

export async function renderEditorialQuote(opts: EditorialOptions): Promise<Buffer> {
  const fonts = await loadFonts();
  const svg = await satori(MinimalQuoteTemplate(opts), {
    width: opts.width,
    height: opts.height,
    fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: f.style })),
  });
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: opts.width },
    background: opts.background,
  });
  return resvg.render().asPng();
}
