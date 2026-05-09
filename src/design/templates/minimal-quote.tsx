/**
 * Template: minimal-quote
 *
 * Stripped-back composition: just the quote text. No emoji. No EMOJI DUST
 * signature. No attribution. Pure typography.
 *
 * Used for the "editorial" alternating tile in the shop grid — pairs with
 * the model/lifestyle mockup tiles to create visual rhythm. Also surfaces
 * on the product detail page as a third image variant alongside the model
 * shot and the regular design preview.
 *
 * The render is intentionally austere — it lets the quote breathe and
 * makes the playful EMOJI DUST design treatment feel like a deliberate
 * choice, not a default.
 */

import * as React from 'react';
import type { Quote } from '@/content/quotes';

export type MinimalQuoteProps = {
  quote: Quote;
  width: number;
  height: number;
  background: string;
  foreground: string;
};

export function MinimalQuoteTemplate({ quote, width, height, background, foreground }: MinimalQuoteProps) {
  const charCount = quote.text.length;
  const baseSize = width * 0.078;
  const scale = charCount < 60 ? 1 : charCount < 100 ? 0.86 : charCount < 140 ? 0.74 : 0.64;
  const fontSize = Math.max(baseSize * scale, width * 0.04);

  // Wrap quote in display quotes for editorial feel
  return (
    <div
      style={{
        width,
        height,
        background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: width * 0.12,
        fontFamily: 'Fraunces',
      }}
    >
      <div
        style={{
          fontSize: fontSize * 1.6,
          color: foreground,
          opacity: 0.35,
          lineHeight: 0.8,
          fontWeight: 500,
          marginBottom: -fontSize * 0.4,
        }}
      >
        “
      </div>
      <div
        style={{
          fontSize,
          color: foreground,
          textAlign: 'center',
          lineHeight: 1.22,
          letterSpacing: '-0.02em',
          fontWeight: 500,
          maxWidth: width * 0.78,
          fontStyle: quote.kind === 'aphorism' ? 'italic' : 'normal',
        }}
      >
        {quote.text}
      </div>
    </div>
  );
}
