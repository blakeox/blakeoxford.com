import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';
import * as mdx from 'eslint-plugin-mdx';
import astroParser from 'astro-eslint-parser';

export default [
  js.configs.recommended,
  // Browser environment files (client-side JavaScript)
  {
    files: [
      'assets-source/**/*.js',
      'public/**/*.js',
      'src/assets/**/*.js'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLScriptElement: 'readonly',
        HTMLButtonElement: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        FocusEvent: 'readonly',
        TouchEvent: 'readonly',
        CustomEvent: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        getComputedStyle: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        prompt: 'readonly',
        // Web APIs
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        NodeFilter: 'readonly',
        // Speech APIs
        SpeechSynthesisUtterance: 'readonly',
        speechSynthesis: 'readonly',
        webkitSpeechRecognition: 'readonly',
        // Analytics globals (external scripts)
        gtag: 'readonly',
        plausible: 'readonly',
        fathom: 'readonly',
        clarity: 'readonly',
        // Search library
        Fuse: 'readonly',
        // Service Worker APIs
        caches: 'readonly',
        // Performance API
        Performance: 'readonly',
        // Node.js compatibility for some files
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-cond-assign': 'warn',
      'no-empty': 'warn',
    },
  },
  // Test files with DOM and Vitest globals
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx', 'vitest.setup.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        // DOM globals
        window: 'readonly',
        document: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLScriptElement: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        FocusEvent: 'readonly',
        TouchEvent: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        global: 'readonly',
        fetch: 'readonly',
        NodeJS: 'readonly',
        FrameRequestCallback: 'readonly',
        Document: 'readonly',
        Window: 'readonly',
        // Node.js globals for test files
        __dirname: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn', // Allow any in tests
      '@typescript-eslint/no-unused-vars': 'warn', // Allow unused vars in tests
      '@typescript-eslint/no-require-imports': 'off', // Allow require in tests
    },
  },
  // Playwright test files
  {
    files: ['tests/playwright/**/*.ts', 'tests/playwright/**/*.js', 'playwright/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Playwright globals
        test: 'readonly',
        expect: 'readonly',
        // Browser globals (for page.evaluate contexts)
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        Performance: 'readonly',
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        // DOM types (for type checking)
        HTMLInputElement: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
  // Scripts that contain browser code alongside Node.js code
  {
    files: [
      'scripts/critical-css-generator.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        // Browser globals (for puppeteer/browser context)
        window: 'readonly',
        document: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        // Web APIs
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-empty': 'warn',
    },
  },
  // Node.js environment files
  {
    files: [
      'functions/**/*.js',
      'scripts/**/*.js',
      'playwright.config.ts',
      'vitest.config.ts',
      'astro.config.mjs',
      'tailwind.config.js',
      'postcss.config.cjs',
      '.stylelintrc.cjs',
      'tests/__mocks__/**/*.ts',
      'check-headings.js',
      'form-validation-test.cjs',
      'form-validation-test.js'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        // Web APIs available in Node.js
        fetch: 'readonly',
        crypto: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        // Cloudflare Workers globals
        caches: 'readonly',
        // Performance API
        Performance: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off', // Allow require in Node.js files
      'no-unused-vars': 'warn',
      'no-empty': 'warn',
    },
  },
  // Type-aware linting for main TS source files only
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Warn on hardcoded color strings (hex, rgb, hsl) in code
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value][raw=/#[0-9a-fA-F]{3,6}|rgb\\(|hsl\\(/]",
          message: 'Use Tailwind token classes for colors, not hardcoded values.'
        },
        {
          selector: "Literal[value][raw=/\\d+(px|rem|em)/]",
          message: 'Use Tailwind token classes for spacing/sizing, not hardcoded units.'
        }
      ]
    },
  },
  // TypeScript files outside src/ (no type-checking)
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Warn on hardcoded color strings (hex, rgb, hsl) in code
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value][raw=/#[0-9a-fA-F]{3,6}|rgb\\(|hsl\\(/]",
          message: 'Use Tailwind token classes for colors, not hardcoded values.'
        },
        {
          selector: "Literal[value][raw=/\\d+(px|rem|em)/]",
          message: 'Use Tailwind token classes for spacing/sizing, not hardcoded units.'
        }
      ]
    },
  },
  // Astro files
  {
    files: ['**/*.astro'],
    plugins: {
      astro,
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsparser,
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      ...astro.configs.recommended.rules,
      // Warn on hardcoded color strings (hex, rgb, hsl) in code
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value][raw=/#[0-9a-fA-F]{3,6}|rgb\\(|hsl\\(/]",
          message: 'Use Tailwind token classes for colors, not hardcoded values.'
        },
        {
          selector: "Literal[value][raw=/\\d+(px|rem|em)/]",
          message: 'Use Tailwind token classes for spacing/sizing, not hardcoded units.'
        }
      ],
      // Allow destructured but unused variables in Astro components
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_'
        }
      ]
    },
  },
  // MDX files (exclude content files which have frontmatter)
  {
    files: ['**/*.mdx'],
    ignores: ['src/content/**/*.mdx'], // Exclude content MDX files
    plugins: {
      mdx,
    },
    rules: {
      ...mdx.configs.recommended.rules,
      // Warn on hardcoded color strings (hex, rgb, hsl) in code
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value][raw=/#[0-9a-fA-F]{3,6}|rgb\\(|hsl\\(/]",
          message: 'Use Tailwind token classes for colors, not hardcoded values.'
        },
        {
          selector: "Literal[value][raw=/\\d+(px|rem|em)/]",
          message: 'Use Tailwind token classes for spacing/sizing, not hardcoded units.'
        }
      ]
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'public/',
      'pnpm-lock.yaml',
      // Exclude generated Astro files
      '.astro/',
      // Exclude debug and temporary files
      'debug-*.js',
      'test-*.js',
      'test-*.html',
      '**/dropdown.test 2.ts', // Exclude duplicate test files
      // Exclude coverage reports
      'coverage/',
      // Exclude content MDX files (they have frontmatter that breaks parsing)
      'src/content/**/*.mdx',
      // Exclude test HTML files
      'test-mobile-hamburger.html',
      'test-hamburger-simple.html',
      'debug-test.html',
      // Exclude production test files
      'test-production.js',
      'test-mobile-navbar.js',
      'test-button-focus.js',
      // Exclude broken lock file
      'pnpm-lock.yaml.broken',
      // Exclude lighthouse reports
      'lighthouse-*.html',
      // Exclude test results
      'test-results/',
      'test-results 2/',
      'playwright-report/',
      // Exclude problematic test files
      'tests/playwright/test-button-focus.spec.js', // Has browser globals without proper setup
    ],
  },
];
