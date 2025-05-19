import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'class', // 👈 enables dark mode switching via class
  theme: {
    extend: {
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            a: { color: theme('colors.blue.600') },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.200'),
            a: { color: theme('colors.blue.400') },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
