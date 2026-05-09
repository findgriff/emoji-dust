import Link from 'next/link';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16 md:py-24 prose prose-lg prose-stone">
      <div className="text-xs tracking-[0.3em] uppercase text-dust mb-4 not-prose">The brief</div>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tighter !mb-2 !leading-tight text-ink">
        Wisdom shouldn&apos;t feel like homework.
      </h1>
      <p className="text-xl text-ink/75 !mt-6 !leading-relaxed">
        EMOJI DUST is a small print-on-demand brand for words worth wearing. We
        pair the great quotes — from Stoics to playwrights to the saint who
        wrote the line about the gutter and the stars — with our own everyday
        aphorisms, set them in confident typography, and print them on tees,
        vests, hoodies, and mugs.
      </p>

      <h2 className="font-serif text-2xl mt-14 mb-3 text-ink">What you&apos;re holding</h2>
      <p className="text-ink/75">
        Every design is rendered freshly from code: open-source serif type,
        a single emoji used as the design&apos;s pivot rather than its decoration,
        the EMOJI DUST signature where the &ldquo;by&rdquo; line normally goes,
        and a small caps attribution beneath. Real attribution, every time —
        because a quote without a name is a quote without trust.
      </p>

      <h2 className="font-serif text-2xl mt-12 mb-3 text-ink">Where it&apos;s made</h2>
      <p className="text-ink/75">
        Apparel — tees, vests, hoodies — is direct-to-garment printed by{' '}
        <strong>T Shirt and Sons</strong> in Westbury, England. Mugs are kiln-fired
        and printed by <strong>OPT OnDemand</strong> in Prague. Both are vetted
        Printify partners. We chose UK and EU fulfilment so packages don&apos;t
        cross customs, shipping is sane, and the carbon maths is reasonable.
      </p>

      <h2 className="font-serif text-2xl mt-12 mb-3 text-ink">How buying works</h2>
      <p className="text-ink/75">
        Every product page links out to Printify&apos;s storefront, where you
        pick size and colour, pay, and receive shipping updates directly from
        them. We never see your card details. We never store your address. The
        garment is made-to-order and posted from the country it&apos;s printed in.
      </p>

      <h2 className="font-serif text-2xl mt-12 mb-3 text-ink">A note on the quotes</h2>
      <p className="text-ink/75">
        We only use quotes from figures whose work is in the public domain in
        the United Kingdom — meaning the original author has been dead for at
        least seventy years. That keeps things honest. Where a quote needs a
        translation (Rumi, Lao Tzu) we use translations old enough to themselves
        be in the public domain. EMOJI DUST originals are written in-house and
        signed only by the brand.
      </p>

      <p className="text-ink/75 mt-12 text-sm not-prose">
        — <Link href="/shop" className="underline-offset-4 hover:text-dust">Browse the catalogue</Link>{' '}
        · <Link href="/figures" className="underline-offset-4 hover:text-dust">Browse by figure</Link>
      </p>
    </article>
  );
}
