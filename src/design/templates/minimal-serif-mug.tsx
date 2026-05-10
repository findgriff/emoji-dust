/**
 * Template: minimal-serif-mug
 *
 * Mug-wrap print canvas is 2582×1120, representing the full 360° wrap.
 * From any single camera angle (front/left/right) only the central
 * ~50% of the wrap is visible — content outside that disappears around
 * the cylinder's sides.
 *
 * Safe-zone strategy:
 *   - 28% horizontal padding on each side (content width ≈ 44% of canvas)
 *   - 10% vertical padding
 *   - max content width = 44% of canvas wrap = 1135px
 *   - text auto-shrinks for long quotes so nothing clips
 *
 * This is wide enough to read the quote comfortably from the mug's front
 * and narrow enough that emoji + quote + signature + attribution all stay
 * inside the front-visible window.
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

  // Safe-zone: design content lives in the central 30% of the canvas.
  // From a flat-front camera angle, an 11oz mug shows roughly ±15% of the
  // wrap centred on the front — anything wider than 30% gets clipped by
  // the visible mug face. Empirically tuned from production mockups.
  const SAFE_WIDTH_RATIO = 0.30;
  const safeWidth = width * SAFE_WIDTH_RATIO;

  // Type scale tuned for the narrow safe zone — quotes shrink aggressively
  // for longer lines so nothing overflows into the wrap-around region.
  const charCount = quote.text.length;
  const baseSize =
    charCount < 40 ? safeWidth * 0.16 :
    charCount < 70 ? safeWidth * 0.12 :
    charCount < 110 ? safeWidth * 0.095 :
    charCount < 150 ? safeWidth * 0.078 :
                       safeWidth * 0.064;
  const quoteFontSize = Math.max(baseSize, height * 0.05);

  return (
    <div
      style={{
        width,
        height,
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        fontFamily: 'Fraunces',
      }}
    >
      <div
        style={{
          width: safeWidth,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: height * 0.04,
        }}
      >
        {quote.emoji && (
          <div
            style={{
              fontSize: height * 0.13,
              lineHeight: 1,
              marginBottom: -height * 0.015,
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
            maxWidth: safeWidth,
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
            gap: height * 0.008,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: height * 0.014,
              fontFamily: 'Pacifico',
              fontSize: height * 0.058,
              color: c.text,
            }}
          >
            <span>Emoji</span>
            <span style={{ fontSize: height * 0.072, lineHeight: 1 }}>😉</span>
            <span style={{ color: c.accent }}>Dust</span>
          </div>
          <div
            style={{
              width: safeWidth * 0.28,
              height: height * 0.009,
              background: `linear-gradient(90deg, transparent 0%, ${c.accent} 30%, ${c.accent} 70%, transparent 100%)`,
              borderRadius: 999,
            }}
          />
          {!isAphorism && figure && (
            <div
              style={{
                marginTop: height * 0.012,
                fontFamily: 'Inter',
                fontSize: height * 0.024,
                color: c.muted,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textAlign: 'center',
                maxWidth: safeWidth,
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
