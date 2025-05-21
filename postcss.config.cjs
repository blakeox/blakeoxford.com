const tailwindcss = require('tailwindcss');

module.exports = {
  plugins: {
    tailwindcss: {
      darkMode: 'class',
      content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}', './public/**/*.html'],
    },
    autoprefixer: {},
  },
};