import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * Tailwind v4 — design tokens and motion live in src/styles/theme.css.
 * Container queries are built into Tailwind v4 (`@container`, `@md:`, …).
 * This file only keeps plugins and container padding that still need JS config.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT:
          'clamp(var(--container-padding, 1rem), 4vw, var(--container-padding-lg, 4rem))',
        sm: 'clamp(var(--container-padding-sm, 2rem), 5vw, var(--container-padding-lg, 4rem))',
        lg: 'clamp(var(--container-padding-lg, 4rem), 6vw, var(--container-padding-xl, 5rem))',
        xl: 'clamp(var(--container-padding-xl, 5rem), 7vw, var(--container-padding-2xl, 6rem))',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
    extend: {
      screens: {
        'sm-md': { raw: '(min-width: 651px) and (max-width: 767px)' },
        'supports-backdrop': { raw: '(backdrop-filter: blur(0))' },
      },
      maxWidth: {
        'container-2xl': 'var(--layout-max-2xl)',
      },
      data: {
        open: 'state=open',
        closed: 'state=closed',
      },
      typography: ({ theme }: { theme: (path: string, fallback?: unknown) => unknown }) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            a: {
              color: theme('colors.accent', 'var(--color-accent)'),
              textDecoration: 'underline',
              '&:hover': {
                color: theme('colors["accent-emphasis"]', 'var(--color-accent-emphasis)'),
              },
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};

export default config;
