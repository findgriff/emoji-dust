import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FIGURES, figureBySlug } from '@/content/figures';
import { QUOTES } from '@/content/quotes';
import { PRODUCTS } from '@/content/products';
import { ProductCard } from '@/components/product-card';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return FIGURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const f = figureBySlug(slug);
  return f ? { title: f.name, description: f.bio } : {};
}

export default async function FigurePage({ params }: { params: Params }) {
  const { slug } = await params;
  const figure = figureBySlug(slug);
  if (!figure) notFound();

  const quotesForFigure = QUOTES.filter((q) => q.figure_slug === figure.slug);
  const teesForFigure = quotesForFigure
    .map((q) => PRODUCTS.find((p) => p.quote_id === q.id && p.kind === 'tee')!)
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
      <Link href="/figures" className="text-xs uppercase tracking-widest text-muted hover:text-ink">
        ← All figures
      </Link>

      <header className="mt-6 mb-14 max-w-3xl">
        <div className="text-xs tracking-[0.3em] uppercase text-dust mb-3">{figure.era}</div>
        <h1 className="font-serif text-5xl md:text-6xl tracking-tighter leading-none text-ink">
          {figure.name}
        </h1>
        <div className="text-sm uppercase tracking-widest text-muted mt-4">
          {figure.domains.join(' · ')}
        </div>
        <p className="mt-6 text-lg leading-relaxed text-ink/80">{figure.bio}</p>
        <a
          href={figure.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-xs uppercase tracking-widest text-dust hover:text-ink"
        >
          More on Wikiquote ↗
        </a>
      </header>

      <h2 className="font-serif text-2xl md:text-3xl tracking-tighter mb-8">
        {teesForFigure.length} {teesForFigure.length === 1 ? 'design' : 'designs'} from {figure.name.split(' ')[0]}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
        {teesForFigure.map((p, i) => (
          <ProductCard key={p.slug} product={p} priority={i < 4} />
        ))}
      </div>
    </div>
  );
}
