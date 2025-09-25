// tailwind.config.js
import containerQueries from '@tailwindcss/container-queries';
import typography from '@tailwindcss/typography';

export default /** @type {import('tailwindcss').Config} */ {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: 'clamp(var(--container-padding, 1rem), 4vw, var(--container-padding-lg, 4rem))',
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
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        themeToggleSpin: {
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn var(--duration, 250ms) var(--ease-standard, cubic-bezier(0.4,0,0.2,1)) both',
        fadeInUp: 'fadeInUp var(--duration, 250ms) var(--ease-standard, cubic-bezier(0.4,0,0.2,1)) both',
        slideUp: 'slideUp var(--duration, 250ms) var(--ease-emphasized, cubic-bezier(0.2,0,0,1)) both',
        float: 'float 3s var(--ease-standard, cubic-bezier(0.4,0,0.2,1)) infinite',
        pulseGlow: 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        themeToggleSpin: 'themeToggleSpin var(--duration-fast, 150ms) var(--ease-standard, cubic-bezier(0.4,0,0.2,1))',
      },
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
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-info': 'var(--gradient-info)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-warning': 'var(--gradient-warning)',
        'gradient-error': 'var(--gradient-error)',
        'glow-hero': 'radial-gradient(circle at top, rgba(56, 189, 248, 0.2), transparent 62%)',
        'glow-accent': 'radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.18), transparent 60%)',
        'grid-overlay': 'linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
      },
      blur: {
        sm: 'var(--blur-sm)',
        DEFAULT: 'var(--blur)',
        lg: 'var(--blur-lg)',
      },
      backdropBlur: {
        sm: 'var(--blur-sm)',
        DEFAULT: 'var(--blur)',
        lg: 'var(--blur-lg)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        DEFAULT: 'var(--duration)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
        emphasized: 'var(--ease-emphasized)',
        decelerate: 'var(--ease-decelerate)',
        accelerate: 'var(--ease-accelerate)',
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
        'soft-glow': '0 40px 120px -45px rgba(15, 23, 42, 0.55)',
        'accent-glow': '0 24px 65px -35px rgba(56, 189, 248, 0.55)',
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
