import type { Config } from 'tailwindcss';
import { colors } from './src/tokens/colors';
import { fontFamily } from './src/tokens/fontFamily';
import { fontSize } from './src/tokens/fontSize';
import { fontWeight } from './src/tokens/fontWeight';
import { lineHeight } from './src/tokens/lineHeight';
import { letterSpacing } from './src/tokens/letterSpacing';
import { screens } from './src/tokens/screens';
import { spacing } from './src/tokens/spacing';
import { borderRadius } from './src/tokens/borderRadius';
import { borderWidth } from './src/tokens/borderWidth';
import { boxShadow } from './src/tokens/boxShadow';
import { zIndex } from './src/tokens/zIndex';
import { opacity } from './src/tokens/opacity';
import { container } from './src/tokens/container';
import { maxWidth } from './src/tokens/maxWidth';
import { minWidth } from './src/tokens/minWidth';
import { minHeight } from './src/tokens/minHeight';
import { aspectRatio } from './src/tokens/aspectRatio';
import { animation } from './src/tokens/animation';
import { keyframes } from './src/tokens/keyframes';
import { ringWidth } from './src/tokens/ringWidth';
import { transitionDuration } from './src/tokens/transitionDuration';
import { transitionDelay } from './src/tokens/transitionDelay';

const config: Config = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'class',
  theme: {
    colors: {
      ...colors,
      navbar: colors.navbar,
    },
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
    screens,
    spacing,
    borderRadius,
    borderWidth,
    boxShadow,
    zIndex,
    opacity,
    container,
    maxWidth,
    minWidth,
    minHeight,
    aspectRatio,
    animation,
    keyframes,
    ringWidth,
    transitionDuration,
    transitionDelay,
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/container-queries'),
  ],
};

export default config;
