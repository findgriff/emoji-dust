'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Product } from '@/content/catalog';
import { CATALOG } from '@/content/catalog';

type Mode = 'light' | 'dark';

export function ProductGallery({ product }: { product: Product }) {
  const meta = CATALOG[product.kind];
  const [mode, setMode] = useState<Mode>('light');
  const [angle, setAngle] = useState<'design' | 'mockup'>('design');

  const designSrc = mode === 'light' ? product.artwork_light_preview : product.artwork_dark_preview;
  const mockupGroup = product.mockups?.[mode];
  const mockupSrc = mockupGroup?.[0]?.url;
  const showingMockup = angle === 'mockup' && mockupSrc;
  const currentSrc = showingMockup ? mockupSrc : designSrc;

  return (
    <div className="lg:sticky lg:top-24">
      <div className={`relative aspect-[5/6] rounded-2xl overflow-hidden border border-ink/5 ${mode === 'dark' ? 'bg-ink' : 'bg-cream-deep/60'}`}>
        <Image
          src={currentSrc}
          alt={product.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 600px"
        />
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-cream/90 text-[11px] font-medium tracking-widest uppercase text-ink/70 border border-ink/5">
          {showingMockup ? 'Mockup' : 'Design preview'}
        </div>
      </div>

      {/* mode switch — light vs dark stock */}
      {meta.supports_dark && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setMode('light')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'light' ? 'bg-ink text-cream' : 'bg-cream-deep/60 hover:bg-cream-deep text-ink/70'
            }`}
          >
            <span className="w-3 h-3 rounded-full border border-ink/20 bg-cream" />
            On light stock
          </button>
          <button
            onClick={() => setMode('dark')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'dark' ? 'bg-ink text-cream' : 'bg-cream-deep/60 hover:bg-cream-deep text-ink/70'
            }`}
          >
            <span className="w-3 h-3 rounded-full border border-cream/40 bg-ink" />
            On dark stock
          </button>
        </div>
      )}

      {/* angle switch — design preview vs real mockup (when available) */}
      {mockupGroup && mockupGroup.length > 0 && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setAngle('design')}
            className={`px-3 py-1 rounded-full text-xs ${angle === 'design' ? 'bg-dust/20 text-ink' : 'text-muted hover:text-ink'}`}
          >
            Design
          </button>
          <button
            onClick={() => setAngle('mockup')}
            className={`px-3 py-1 rounded-full text-xs ${angle === 'mockup' ? 'bg-dust/20 text-ink' : 'text-muted hover:text-ink'}`}
          >
            On a model
          </button>
        </div>
      )}

      {/* mockup thumbnail rail (front, back, lifestyle) */}
      {mockupGroup && mockupGroup.length > 1 && angle === 'mockup' && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {mockupGroup.map((m, i) => (
            <div key={i} className="relative w-16 h-20 rounded-md overflow-hidden border border-ink/10 shrink-0">
              <Image src={m.url} alt={m.position} fill sizes="64px" className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
