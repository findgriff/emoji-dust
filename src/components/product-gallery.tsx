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

/** Flatten categorized mockups into an ordered list. on_model first. */
function flatten(group: Record<Category, string[]>): { url: string; category: Category }[] {
  const out: { url: string; category: Category }[] = [];
  for (const cat of CATEGORY_ORDER) {
    for (const url of group[cat] ?? []) {
      out.push({ url, category: cat });
    }
  }
  return out;
}

export function ProductGallery({ product }: { product: Product }) {
  const meta = CATALOG[product.kind];
  const [mode, setMode] = useState<Mode>('light');
  const [activeIdx, setActiveIdx] = useState(0);

  const designSrc = mode === 'light' ? product.artwork_light_preview : product.artwork_dark_preview;
  const themeMockups = product.mockups?.[mode];
  const flat = useMemo(
    () => (themeMockups ? flatten(themeMockups) : []),
    [themeMockups]
  );

  // Reset active index when mode changes
  const safeIdx = activeIdx < flat.length ? activeIdx : 0;
  const showingMockup = flat.length > 0 && activeIdx < flat.length;
  const currentSrc = showingMockup ? flat[safeIdx].url : designSrc;
  const currentLabel = showingMockup ? CATEGORY_LABEL[flat[safeIdx].category] : 'Design preview';

  const switchMode = (m: Mode) => {
    setMode(m);
    setActiveIdx(0);
  };

  return (
    <div className="lg:sticky lg:top-24">
      {/* main image */}
      <div className={`relative aspect-[5/6] rounded-2xl overflow-hidden border border-ink/5 ${mode === 'dark' ? 'bg-ink' : 'bg-cream-deep/60'}`}>
        <Image
          src={currentSrc}
          alt={product.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 600px"
        />
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-cream/95 text-[11px] font-medium tracking-widest uppercase text-ink/70 border border-ink/5">
          {currentLabel}
        </div>
        {flat.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-cream/80 backdrop-blur">
            <button
              onClick={() => setActiveIdx(-1)}
              className={`w-1.5 h-1.5 rounded-full transition ${!showingMockup ? 'bg-ink w-4' : 'bg-ink/30'}`}
              aria-label="Show design preview"
            />
            {flat.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition ${showingMockup && safeIdx === i ? 'bg-ink w-4' : 'bg-ink/30'}`}
                aria-label={`View ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* thumbnail rail */}
      {flat.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveIdx(-1)}
            className={`relative w-16 h-20 rounded-md overflow-hidden border-2 shrink-0 ${
              !showingMockup ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'
            } ${mode === 'dark' ? 'bg-ink' : 'bg-cream-deep/60'}`}
            aria-label="Design preview"
          >
            <Image src={designSrc} alt="" fill sizes="64px" className="object-cover" />
          </button>
          {flat.map((m, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`relative w-16 h-20 rounded-md overflow-hidden border-2 shrink-0 ${
                showingMockup && safeIdx === i ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              aria-label={`Thumbnail ${i + 1} ${CATEGORY_LABEL[m.category]}`}
            >
              <Image src={m.url} alt="" fill sizes="64px" className="object-cover" />
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
