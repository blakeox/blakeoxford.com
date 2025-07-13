import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^astro:content$/, replacement: path.resolve(__dirname, 'tests/__mocks__/astro-content.ts') },
    ],
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**', // Exclude all test files from coverage
        'playwright/**', // Exclude Playwright test files
        'src/mocks/**', // Exclude mock files
        'dist/**',
        '.astro/**',
        'public/**', // Start by excluding all public files
        'assets-source/js/**', // Exclude all JS files by default
        '!assets-source/js/analytics.js', // Include specific utility JS files that have tests
        '!assets-source/js/a11y.js',
        '!assets-source/js/scroll.js',
        // Note: dropdown.js is excluded from Vitest coverage as it's tested via Playwright E2E
        'functions/**', // Exclude Cloudflare functions
        'src/**/*.astro', // Exclude Astro components from coverage
        'src/pages/**', // Exclude Astro pages from coverage
        '!src/pages/api/**/*.js', // But include API endpoints
        '!src/config/**/*.js', // Include config files
        '!src/content/config.ts', // Include content config
        '!src/components/ThemeToggle.jsx', // Include React component
        'src/layouts/**', // Exclude Astro layouts from coverage
        '**/debug-*.js', // Exclude debug files
        'test-*.js', // Exclude test utilities
        'scripts/**', // Exclude build scripts
        'playwright.config.ts',
        'vitest.config.ts',
        'astro.config.mjs',
        'tailwind.config.js',
        'postcss.config.cjs',
        'eslint.config.js',
        '.stylelintrc.cjs', // Exclude stylelint config
        // Exclude specific untested files
        'check-headings.js',
        'form-validation-test.cjs',
        'form-validation-test.js',
      ],
      thresholds: {
        statements: 80, // High threshold for included files (utility JS, APIs, configs)
        branches: 70,   // High threshold for included files
        functions: 80,  // High threshold for included files
        lines: 80,      // High threshold for included files
      }
    },
  },
});
