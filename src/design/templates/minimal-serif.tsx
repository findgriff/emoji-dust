/**
 * Template: minimal-serif-v1
 *
 * Two themes share this template:
 *   - 'light': dark ink type on transparent background → printed on light shirts (cream, white, natural, etc.)
 *   - 'dark':  cream type on transparent background → printed on dark shirts (black, navy, burgundy, etc.)
 *
 * Background is transparent in both cases so the shirt colour shows through
 * the design's whitespace — no rectangular ink blob on the print.
 *
 * For storefront preview tiles (where we want a visible background), we
 * render onto a coloured background tile separately at the page level.
 *
 * Render targets:
 *  - apparel print: 4500×5400 @ 300dpi
 *  - mug wrap:      2700×1050 (handled by separate template — TODO)
 *  - storefront:    1200×1440 preview (transparent — page wraps in coloured frame)
 */

import * as React from 'react';
import type { Quote } from '@/content/quotes';
import type { Figure } from '@/content/figures';

const COLOURS = {
  light: {
    text: '#1A1817',
    accent: '#C8901F',
    muted: '#7A736C',
    underlineGradient: '#C8901F',
  },
  dark: {
    text: '#F8F4EC',
    accent: '#FFD86B',
    muted: '#C8C0B6',
    underlineGradient: '#FFD86B',
  },
} as const;

export type Theme = 'light' | 'dark';

export type MinimalSerifProps = {
  quote: Quote;
  figure: Figure | null;
  width: number;
  height: number;
  theme: Theme;
  /** Background colour for the rendered tile. 'transparent' for print files. */
  background?: string;
};

export function MinimalSerifTemplate({
  quote,
  figure,
  width,
  height,
  theme,
  background = 'transparent',
}: MinimalSerifProps) {
  const isAphorism = quote.kind === 'aphorism';
  const c = COLOURS[theme];

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
        background,
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
          color: c.text,
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
            color: c.text,
            letterSpacing: '0.01em',
          }}
        >
          <span>Emoji</span>
          <span style={{ fontSize: width * 0.05, lineHeight: 1 }}>😉</span>
          <span style={{ color: c.accent }}>Dust</span>
        </div>

        <div
          style={{
            marginTop: width * 0.008,
            width: width * 0.16,
            height: width * 0.006,
            background: `linear-gradient(90deg, transparent 0%, ${c.underlineGradient} 30%, ${c.underlineGradient} 70%, transparent 100%)`,
            borderRadius: 999,
          }}
        />

        {!isAphorism && figure && (
          <div
            style={{
              marginTop: width * 0.02,
              fontFamily: 'Inter',
              fontSize: width * 0.018,
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
  );
}
