import type { Config } from 'tailwindcss';
import { join } from 'path';
import typography from '@tailwindcss/typography';
import containerQueries from '@tailwindcss/container-queries';

const config: Config = {
  darkMode: 'class',
  content: [
    join(__dirname, 'src/**/*.{astro,html,js,jsx,ts,tsx,mdx}')
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-light': 'var(--color-primary-light)',
        'primary-dark': 'var(--color-primary-dark)',
        accent: 'var(--color-accent)',
        'accent-light': 'var(--color-accent-light)',
        'accent-dark': 'var(--color-accent-dark)',
        surface: 'var(--color-surface)',
        'surface-dark': 'var(--color-surface-dark)',
        'surface-subtle': 'var(--color-surface-subtle)',
        'surface-dark-subtle': 'var(--color-surface-dark-subtle)',
        background: 'var(--color-background)',
        'background-dark': 'var(--color-background-dark)',
        foreground: 'var(--color-foreground)',
        'foreground-strong': 'var(--color-foreground-strong)',
        'foreground-light': 'var(--color-foreground-light)',
        'on-accent': 'var(--color-on-accent)',
        'on-dark': 'var(--color-on-dark)',
        neutral: 'var(--color-neutral)',
        'neutral-light': 'var(--color-neutral-light)',
        'neutral-dark': 'var(--color-neutral-dark)',
        border: 'var(--border-color)',
        'border-dark': 'var(--border-color-dark)',
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
      },
      backgroundImage: {
        'btn-primary': 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%)',
      },
layer: {
      },
    },
  },
  plugins: [typography, containerQueries],
};

export default config;

