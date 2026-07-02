import type { Config } from 'tailwindcss';
import containerQueries from '@tailwindcss/container-queries';
import typography from '@tailwindcss/typography';

/**
 * Tailwind v4 config — design tokens live in src/styles/theme.css (@theme inline).
 * Plugins remain here until CSS @plugin output is compatible with Lightning CSS minify.
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
          'themeToggleSpin var(--duration-fast, 100ms) var(--ease-standard, cubic-bezier(0.4,0,0.2,1))',
      },
      screens: {
        'sm-md': { raw: '(min-width: 651px) and (max-width: 767px)' },
        'supports-backdrop': { raw: '(backdrop-filter: blur(0))' },
      },
      maxWidth: {
        'container-2xl': 'var(--container-2xl)',
      },
      zIndex: { auto: 'auto', 0: '0', 10: '10', 20: '20', 30: '30', 40: '40', 50: '50' },
      borderWidth: { 0: '0px', 1: '1px', 2: '2px', 4: '4px', 8: '8px' },
      ringWidth: { DEFAULT: '2px', 0: '0px', 1: '1px', 2: '2px', 4: '4px' },
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
      typography: ({ theme }: { theme: (path: string, fallback?: unknown) => unknown }) => ({
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
