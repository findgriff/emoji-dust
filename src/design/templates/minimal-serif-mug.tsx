/**
 * Template: minimal-serif-mug
 *
 * Mug-wrap variant of minimal-serif. The mug print area is roughly
 * 2582×1120 (2.3:1) — way wider than tall — so we lay everything out
 * horizontally instead of stacking vertically.
 *
 * Composition:
 *   Left:   emoji (if any) + EMOJI DUST signature stacked
 *   Centre: the quote, set in a tighter line-length
 *   Right:  attribution caption (for attributed quotes)
 *
 * Light theme prints on white mugs (default for ORCA), dark theme exists
 * for future expansion if Printify ever offers dye-sub black mugs we can
 * use. Background is transparent for DTG/dye-sub print files.
 */

import * as React from 'react';
import type { Quote } from '@/content/quotes';
import type { Figure } from '@/content/figures';

const COLOURS = {
  light: { text: '#1A1817', accent: '#C8901F', muted: '#7A736C' },
  dark: { text: '#F8F4EC', accent: '#FFD86B', muted: '#C8C0B6' },
} as const;

export type Theme = 'light' | 'dark';

export type MinimalSerifMugProps = {
  quote: Quote;
  figure: Figure | null;
  width: number;
  height: number;
  theme: Theme;
  background?: string;
};

export function MinimalSerifMugTemplate({
  quote,
  figure,
  width,
  height,
  theme,
  background = 'transparent',
}: MinimalSerifMugProps) {
  const isAphorism = quote.kind === 'aphorism';
  const c = COLOURS[theme];

  const charCount = quote.text.length;
  const baseSize = height * 0.18;
  const scale = charCount < 50 ? 1 : charCount < 90 ? 0.85 : charCount < 130 ? 0.72 : 0.62;
  const quoteFontSize = Math.max(baseSize * scale, height * 0.08);

  return (
    <div
      style={{
        width,
        height,
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${height * 0.1}px ${width * 0.05}px`,
        fontFamily: 'Fraunces',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: height * 0.06,
        }}
      >
        {quote.emoji && (
          <div style={{ fontSize: height * 0.22, lineHeight: 1, marginBottom: -height * 0.04 }}>
            {quote.emoji}
          </div>
        )}

        <div
          style={{
            fontSize: quoteFontSize,
            color: c.text,
            textAlign: 'center',
            lineHeight: 1.15,
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: height * 0.012,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: height * 0.022,
              fontFamily: 'Pacifico',
              fontSize: height * 0.08,
              color: c.text,
            }}
          >
            <span>Emoji</span>
            <span style={{ fontSize: height * 0.1, lineHeight: 1 }}>😉</span>
            <span style={{ color: c.accent }}>Dust</span>
          </div>
          <div
            style={{
              width: height * 0.32,
              height: height * 0.012,
              background: `linear-gradient(90deg, transparent 0%, ${c.accent} 30%, ${c.accent} 70%, transparent 100%)`,
              borderRadius: 999,
            }}
          />
          {!isAphorism && figure && (
            <div
              style={{
                marginTop: height * 0.02,
                fontFamily: 'Inter',
                fontSize: height * 0.034,
                color: c.muted,
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
    </div>
  );
}
