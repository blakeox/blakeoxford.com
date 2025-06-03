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
        26: 'var(--space-26)',
        30: 'var(--space-30)',
        34: 'var(--space-34)',
        38: 'var(--space-38)',
        42: 'var(--space-42)',
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
        max: '9999',
      },
      opacity: {
        0: '0',
        5: '0.05',
        10: '0.1',
        20: '0.2',
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
            h1: {
              fontSize: theme('fontSize.7xl'),
              fontWeight: theme('fontWeight.extrabold'),
              marginTop: '2.5em',
              marginBottom: '0.75em',
              lineHeight: theme('lineHeight.tight'),
            },
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
            h4: {
              fontSize: theme('fontSize.2xl'),
              fontWeight: theme('fontWeight.semibold'),
              marginTop: '1.25em',
              marginBottom: '0.4em',
            },
            h5: {
              fontSize: theme('fontSize.xl'),
              fontWeight: theme('fontWeight.medium'),
              marginTop: '1em',
              marginBottom: '0.3em',
            },
            h6: {
              fontSize: theme('fontSize.lg'),
              fontWeight: theme('fontWeight.medium'),
              marginTop: '0.8em',
              marginBottom: '0.2em',
              textTransform: 'uppercase',
              letterSpacing: theme('letterSpacing.wide'),
            },
            a: {
              color: theme('colors.accent.DEFAULT', '#10b981'),
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              fontWeight: theme('fontWeight.medium'),
              transition: 'color 0.2s',
              '&:hover': {
                color: theme('colors.accent.dark', '#047857'),
              },
              '&:focus': {
                outline: '2px solid',
                outlineColor: theme('colors.accent.DEFAULT', '#10b981'),
                outlineOffset: '2px',
              },
            },
            ul: {
              paddingLeft: '1.25em',
              marginBottom: '1em',
            },
            ol: {
              paddingLeft: '1.25em',
              marginBottom: '1em',
            },
            'ul > li::marker': {
              color: theme('colors.accent.DEFAULT', '#10b981'),
            },
            'ol > li::marker': {
              color: theme('colors.accent.DEFAULT', '#10b981'),
            },
            blockquote: {
              fontStyle: 'italic',
              color: theme('colors.neutral.dark', '#334155'),
              borderLeft: `4px solid ${theme('colors.accent.DEFAULT', '#10b981')}`,
              paddingLeft: '1em',
              margin: '1.5em 0',
            },
            code: {
              backgroundColor: theme('colors.neutral.light', '#cbd5e1'),
              color: theme('colors.accent.dark', '#047857'),
              borderRadius: theme('borderRadius.md'),
              padding: '0.2em 0.4em',
              fontSize: '0.95em',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
              padding: 0,
            },
            pre: {
              backgroundColor: theme('colors.neutral.light', '#cbd5e1'),
              color: theme('colors.neutral.dark', '#334155'),
              borderRadius: theme('borderRadius.lg'),
              padding: '1em',
              overflowX: 'auto',
              fontSize: '0.95em',
            },
            img: {
              borderRadius: theme('borderRadius.lg'),
              margin: '1.5em 0',
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
            },
            table: {
              width: '100%',
              borderCollapse: 'collapse',
              margin: '2em 0',
            },
            th: {
              fontWeight: theme('fontWeight.bold'),
              borderBottom: `2px solid ${theme('colors.neutral.dark', '#334155')}`,
              padding: '0.5em',
            },
            td: {
              borderBottom: `1px solid ${theme('colors.neutral.light', '#cbd5e1')}`,
              padding: '0.5em',
            },
            '@screen lg': {
              h1: { fontSize: theme('fontSize.8xl') },
              h2: { fontSize: theme('fontSize.7xl') },
              h3: { fontSize: theme('fontSize.5xl') },
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