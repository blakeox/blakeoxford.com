// tailwind.config.js
import containerQueries from '@tailwindcss/container-queries';
import typography from '@tailwindcss/typography';

export default /** @type {import('tailwindcss').Config} */ {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,mdx}',
    './tests/**/*.{astro,html,js,jsx,ts,tsx,mdx}',
    './playwright/**/*.{astro,html,js,jsx,ts,tsx,mdx}',
    './public/**/*.{astro,html,js,jsx,ts,tsx,mdx}',
    './*.{astro,html,js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // map your design-token CSS vars into Tailwind colors:
        primary:            'var(--color-primary)',
        'primary-light':    'var(--color-primary-light)',
        'primary-dark':     'var(--color-primary-dark)',

        // 'accent' is a static hex for gradient utilities (e.g., from-accent). If you want dynamic gradients, use a CSS variable and add a custom utility in global.css.
        accent:             '#10b981',
        'accent-light':     '#6ee7b7',
        'accent-dark':      '#047857',

        surface:            'var(--color-surface)',
        'surface-dark':     'var(--color-surface-dark)',

        background:         'var(--color-background)',
        'background-dark':  'var(--color-background-dark)',

        foreground:         'var(--color-foreground)',
        'foreground-light': 'var(--color-foreground-light)',

        neutral:            'var(--color-neutral)',
        'neutral-light':    'var(--color-neutral-light)',
        'neutral-dark':     'var(--color-neutral-dark)',

        // keep any ad-hoc colors you still need:
        customBlue: '#1fb6ff',
      },
      screens: {
        'sm-md': { raw: '(min-width: 651px) and (max-width: 767px)' },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            h2: {
              fontSize: theme('fontSize.6xl'),
              fontWeight: theme('fontWeight.bold'),
              marginTop: '2em',
              marginBottom: '0.5em',
            },
            h3: {
              fontSize: theme('fontSize.4xl'),
              fontWeight: theme('fontWeight.semibold'),
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.300'),
          },
        },
      }),
    },
  },
  plugins: [
    typography,
    containerQueries,
  ],
  safelist: [
    'from-accent',
    'to-accent',
    'from-accent-dark',
    'to-accent-dark',
    'from-accent-light',
    'to-accent-light',
    'from-purple-600',
    'to-purple-600',
    'from-purple-500',
    'to-purple-500',
    'from-blue-500',
    'to-blue-500',
    'from-cyan-400',
    'to-cyan-400',
    'from-pink-500',
    'to-pink-500',
    // add more if you use other gradient stops
  ],
};