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

export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'class',
  safelist: [
    // Add only token-based classes you want to guarantee are always available (optional, for dynamic classes)
    // Example: 'bg-primary', 'text-accent', 'rounded-lg', ...
  ],
  theme: {
    colors,
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
  corePlugins: {
    preflight: true,
    // Disable unused utilities for stricter enforcement (examples below)
    float: false,
    clear: false,
    objectFit: false,
    objectPosition: false,
    overscrollBehavior: false,
    resize: false,
    userSelect: false,
    // Add more as needed to lock down the utility set
  },
};
