/**
 * Template: minimal-serif-v1
 *
 * Composition:
 *   - Quote in serif, centred, generous whitespace
 *   - Optional emoji as a single visual pivot, sized as a counter-anchor to the type
 *   - EMOJI DUST signature beneath
 *   - Real attribution caption below signature (only for kind='attributed')
 *
 * Render target: 4500×5400px @ 300dpi for tee/tank/hoodie front print area.
 *                Mug uses a 2700×1050 wrap canvas via a separate template.
 *
 * This file returns a JSX tree that Satori knows how to convert to SVG.
 * No client-side React — pure render-time tree.
 */

import * as React from 'react';
import type { Quote } from '@/content/quotes';
import type { Figure } from '@/content/figures';

const INK = '#1A1817';
const CREAM = '#F8F4EC';
const GOLD = '#C8901F';
const MUTED = '#7A736C';

export type MinimalSerifProps = {
  quote: Quote;
  figure: Figure | null;
  width: number;
  height: number;
};

export function MinimalSerifTemplate({ quote, figure, width, height }: MinimalSerifProps) {
  const isAphorism = quote.kind === 'aphorism';

  // Type scale: longer quotes need smaller text, but we never go below a floor.
  const charCount = quote.text.length;
  const baseSize = width * 0.072;
  const scale =
    charCount < 60 ? 1 : charCount < 100 ? 0.85 : charCount < 140 ? 0.72 : 0.62;
  const quoteFontSize = Math.max(baseSize * scale, width * 0.04);

  return (
    <div
      style={{
        width,
        height,
        background: CREAM,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: width * 0.1,
        fontFamily: 'Fraunces',
      }}
    >
      {quote.emoji && (
        <div
          style={{
            fontSize: width * 0.13,
            marginBottom: width * 0.04,
            lineHeight: 1,
          }}
        >
          {quote.emoji}
        </div>
      )}

      <div
        style={{
          fontSize: quoteFontSize,
          color: INK,
          textAlign: 'center',
          lineHeight: 1.18,
          letterSpacing: '-0.02em',
          fontWeight: 500,
          maxWidth: width * 0.78,
          fontStyle: isAphorism ? 'italic' : 'normal',
        }}
      >
        {quote.text}
      </div>

      <div
        style={{
          marginTop: width * 0.08,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: width * 0.012,
            fontFamily: 'Pacifico',
            fontSize: width * 0.038,
            color: INK,
            letterSpacing: '0.01em',
          }}
        >
          <span>Emoji</span>
          <span style={{ fontSize: width * 0.05, lineHeight: 1 }}>😉</span>
          <span style={{ color: GOLD }}>Dust</span>
        </div>

        {/* gold dust trail underline */}
        <div
          style={{
            marginTop: width * 0.008,
            width: width * 0.16,
            height: width * 0.006,
            background: `linear-gradient(90deg, transparent 0%, ${GOLD} 30%, ${GOLD} 70%, transparent 100%)`,
            borderRadius: 999,
          }}
        />

        {!isAphorism && figure && (
          <div
            style={{
              marginTop: width * 0.02,
              fontFamily: 'Inter',
              fontSize: width * 0.018,
              color: MUTED,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {figure.name + (quote.source_work ? `  ·  ${quote.source_work}` : '')}
          </div>
        )}
      </div>
    </div>
  );
}
