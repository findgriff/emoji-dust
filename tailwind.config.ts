import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1A1817',
        cream: '#F8F4EC',
        'cream-deep': '#F0E9D9',
        dust: '#E8B23E',
        sparkle: '#FFD86B',
        plum: '#3A1E32',
        muted: '#7A736C',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'ui-serif', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        script: ['var(--font-pacifico)', 'Pacifico', 'cursive'],
      },
      maxWidth: {
        prose: '64ch',
      },
      letterSpacing: {
        tighter: '-0.04em',
      },
    },
  },
  plugins: [],
};

export default config;
