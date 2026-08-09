// ESLint flat config for modern setup - comprehensive configuration
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import * as astroEslintParser from 'astro-eslint-parser';
import astroPlugin from 'eslint-plugin-astro';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

export default [
  // Base JavaScript configuration
  js.configs.recommended,

  // ESLint 10 + @eslint/js: `no-useless-escape` currently throws on load.
  {
    rules: {
      'no-useless-escape': 'off',
    },
  },

  // JavaScript and Node.js files
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'no-console': 'off',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'no-useless-escape': 'off',
    },
  },

  // Cloudflare Workers / Edge functions
  {
    files: ['functions/**/*.js', 'src/pages/**/*.ts'],
    languageOptions: {
      globals: {
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        crypto: 'readonly',
        caches: 'readonly',
        addEventListener: 'readonly',
        KVNamespace: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    },
  },

  // Browser environment files
  {
    files: [
      'assets-source/**/*.js',
      'public/**/*.js',
      'src/assets/**/*.js',
      'src/scripts/**/*.ts',
      'tests/playwright/**/*.js',
      'tests/utils/colorResolver.browser.js',
    ],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        requestIdleCallback: 'readonly',
        cancelIdleCallback: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        PerformanceObserver: 'readonly',
        ResizeObserver: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        XMLHttpRequest: 'readonly',
        Notification: 'readonly',
        getComputedStyle: 'readonly',
        console: 'readonly',
        self: 'readonly',
        caches: 'readonly',
        addEventListener: 'readonly',
        removeEventListener: 'readonly',
        postMessage: 'readonly',
        gtag: 'readonly',
        clarity: 'readonly',
        define: 'readonly',
        confirm: 'readonly',
      },
    },
  },

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off', // TypeScript handles this
    },
  },

  // Tailwind class correctness (unknown/conflicting classes)
  {
    files: ['src/**/*.{astro,tsx,ts,jsx,js}'],
    ...betterTailwindcss.configs['correctness-warn'],
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/styles/global.css',
        // Discover @layer components chrome (layout-gutter, nav-shell, ai-chat-*, …)
        detectComponentClasses: true,
      },
    },
    rules: {
      ...betterTailwindcss.configs['correctness-warn'].rules,
      // Astro-scoped styles and feature CSS intentionally define non-Tailwind hook classes.
      'better-tailwindcss/no-unknown-classes': 'off',
    },
  },

  // Reusable components must use semantic theme tokens, not raw dark: utilities
  {
    files: ['src/components/**/*.{astro,tsx,ts}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\bdark:/]',
          message:
            'Avoid Tailwind dark: utilities in components. Use semantic theme tokens from theme.css instead.',
        },
        {
          selector: 'TemplateElement[value.raw=/\\bdark:/]',
          message:
            'Avoid Tailwind dark: utilities in components. Use semantic theme tokens from theme.css instead.',
        },
      ],
    },
  },

  // App pages (excluding design-system docs) must use semantic tokens
  {
    files: ['src/pages/**/*.{astro,tsx,ts}'],
    ignores: ['src/pages/design/**', 'src/pages/docs/**', 'src/pages/debug/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\bdark:/]',
          message:
            'Avoid Tailwind dark: utilities in app pages. Use semantic theme tokens from theme.css instead.',
        },
        {
          selector: 'TemplateElement[value.raw=/\\bdark:/]',
          message:
            'Avoid Tailwind dark: utilities in app pages. Use semantic theme tokens from theme.css instead.',
        },
      ],
    },
  },

  // Astro files
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroEslintParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
    plugins: {
      astro: astroPlugin,
    },
    rules: {
      ...astroPlugin.configs.recommended.rules,
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'no-console': 'off',
    },
  },

  // Test files - Vitest
  {
    files: ['tests/vitest/**/*.ts', 'tests/vitest/**/*.js'],
    languageOptions: {
      parser: tsparser,
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        test: 'readonly',
        jest: 'readonly',
        window: 'readonly',
        document: 'readonly',
        global: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off', // Vitest globals are handled above
    },
  },

  // Test files - Playwright
  {
    files: ['tests/playwright/**/*.ts', 'playwright/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      globals: {
        test: 'readonly',
        expect: 'readonly',
        page: 'readonly',
        context: 'readonly',
        browser: 'readonly',
        console: 'readonly',
      },
    },
  },

  // Configuration files
  {
    files: ['*.config.js', '*.config.ts', '*.config.mjs', 'scripts/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },

  // Ignore patterns
  {
    ignores: [
      'dist/',
      'dist 2/',
      'node_modules/',
      '.wrangler/',
      '.astro/',
      '.astro 2/',
      // Don't ignore public JS so we can lint SW and utility scripts
      // 'public/',
      // Ignore vendor/minified JS under public, but keep service worker linted
      'public/assets/**/*.js',
      'public/**/*.min.js',
      'coverage/',
      'playwright-report/',
      'test-results/',
      'lighthouse-reports/',
      'optimization-reports/',
      'src/content/**/*',
      '*.css',
      '*.scss',
      '*.md',
      '*.html',
      '*.json',
      '.env*',
      'pnpm-lock.yaml',
    ],
  },
];
