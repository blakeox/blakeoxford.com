// Keyframes tokens for design system
export const keyframes = {
  fadeIn: {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  pulseSlow: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  bounceY: {
    '0%, 100%': { transform: 'translateY(0%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
    '50%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
  },
  slideUp: {
    '0%': { transform: 'translateY(100%)', opacity: 0 },
    '100%': { transform: 'translateY(0)', opacity: 1 },
  },
  slideDown: {
    '0%': { transform: 'translateY(-100%)', opacity: 0 },
    '100%': { transform: 'translateY(0)', opacity: 1 },
  },
  slideLeft: {
    '0%': { transform: 'translateX(100%)', opacity: 0 },
    '100%': { transform: 'translateX(0)', opacity: 1 },
  },
  slideRight: {
    '0%': { transform: 'translateX(-100%)', opacity: 0 },
    '100%': { transform: 'translateX(0)', opacity: 1 },
  },
};
