import Link from 'next/link';
import { Suspense } from 'react';
import { AlternatingGrid } from '@/components/alternating-grid';
import { PRODUCTS } from '@/content/products';
import { CATALOG, type ProductKind } from '@/content/catalog';

const KINDS: ProductKind[] = ['tee', 'tank', 'hoodie', 'mug'];

export const metadata = { title: 'Shop' };

type SearchParams = Promise<{ kind?: string }>;

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const activeKind = (KINDS.includes(params.kind as ProductKind) ? params.kind : 'tee') as ProductKind;
  const filtered = PRODUCTS.filter((p) => p.kind === activeKind);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <header className="mb-10">
        <div className="text-xs tracking-[0.3em] uppercase text-dust mb-3">Catalogue</div>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tighter">
          {filtered.length} {CATALOG[activeKind].hero_label.toLowerCase()}s, one quote each.
        </h1>
        <p className="mt-3 text-ink/70 max-w-xl">
          {CATALOG[activeKind].description}
        </p>
      </header>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-ink/10">
        {KINDS.map((k) => {
          const isActive = k === activeKind;
          return (
            <Link
              key={k}
              href={`/shop?kind=${k}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-ink text-cream'
                  : 'bg-cream-deep/40 text-ink/70 hover:bg-cream-deep'
              }`}
            >
              {CATALOG[k].hero_label}s
              <span className="ml-2 text-xs opacity-60">
                {PRODUCTS.filter((p) => p.kind === k).length}
              </span>
            </Link>
          );
        })}
      </div>

      <Suspense>
        <AlternatingGrid products={filtered} />
      </Suspense>
    </div>
  );
}
