/**
 * Motion and Animation Accessibility Module
 * Respects user preferences for reduced motion and provides alternatives
 */

export class MotionAccessibility {
  constructor() {
    this.respectsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.initializeMotionPreferences();
    this.setupMotionToggle();
  }

  initializeMotionPreferences() {
    // Listen for changes in motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', (e) => {
      this.respectsReducedMotion = e.matches;
      this.updateAnimations();
    });

    // Initial setup
    this.updateAnimations();
  }

  updateAnimations() {
    const root = document.documentElement;
    
    if (this.respectsReducedMotion) {
      // Disable animations and transitions
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
      
      // Add class for CSS targeting
      document.body.classList.add('reduced-motion');
      
      // Stop any running animations
      const animatedElements = document.querySelectorAll('[data-animate]');
      animatedElements.forEach(el => {
        el.style.animation = 'none';
        el.style.transition = 'none';
      });
    } else {
      // Restore normal animations
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
      document.body.classList.remove('reduced-motion');
    }
  }

  setupMotionToggle() {
    // Add a user toggle for motion preferences
    const motionToggle = document.getElementById('motion-toggle');
    if (motionToggle) {
      motionToggle.addEventListener('change', (e) => {
        this.respectsReducedMotion = !e.target.checked;
        this.updateAnimations();
        
        // Announce change to screen readers
        if (window.srAnnouncer) {
          const message = this.respectsReducedMotion 
            ? 'Animations disabled for better accessibility'
            : 'Animations enabled';
          window.srAnnouncer.announce(message, 'polite');
        }
      });
    }
  }

  // Safe animation method that respects preferences
  safeAnimate(element, animation, options = {}) {
    if (this.respectsReducedMotion) {
      // Provide instant completion for reduced motion users
      if (options.onComplete) {
        options.onComplete();
      }
      return;
    }

    // Proceed with normal animation
    if (element.animate) {
      const anim = element.animate(animation, options);
      if (options.onComplete) {
        anim.addEventListener('finish', options.onComplete);
      }
    }
  }

  // Fade in with respect to motion preferences
  safeFadeIn(element, duration = 300) {
    if (this.respectsReducedMotion) {
      element.style.opacity = '1';
      return;
    }

    element.style.opacity = '0';
    this.safeAnimate(element, 
      [{ opacity: 0 }, { opacity: 1 }], 
      { 
        duration,
        easing: 'ease-out',
        onComplete: () => {
          element.style.opacity = '1';
        }
      }
    );
  }
}

// Add CSS for reduced motion support
const motionCSS = `
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Disable parallax and transform animations */
  .parallax {
    transform: none !important;
  }
  
  .animate-float,
  .animate-fade-in,
  .animate-bounce {
    animation: none !important;
  }
}

/* For users who have explicitly enabled reduced motion */
.reduced-motion *,
.reduced-motion *::before,
.reduced-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = motionCSS;
  document.head.appendChild(style);
}

// Initialize
if (typeof window !== 'undefined') {
  window.motionAccessibility = new MotionAccessibility();
}
