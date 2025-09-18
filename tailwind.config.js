// tailwind.config.js
import containerQueries from '@tailwindcss/container-queries';
import typography from '@tailwindcss/typography';

export default /** @type {import('tailwindcss').Config} */ {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // map your design-token CSS vars into Tailwind colors:
        primary:            'var(--color-primary)',
        'primary-light':    'var(--color-primary-light)',
        'primary-dark':     'var(--color-primary-dark)',

        // Accent palette now sourced from CSS variables (updated for WCAG contrast)
        // Use semantic tokens defined in theme.css: --color-accent, --color-accent-light, --color-accent-dark
        accent:              'var(--color-accent)',
        'accent-light':      'var(--color-accent-light)',
        'accent-dark':       'var(--color-accent-dark)',

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
  // Removed customBlue (unused & failed dark contrast) to satisfy contrast audit.
        tertiary:           'var(--color-tertiary)',
        'tertiary-light':   'var(--color-tertiary-light)',
        'tertiary-dark':    'var(--color-tertiary-dark)',
        success:            'var(--color-success)',
        'success-light':    'var(--color-success-light)',
        'success-dark':     'var(--color-success-dark)',
        warning:            'var(--color-warning)',
        'warning-light':    'var(--color-warning-light)',
        'warning-dark':     'var(--color-warning-dark)',
        error:              'var(--color-error)',
        'error-light':      'var(--color-error-light)',
        'error-dark':       'var(--color-error-dark)',
        info:               'var(--color-info)',
        'info-light':       'var(--color-info-light)',
        'info-dark':        'var(--color-info-dark)',

        // Gradients (for use with bg-gradient-to-*)
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-accent':  'var(--gradient-accent)',

        // Utility colors
        'backdrop':         'var(--color-backdrop)',
        'backdrop-light':   'var(--color-backdrop-light)',
      },
      screens: {
        'sm-md': { raw: '(min-width: 651px) and (max-width: 767px)' },
      },
      spacing: {
        18: 'var(--space-18)',
        22: 'var(--space-22)',
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      fontSize: {
        xs: 'var(--fs-xs)',
        sm: 'var(--fs-sm)',
        base: 'var(--fs-base)',
        lg: 'var(--fs-lg)',
        xl: 'var(--fs-xl)',
        '2xl': 'var(--fs-2xl)',
        '3xl': 'var(--fs-3xl)',
        '4xl': 'var(--fs-4xl)',
        '5xl': 'var(--fs-5xl)',
        '6xl': 'var(--fs-6xl)',
        '7xl': 'var(--fs-7xl)',
        '8xl': 'var(--fs-8xl)',
        '9xl': 'var(--fs-9xl)',
        // Semantic font size tokens
        h1: 'var(--fs-h1)',
        h2: 'var(--fs-h2)',
        h3: 'var(--fs-h3)',
        h4: 'var(--fs-h4)',
        h5: 'var(--fs-h5)',
        h6: 'var(--fs-h6)',
        ui: 'var(--fs-ui)',
      },
      fontWeight: {
        thin: 'var(--fw-thin)',
        extralight: 'var(--fw-extralight)',
        light: 'var(--fw-light)',
        normal: 'var(--fw-normal)',
        medium: 'var(--fw-medium)',
        semibold: 'var(--fw-semibold)',
        bold: 'var(--fw-bold)',
        extrabold: 'var(--fw-extrabold)',
        black: 'var(--fw-black)',
      },
      letterSpacing: {
        tighter: 'var(--ls-tighter)',
        tight: 'var(--ls-tight)',
        normal: 'var(--ls-normal)',
        wide: 'var(--ls-wide)',
        wider: 'var(--ls-wider)',
        widest: 'var(--ls-widest)',
        // Semantic letter spacing tokens
        heading: 'var(--ls-heading)',
        body: 'var(--ls-body)',
      },
      lineHeight: {
        none: 'var(--lh-none)',
        tight: 'var(--lh-tight)',
        snug: 'var(--lh-snug)',
        normal: 'var(--lh-normal)',
        relaxed: 'var(--lh-relaxed)',
        loose: 'var(--lh-loose)',
        // Semantic line height tokens
        heading: 'var(--lh-heading)',
        body: 'var(--lh-body)',
      },
      maxWidth: {
        // Add missing container max-widths from theme.css
        'container-sm': 'var(--container-sm)',
        'container-md': 'var(--container-md)',
        'container-lg': 'var(--container-lg)',
        'container-xl': 'var(--container-xl)',
        'container-2xl': 'var(--container-2xl)',
      },
      zIndex: {
        auto: 'auto',
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
      },
      opacity: {
        0: '0',
        25: '0.25',
        50: '0.5',
        75: '0.75',
        100: '1',
      },
      borderWidth: {
        0: '0px',
        1: '1px',
        2: '2px',
        4: '4px',
        8: '8px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        inner: 'var(--shadow-inner)',
        none: 'var(--shadow-none)',
      },
      ringWidth: {
        DEFAULT: '2px',
        0: '0px',
        1: '1px',
        2: '2px',
        4: '4px',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            a: {
              color: theme('colors.accent', 'var(--color-accent)'),
              textDecoration: 'underline',
              '&:hover': {
                color: theme('colors.accent-dark', 'var(--color-accent-dark)'),
              },
            },
            h1: { fontSize: theme('fontSize.2xl'), fontWeight: theme('fontWeight.bold') },
            h2: { fontSize: theme('fontSize.xl'), fontWeight: theme('fontWeight.semibold') },
            h3: { fontSize: theme('fontSize.lg'), fontWeight: theme('fontWeight.medium') },
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
    // Core navigation and button classes only
    'from-accent',
    'to-accent',
  ],
};