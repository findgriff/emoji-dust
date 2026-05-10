import type { Metadata, Viewport } from 'next';
import { Footer, Nav } from '@/components/site-chrome';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'EMOJI DUST — Wisdom delivered with a wink',
    template: '%s · EMOJI DUST',
  },
  description:
    'Quote-led apparel and homeware. Words from the great minds, set in beautiful typography, printed in the UK and EU. T-shirts, hoodies, vests, and mugs.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emojidust.com'),
  openGraph: {
    title: 'EMOJI DUST — Wisdom delivered with a wink',
    description: 'Quote-led apparel and homeware, printed in the UK and EU.',
    url: '/',
    siteName: 'EMOJI DUST',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

// Critical for mobile: without this, Safari on iPhone renders the page at
// ~980px desktop width and zooms out, which made the product gallery image
// (and everything else) appear as a tiny zoomed-out desktop view.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F8F4EC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
