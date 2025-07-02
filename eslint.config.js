import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';
import * as mdx from 'eslint-plugin-mdx';
import astroParser from 'astro-eslint-parser';

export default [
  js.configs.recommended,
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
    files: ['tests/playwright/**/*.ts'],
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
      'tests/__mocks__/**/*.ts'
    ],
    languageOptions: {
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        global: 'readonly',
        // Web APIs available in Node.js
        fetch: 'readonly',
        crypto: 'readonly',
        Response: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off', // Allow require in Node.js files
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
    ],
  },
];
