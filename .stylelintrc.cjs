module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss',
    'stylelint-config-recess-order',
  ],
  ignoreFiles: ['src/styles/global.css',
                 'src/styles/theme.css'],
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
        'linear-gradient',
        'radial-gradient',
        'repeating-linear-gradient',
        'repeating-radial-gradient'
      ]
    }],
    'color-no-hex': [true, {
      ignoreProperties: [
        /^--color-/,
        /^--navbar-/,
        /^--shadow-/,
        /^--ring-/,
        /^--border-/,
        /^--z-/,
        /^--fs-/,
        /^--fw-/,
        /^--ls-/,
        /^--lh-/,
        /^--radius-/,
        /^--space-/,
        /^--container-/,
        /^--bp-/,
        /^--anim-/,
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
        // Allow arbitrary values for Tailwind gradients (e.g., from-[#10b981])
        'selector-class-pattern': null,
        'value-no-vendor-prefix': null,
        'function-no-unknown': [true, {
          ignoreFunctions: [
            '/^theme$/',
            '/^var$/',
            '/^linear-gradient$/',
            '/^radial-gradient$/',
            '/^repeating-linear-gradient$/',
            '/^repeating-radial-gradient$/',
          ]
        }],
        'declaration-property-value-allowed-list': {
          'background-image': [
            '/^linear-gradient/',
            '/^radial-gradient/',
            '/^repeating-linear-gradient/',
            '/^repeating-radial-gradient/',
            '/^url/',
            '/^var/',
            '/^theme/',
            '/^from-\\[#/',
            '/^to-\\[#/',
            '/^via-\\[#/'
          ]
        },
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
      },
    },
  ],
};
