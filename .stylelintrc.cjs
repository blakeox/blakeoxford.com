module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss',
    'stylelint-config-recess-order',
  ],
  ignoreFiles: ['src/styles/global.css',
                 'src/styles/theme.css'],
  rules: {
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
          "#[0-9a-fA-F]{3,6}",
          "\\b\\d+(px|rem|em)\\b"
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
            '/^from-\[#/',
            '/^to-\[#/',
            '/^via-\[#/'
          ]
        },
      },
    },
  ],
};