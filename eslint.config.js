import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';
import * as mdx from 'eslint-plugin-mdx';
import astroParser from 'astro-eslint-parser';

export default [
  js.configs.recommended,
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
  // MDX files
  {
    files: ['**/*.mdx'],
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
    ],
  },
];
