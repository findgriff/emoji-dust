import Link from 'next/link';
import { FIGURES } from '@/content/figures';
import { QUOTES } from '@/content/quotes';

export const metadata = { title: 'Figures' };

export default function FiguresIndex() {
  const aphorismCount = QUOTES.filter((q) => q.kind === 'aphorism').length;
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
      <div className="text-xs tracking-[0.3em] uppercase text-dust mb-3">Voices</div>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tighter mb-3">
        The minds we keep company with.
      </h1>
      <p className="text-ink/70 max-w-2xl mb-12">
        Every quote here is in the public domain — picked for warmth as much as
        weight. Plus {aphorismCount} EMOJI DUST originals, written in-house.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
        {FIGURES.map((f) => {
          const count = QUOTES.filter((q) => q.figure_slug === f.slug).length;
          return (
            <Link key={f.slug} href={`/figures/${f.slug}`} className="lift block group">
              <div className="font-serif text-2xl text-ink group-hover:text-dust transition-colors leading-tight">
                {f.name}
              </div>
              <div className="text-xs uppercase tracking-widest text-muted mt-1">
                {f.era} · {count} quote{count === 1 ? '' : 's'}
              </div>
              <div className="text-sm text-ink/70 mt-2 leading-relaxed line-clamp-2">
                {f.bio}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
