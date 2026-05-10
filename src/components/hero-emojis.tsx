/**
 * Floating-emoji decoration for the landing-page hero.
 *
 * Server-rendered (no client JS). The swarm is a fixed set of emoji with
 * pre-baked CSS animations — different keyframes, durations and delays so
 * the motion never falls into a visible loop. Honours
 * `prefers-reduced-motion` via globals.css.
 */

import * as React from 'react';

type Emoji = {
  char: string;
  /** % of hero width (left). */
  left: number;
  /** % of hero height (top). */
  top: number;
  size: number;
  animation:
    | 'hero-float-up'
    | 'hero-drift-left'
    | 'hero-drift-right'
    | 'hero-spin-pulse'
    | 'hero-wiggle';
  /** seconds */
  duration: number;
  /** seconds */
  delay: number;
};

const EMOJIS: Emoji[] = [
  // Floating-up bubbles (the dust trail)
  { char: '✨', left: 8,  top: 80, size: 28, animation: 'hero-float-up',  duration: 14, delay: 0   },
  { char: '💫', left: 22, top: 90, size: 22, animation: 'hero-float-up',  duration: 17, delay: 3   },
  { char: '⭐️', left: 36, top: 88, size: 24, animation: 'hero-float-up',  duration: 19, delay: 7   },
  { char: '✨', left: 70, top: 86, size: 20, animation: 'hero-float-up',  duration: 16, delay: 11  },
  { char: '🌟', left: 88, top: 92, size: 26, animation: 'hero-float-up',  duration: 21, delay: 5   },

  // Cluster around the hero copy (left side)
  { char: '😉', left: 42, top: 18, size: 36, animation: 'hero-wiggle',     duration: 4,  delay: 0   },
  { char: '🤍', left: 6,  top: 58, size: 28, animation: 'hero-drift-left',  duration: 7,  delay: 0.6 },
  { char: '🌙', left: 12, top: 28, size: 30, animation: 'hero-drift-right', duration: 9,  delay: 1.4 },

  // Cluster around the design tile (right side)
  { char: '🌞', left: 62, top: 8,  size: 34, animation: 'hero-spin-pulse',  duration: 6,  delay: 0   },
  { char: '☕️', left: 92, top: 38, size: 32, animation: 'hero-drift-left',  duration: 8,  delay: 2   },
  { char: '🪐', left: 96, top: 68, size: 28, animation: 'hero-drift-right', duration: 10, delay: 0.5 },
  { char: '💭', left: 56, top: 70, size: 26, animation: 'hero-wiggle',     duration: 5,  delay: 1.2 },
];

export function HeroEmojis() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {EMOJIS.map((e, i) => (
        <span
          key={i}
          className="hero-emoji"
          style={{
            left: `${e.left}%`,
            top: `${e.top}%`,
            fontSize: `${e.size}px`,
            lineHeight: 1,
            animation: `${e.animation} ${e.duration}s ease-in-out ${e.delay}s infinite`,
          }}
        >
          {e.char}
        </span>
      ))}
    </div>
  );
}
