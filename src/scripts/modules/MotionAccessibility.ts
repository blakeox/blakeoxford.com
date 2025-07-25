/**
 * Motion and Animation Accessibility Module
 * Respects user preferences for reduced motion and provides alternatives
 */

interface AnimationOptions {
  duration?: number;
  easing?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface MotionPreferences {
  respectsReducedMotion: boolean;
  userOverride?: boolean;
}

export class MotionAccessibility {
  private respectsReducedMotion: boolean;
  private mediaQuery: MediaQueryList | null = null;
  private motionToggle: HTMLInputElement | null = null;

  constructor() {
    this.respectsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.initializeMotionPreferences();
    this.setupMotionToggle();
  }

  private initializeMotionPreferences(): void {
    // Listen for changes in motion preference
    this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.mediaQuery.addEventListener('change', (e: MediaQueryListEvent) => {
      this.respectsReducedMotion = e.matches;
      this.updateAnimations();
    });

    // Initial setup
    this.updateAnimations();
  }

  private updateAnimations(): void {
    const root = document.documentElement;
    
    if (this.respectsReducedMotion) {
      // Disable animations and transitions
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
      
      // Add class for CSS targeting
      document.body.classList.add('reduced-motion');
      
      // Stop any running animations
      const animatedElements = document.querySelectorAll('[data-animate]');
      animatedElements.forEach((el: Element) => {
        const element = el as HTMLElement;
        element.style.animation = 'none';
        element.style.transition = 'none';
      });
    } else {
      // Restore normal animations
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
      document.body.classList.remove('reduced-motion');
    }
  }

  private setupMotionToggle(): void {
    // Add a user toggle for motion preferences
    this.motionToggle = document.getElementById('motion-toggle') as HTMLInputElement;
    if (this.motionToggle) {
      this.motionToggle.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.respectsReducedMotion = !target.checked;
        this.updateAnimations();
        
        // Announce change to screen readers
        this.announceMotionChange();
      });
    }
  }

  private announceMotionChange(): void {
    const message = this.respectsReducedMotion 
      ? 'Animations disabled for better accessibility'
      : 'Animations enabled';
    
    if (window.accessibilityModule) {
      window.accessibilityModule.announce(message, 'polite');
    }
  }

  // Safe animation method that respects preferences
  public safeAnimate(element: HTMLElement, animation: Keyframe[], options: AnimationOptions = {}): void {
    if (this.respectsReducedMotion) {
      // Provide instant completion for reduced motion users
      if (options.onComplete) {
        options.onComplete();
      }
      return;
    }

    // Proceed with normal animation
    if (element.animate) {
      const anim = element.animate(animation, {
        duration: options.duration || 300,
        easing: options.easing || 'ease-out',
        ...options
      });
      
      if (options.onComplete) {
        anim.addEventListener('finish', options.onComplete);
      }
      
      if (options.onCancel) {
        anim.addEventListener('cancel', options.onCancel);
      }
    }
  }

  // Fade in with respect to motion preferences
  public safeFadeIn(element: HTMLElement, duration: number = 300): void {
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

  // Fade out with respect to motion preferences
  public safeFadeOut(element: HTMLElement, duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      if (this.respectsReducedMotion) {
        element.style.opacity = '0';
        resolve();
        return;
      }

      this.safeAnimate(element,
        [{ opacity: 1 }, { opacity: 0 }],
        {
          duration,
          easing: 'ease-in',
          onComplete: () => {
            element.style.opacity = '0';
            resolve();
          }
        }
      );
    });
  }

  // Slide in from direction
  public safeSlideIn(element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down', duration: number = 300): void {
    if (this.respectsReducedMotion) {
      element.style.transform = 'none';
      element.style.opacity = '1';
      return;
    }

    const transforms = {
      left: { from: 'translateX(-100%)', to: 'translateX(0)' },
      right: { from: 'translateX(100%)', to: 'translateX(0)' },
      up: { from: 'translateY(-100%)', to: 'translateY(0)' },
      down: { from: 'translateY(100%)', to: 'translateY(0)' }
    };

    const transform = transforms[direction];
    element.style.transform = transform.from;
    element.style.opacity = '0';

    this.safeAnimate(element,
      [
        { transform: transform.from, opacity: 0 },
        { transform: transform.to, opacity: 1 }
      ],
      {
        duration,
        easing: 'ease-out',
        onComplete: () => {
          element.style.transform = transform.to;
          element.style.opacity = '1';
        }
      }
    );
  }

  // Scale animation
  public safeScale(element: HTMLElement, from: number = 0, to: number = 1, duration: number = 300): void {
    if (this.respectsReducedMotion) {
      element.style.transform = `scale(${to})`;
      return;
    }

    element.style.transform = `scale(${from})`;

    this.safeAnimate(element,
      [
        { transform: `scale(${from})` },
        { transform: `scale(${to})` }
      ],
      {
        duration,
        easing: 'ease-out',
        onComplete: () => {
          element.style.transform = `scale(${to})`;
        }
      }
    );
  }

  // Get current motion preferences
  public getMotionPreferences(): MotionPreferences {
    return {
      respectsReducedMotion: this.respectsReducedMotion,
      userOverride: this.motionToggle?.checked || undefined
    };
  }

  // Set motion preferences programmatically
  public setMotionPreferences(preferences: Partial<MotionPreferences>): void {
    if (preferences.respectsReducedMotion !== undefined) {
      this.respectsReducedMotion = preferences.respectsReducedMotion;
      this.updateAnimations();
    }

    if (preferences.userOverride !== undefined && this.motionToggle) {
      this.motionToggle.checked = !preferences.userOverride;
    }
  }

  // Check if motion is currently reduced
  public isMotionReduced(): boolean {
    return this.respectsReducedMotion;
  }

  // Add CSS for reduced motion support
  private injectMotionCSS(): void {
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

    const style = document.createElement('style');
    style.textContent = motionCSS;
    document.head.appendChild(style);
  }
}

// Initialize motion accessibility
export function initMotionAccessibility(): MotionAccessibility {
  console.log('🚀 Initializing MotionAccessibility...');
  const motionAccessibility = new MotionAccessibility();
  
  // Inject CSS
  motionAccessibility['injectMotionCSS']();
  
  return motionAccessibility;
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      (window as Window & { motionAccessibility?: MotionAccessibility }).motionAccessibility = initMotionAccessibility();
    });
  } else {
    (window as Window & { motionAccessibility?: MotionAccessibility }).motionAccessibility = initMotionAccessibility();
  }
} 