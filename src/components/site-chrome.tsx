import Link from 'next/link';

export function Nav() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-cream/85 border-b border-ink/5">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-1.5 group">
          <span className="font-script text-2xl text-ink leading-none">Emoji</span>
          <span className="text-xl leading-none">😉</span>
          <span className="font-script text-2xl text-dust leading-none">Dust</span>
        </Link>
        <nav className="flex items-center gap-7 text-sm font-medium tracking-wide">
          <Link href="/shop" className="hover:text-dust transition-colors">Shop</Link>
          <Link href="/figures" className="hover:text-dust transition-colors">Figures</Link>
          <Link href="/about" className="hover:text-dust transition-colors">About</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-32 border-t border-ink/10 bg-cream-deep/40">
      <div className="mx-auto max-w-6xl px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10 text-sm text-muted">
        <div className="md:col-span-2">
          <div className="flex items-baseline gap-1.5 mb-4">
            <span className="font-script text-2xl text-ink leading-none">Emoji</span>
            <span className="text-xl leading-none">😉</span>
            <span className="font-script text-2xl text-dust leading-none">Dust</span>
          </div>
          <p className="max-w-md leading-relaxed">
            Wisdom delivered with a wink. Quote-led apparel and homeware,
            printed in the UK and EU. Made today, slightly better, on purpose.
          </p>
        </div>
        <div>
          <div className="font-medium text-ink mb-3 tracking-wide">Shop</div>
          <ul className="space-y-2">
            <li><Link href="/shop?kind=tee" className="hover:text-ink">T-shirts</Link></li>
            <li><Link href="/shop?kind=tank" className="hover:text-ink">Vests</Link></li>
            <li><Link href="/shop?kind=hoodie" className="hover:text-ink">Hoodies</Link></li>
            <li><Link href="/shop?kind=mug" className="hover:text-ink">Mugs</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-ink mb-3 tracking-wide">Brand</div>
          <ul className="space-y-2">
            <li><Link href="/figures" className="hover:text-ink">Figures</Link></li>
            <li><Link href="/about" className="hover:text-ink">About</Link></li>
            <li><span className="opacity-60">Press</span></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-10 flex flex-col sm:flex-row justify-between text-xs text-muted/70 gap-2">
        <span>© {new Date().getFullYear()} EMOJI DUST · Printed via Printify in the UK + EU</span>
        <span>Emoji art by <a href="https://twemoji.twitter.com" className="hover:text-ink underline-offset-2 hover:underline">Twemoji</a> (CC-BY 4.0)</span>
      </div>
    </footer>
  );
}
