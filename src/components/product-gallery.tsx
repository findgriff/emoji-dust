'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import type { Product } from '@/content/catalog';
import { CATALOG } from '@/content/catalog';

type Mode = 'light' | 'dark';
type Category = 'on_model' | 'flat_front' | 'flat_back' | 'detail';

const CATEGORY_ORDER: Category[] = ['on_model', 'flat_front', 'flat_back', 'detail'];
const CATEGORY_LABEL: Record<Category, string> = {
  on_model: 'On a model',
  flat_front: 'Front',
  flat_back: 'Back',
  detail: 'Detail',
};

type GalleryItem =
  | { kind: 'mockup'; url: string; label: string; bg: 'light' | 'dark' }
  | { kind: 'design_preview'; url: string; label: string; bg: 'light' | 'dark' }
  | { kind: 'editorial'; url: string; label: string; bg: 'light' | 'dark' };

/**
 * Build the full image rail for a product.
 * Per the brief: regardless of which tile the customer clicked, the detail
 * page must show all three contexts:
 *   1. The product on a model / lifestyle mockup
 *   2. The pure design preview
 *   3. The editorial "quote only" treatment on black
 */
function buildItems(product: Product, mode: Mode): GalleryItem[] {
  const items: GalleryItem[] = [];
  const mockups = product.mockups?.[mode];

  // 1. mockups in priority order (model first, then front, back, detail)
  if (mockups) {
    for (const cat of CATEGORY_ORDER) {
      for (const url of mockups[cat] ?? []) {
        items.push({ kind: 'mockup', url, label: CATEGORY_LABEL[cat], bg: mode });
      }
    }
  }

  // 2. design preview (the pure rendered design on a coloured tile)
  items.push({
    kind: 'design_preview',
    url: mode === 'light' ? product.artwork_light_preview : product.artwork_dark_preview,
    label: 'Design',
    bg: mode,
  });

  // 3. editorial black-tile treatment — quote only, austere
  items.push({
    kind: 'editorial',
    url: product.editorial_image,
    label: 'Quote only',
    bg: 'dark',
  });

  return items;
}

export function ProductGallery({ product }: { product: Product }) {
  const meta = CATALOG[product.kind];
  const [mode, setMode] = useState<Mode>('light');
  const [activeIdx, setActiveIdx] = useState(0);

  const items = useMemo(() => buildItems(product, mode), [product, mode]);
  const safeIdx = activeIdx < items.length ? activeIdx : 0;
  const current = items[safeIdx];

  const switchMode = (m: Mode) => {
    setMode(m);
    setActiveIdx(0);
  };

  return (
    <div className="lg:sticky lg:top-24">
      {/* main image */}
      <div
        className={`relative aspect-[5/6] rounded-2xl overflow-hidden border border-ink/5 ${
          current?.bg === 'dark' ? 'bg-ink' : 'bg-cream-deep/60'
        }`}
      >
        <Image
          src={current.url}
          alt={product.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 600px"
        />
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-cream/95 text-[11px] font-medium tracking-widest uppercase text-ink/70 border border-ink/5">
          {current.label}
        </div>
        {items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-cream/80 backdrop-blur">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`h-1.5 rounded-full transition-all ${safeIdx === i ? 'bg-ink w-4' : 'bg-ink/30 w-1.5'}`}
                aria-label={`View ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* thumbnail rail */}
      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`relative w-16 h-20 rounded-md overflow-hidden border-2 shrink-0 transition ${
                safeIdx === i ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'
              } ${it.bg === 'dark' ? 'bg-ink' : 'bg-cream-deep/60'}`}
              aria-label={`Thumbnail ${i + 1}: ${it.label}`}
              title={it.label}
            >
              <Image src={it.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* mode switch */}
      {meta.supports_dark && (
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="text-xs uppercase tracking-widest text-muted py-1.5 mr-1">Stock:</span>
          <button
            onClick={() => switchMode('light')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'light' ? 'bg-ink text-cream' : 'bg-cream-deep/60 hover:bg-cream-deep text-ink/70'
            }`}
          >
            <span className="w-3 h-3 rounded-full border border-ink/20 bg-cream" />
            Light stock
          </button>
          <button
            onClick={() => switchMode('dark')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'dark' ? 'bg-ink text-cream' : 'bg-cream-deep/60 hover:bg-cream-deep text-ink/70'
            }`}
          >
            <span className="w-3 h-3 rounded-full border border-cream/40 bg-ink" />
            Dark stock
          </button>
        </div>
      )}
    </div>
  );
}
