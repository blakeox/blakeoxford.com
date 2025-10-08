import type { Config } from 'tailwindcss';
import containerQueries from '@tailwindcss/container-queries';
import typography from '@tailwindcss/typography';

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
        fadeIn:
          'fadeIn var(--duration, 250ms) var(--ease-standard, cubic-bezier(0.4,0,0.2,1)) both',
        fadeInUp:
          'fadeInUp var(--duration, 250ms) var(--ease-standard, cubic-bezier(0.4,0,0.2,1)) both',
        slideUp:
          'slideUp var(--duration, 250ms) var(--ease-emphasized, cubic-bezier(0.2,0,0,1)) both',
        float: 'float 3s var(--ease-standard, cubic-bezier(0.4,0,0.2,1)) infinite',
        pulseGlow: 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        themeToggleSpin:
          'themeToggleSpin var(--duration-fast, 150ms) var(--ease-standard, cubic-bezier(0.4,0,0.2,1))',
      },
      colors: {
        // Provide safe fallbacks to prevent white/transparent rendering if CSS vars are missing early in the cascade.
        primary: 'var(--color-primary, #4f46e5)',
        'primary-light': 'var(--color-primary-light, #6366f1)',
        'primary-dark': 'var(--color-primary-dark, #3730a3)',
        accent: 'var(--color-accent, #06b6d4)',
        'accent-light': 'var(--color-accent-light, #22d3ee)',
        'accent-dark': 'var(--color-accent-dark, #0e7490)',
        surface: 'var(--color-surface, #ffffff)',
        'surface-dark': 'var(--color-surface-dark, #0f172a)',
        'surface-subtle': 'var(--color-surface-subtle, #eef2ff)',
        'surface-dark-subtle': 'var(--color-surface-dark-subtle, #111827)',
        background: 'var(--color-background, #f8fafc)',
        'background-dark': 'var(--color-background-dark, #0b1220)',
        foreground: 'var(--color-foreground, #111827)',
        'foreground-strong': 'var(--color-foreground-strong, #0f172a)',
        'foreground-light': 'var(--color-foreground-light, #f9fafb)',
        'on-accent': 'var(--color-on-accent, #051b2a)',
        'on-dark': 'var(--color-on-dark, #f9fafb)',
        neutral: 'var(--color-neutral, #64748b)',
        'neutral-light': 'var(--color-neutral-light, #cbd5e1)',
        'neutral-dark': 'var(--color-neutral-dark, #334155)',
        border: 'var(--border-color, rgba(15, 23, 42, 0.08))',
        'border-dark': 'var(--border-color-dark, rgba(148, 163, 184, 0.2))',
        // Semantic aliases for clarity (no behavior change)
        'on-surface': 'var(--color-foreground, #111827) ',
        'on-surface-strong': 'var(--color-foreground-strong, #0f172a)',
      },
      screens: {
        'sm-md': { raw: '(min-width: 651px) and (max-width: 767px)' },
        'supports-backdrop': { raw: '(backdrop-filter: blur(0))' },
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        14: 'var(--space-14)',
        16: 'var(--space-16)',
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
      fontFamily: {
        sans: 'var(--font-sans)',
        heading: 'var(--font-heading)',
        mono: 'var(--font-mono)',
        ui: 'var(--font-ui)',
      },
      fontSize: {
        xxs: 'var(--fs-xxs)',
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
      },
      boxShadow: {
        card: 'var(--shadow-card, 0 20px 45px -20px rgba(16, 24, 40, 0.35))',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        inner: 'var(--shadow-inner)',
        none: 'var(--shadow-none)',
      },
      backgroundImage: {
        'btn-primary':
          'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-info': 'var(--gradient-info)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-warning': 'var(--gradient-warning)',
        'gradient-error': 'var(--gradient-error)',
      },
      data: {
        open: 'state=open',
        closed: 'state=closed',
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
        label: 'var(--ls-label)',
        smallcaps: 'var(--ls-smallcaps)',
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
        heading: 'var(--lh-heading)',
        body: 'var(--lh-body)',
      },
      maxWidth: {
        'container-sm': 'var(--container-sm)',
        'container-md': 'var(--container-md)',
        'container-lg': 'var(--container-lg)',
        'container-xl': 'var(--container-xl)',
        'container-2xl': 'var(--container-2xl)',
      },
      zIndex: { auto: 'auto', 0: '0', 10: '10', 20: '20', 30: '30', 40: '40', 50: '50' },
      opacity: { 0: '0', 25: '0.25', 50: '0.5', 75: '0.75', 100: '1' },
      borderWidth: { 0: '0px', 1: '1px', 2: '2px', 4: '4px', 8: '8px' },

      blur: { sm: 'var(--blur-sm)', DEFAULT: 'var(--blur)', lg: 'var(--blur-lg)' },
      backdropBlur: { sm: 'var(--blur-sm)', DEFAULT: 'var(--blur)', lg: 'var(--blur-lg)' },
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

      ringWidth: { DEFAULT: '2px', 0: '0px', 1: '1px', 2: '2px', 4: '4px' },
      typography: ({ theme }: { theme: (path: string, fallback?: any) => any }) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            a: {
              color: theme('colors.primary', 'var(--color-primary)'),
              textDecoration: 'underline',
              '&:hover': { color: theme('colors["primary-dark"]', 'var(--color-primary-dark)') },
            },
            h1: { fontSize: theme('fontSize.2xl'), fontWeight: theme('fontWeight.bold') },
            h2: { fontSize: theme('fontSize.xl'), fontWeight: theme('fontWeight.semibold') },
            h3: { fontSize: theme('fontSize.lg'), fontWeight: theme('fontWeight.medium') },
          },
        },
      }),
    },
  },
  plugins: [containerQueries, typography],
};

export default config;

