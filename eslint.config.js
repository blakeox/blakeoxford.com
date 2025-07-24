// ESLint flat config for modern setup - comprehensive configuration
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import astroEslintParser from 'astro-eslint-parser';
import astroPlugin from 'eslint-plugin-astro';

export default [
  // Base JavaScript configuration
  js.configs.recommended,
  
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
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-console': 'off',
      'no-unused-vars': 'warn',
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
  },

  // Browser environment files
  {
    files: [
      'assets-source/**/*.js',
      'public/**/*.js',
      'src/assets/**/*.js',
      'src/scripts/**/*.ts',
      'scripts/critical-css-generator.js',
      'tests/playwright/**/*.js',
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
        console: 'readonly',
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
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off', // TypeScript handles this
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
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
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
    files: [
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      'scripts/**/*.js',
    ],
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
      'node_modules/',
      '.astro/',
      'public/',
      'coverage/',
      'playwright-report/',
      'test-results/',
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