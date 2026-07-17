module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss',
    'stylelint-config-recess-order',
  ],
  ignoreFiles: [],
  rules: {
    // Tailwind v4 custom at-rules and functions
    'at-rule-no-unknown': [true, {
      ignoreAtRules: [
        'tailwind',
        'layer',
        'apply',
        'variants',
        'responsive',
        'screen',
        // Tailwind v4 feature used in global.css
        'custom-variant'
      ]
    }],
    'function-no-unknown': [true, {
      ignoreFunctions: [
        'theme',
        'var',
        'color-mix',
        'oklch',
        'clamp',
        'min',
        'max',
        'linear-gradient',
        'radial-gradient',
        'repeating-linear-gradient',
        'repeating-radial-gradient'
      ]
    }],
    'color-no-hex': [true, {
      ignoreProperties: [
        /^--color-/,
        /^--shadow-/,
        /^--ring-/,
        /^--border-/,
        /^--z-/,
        /^--radius-/,
        /^--container-/,
        /^--duration-/,
        /^--ease-/,
        /^--layout-/,
        /^--nav-/,
        /^--focus-/,
        /^--selection-/,
      ],
      ignoreSelectors: [':root']
    }],
    'declaration-property-value-disallowed-list': [
      {
        // Disallow hex and px/rem/em values for non-custom properties only
        '/^((?!^--).)*$/': [
          '#[0-9a-fA-F]{3,6}',
          '\\b\\d+(px|rem|em)\\b'
        ]
      }
    ],
  },
  overrides: [
    {
      files: ['src/styles/global.css'],
      rules: {
        'at-rule-no-unknown': [
          true,
          {
            ignoreAtRules: [
              'tailwind',
              'layer',
              'apply',
              'variants',
              'responsive',
              'screen',
              'custom-variant',
              'theme',
              'source',
              'utility',
              'plugin',
            ],
          },
        ],
        'import-notation': null,
      },
    },
    {
      files: ['src/styles/theme.css'],
      rules: {
        'color-no-hex': null,
        'declaration-property-value-disallowed-list': null,
        'declaration-block-single-line-max-declarations': null,
        'comment-empty-line-before': null,
        'custom-property-empty-line-before': null,
        'comment-whitespace-inside': null,
        'value-keyword-case': null,
        'keyframes-name-pattern': null,
        'color-function-alias-notation': null,
        'color-function-notation': null,
        'alpha-value-notation': null,
        'selector-class-pattern': null,
        'value-no-vendor-prefix': null,
        'at-rule-no-unknown': [
          true,
          {
            ignoreAtRules: [
              'tailwind',
              'layer',
              'apply',
              'theme',
              'custom-variant',
              'keyframes',
            ],
          },
        ],
        'function-no-unknown': [
          true,
          {
            ignoreFunctions: [
              'theme',
              'var',
              'color-mix',
              'oklch',
              'clamp',
              'min',
              'max',
              'linear-gradient',
              'radial-gradient',
              'repeating-linear-gradient',
              'repeating-radial-gradient',
            ],
          },
        ],
      },
    },
    {
      files: ['src/styles/components.css'],
      rules: {
        // BEM modifiers used by nav JS (nav-shell--scrolled, etc.)
        'selector-class-pattern': [
          '^[a-z][a-z0-9]*(?:-+[a-z0-9]+)*(?:__[a-z0-9]+(?:-+[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-+[a-z0-9]+)*)?$',
          { message: 'Expected class selector to be kebab-case or BEM' },
        ],
        'keyframes-name-pattern': null,
        'no-descending-specificity': null,
        'declaration-property-value-disallowed-list': null,
      },
    },
  ],
};
