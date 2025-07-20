/**
 * Scroll Effects Module - TypeScript version
 * Provides scroll effects and behaviors for navigation and page transitions
 */

interface ScrollContext {
  ticking?: boolean;
  updateNavbarOnScroll?: () => void;
  onScrollEnd?: () => void;
}

interface ScrollBehaviorOptions {
  threshold?: number;
  debounceDelay?: number;
  enablePageTransitions?: boolean;
  enableLazyLoading?: boolean;
  enableScrollAnimations?: boolean;
}

interface IntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
}



export class ScrollEffects {
  private scrollTimeout: NodeJS.Timeout | null = null;
  private lastScrollTop: number = 0;
  private scrollThreshold: number;
  private debounceDelay: number;
  private config: ScrollBehaviorOptions;
  private observers: IntersectionObserver[] = [];

  constructor(options: ScrollBehaviorOptions = {}) {
    this.config = {
      threshold: 50,
      debounceDelay: 50,
      enablePageTransitions: true,
      enableLazyLoading: true,
      enableScrollAnimations: true,
      ...options
    };
    
    this.scrollThreshold = this.config.threshold || 50;
    this.debounceDelay = this.config.debounceDelay || 50;
  }

  /**
   * Setup scroll effects with requestAnimationFrame throttling
   */
  public setupScrollEffects(context: ScrollContext): void {
    if (!context) return;
    
    const handleScroll = (): void => {
      if (context.ticking) return;
      
      context.ticking = true;
      requestAnimationFrame(() => {
        if (context.updateNavbarOnScroll) {
          context.updateNavbarOnScroll();
        }
        context.ticking = false;
      });
      
      // Handle scroll end event
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      this.scrollTimeout = setTimeout(() => {
        if (context.onScrollEnd) {
          context.onScrollEnd();
        }
      }, 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * Setup scroll behavior for hiding/showing navbar on scroll
   */
  public setupScrollBehavior(navbar: HTMLElement): void {
    if (!navbar) return;
    
    const debounce = <T extends (...args: unknown[]) => unknown>(func: T, wait: number): T => {
      let timeout: NodeJS.Timeout | null = null;
      return ((...args: unknown[]) => {
        const later = () => {
          if (timeout) clearTimeout(timeout);
          func(...args);
        };
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      }) as T;
    };
    
    const handleScroll = debounce(() => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      
      if (Math.abs(this.lastScrollTop - currentScroll) < this.scrollThreshold) return;
      
      if (currentScroll > this.lastScrollTop && currentScroll > 100) {
        // Scrolling down
        navbar.classList.add('nav-hidden');
        navbar.classList.remove('nav-visible');
      } else {
        // Scrolling up
        navbar.classList.add('nav-visible');
        navbar.classList.remove('nav-hidden');
      }
      
      this.lastScrollTop = currentScroll;
    }, this.debounceDelay);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * Setup page transitions with progress indicators
   */
  public setupPageTransitions(): void {
    // Only setup if Navigation API is supported
    if (!('navigation' in window)) return;
    
    // Create progress indicator
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'fixed top-0 left-0 w-full h-1 bg-transparent z-50';
    progressIndicator.id = 'page-transition-progress';
    
    if (document.body) {
      document.body.appendChild(progressIndicator);
    } else {
      console.warn('ScrollEffects: document.body not available, deferring progress indicator creation');
      setTimeout(() => {
        if (document.body) {
          document.body.appendChild(progressIndicator);
        }
      }, 100);
    }
    
    // Setup click handlers for internal links
    const internalLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]:not([target="_blank"])');
    
    internalLinks.forEach(link => {
      link.addEventListener('click', (event: MouseEvent) => {
        // Allow modified clicks (ctrl+click, etc.)
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Skip downloads, anchors, and external links
        if (link.hasAttribute('download') || href.includes('#') || link.hasAttribute('target')) return;
        
        event.preventDefault();
        
        // Add exit transition class
        document.body.classList.add('page-transition-exit');
        
        // Animate progress indicator
        const indicator = document.getElementById('page-transition-progress');
        if (indicator) {
          indicator.style.background = 'linear-gradient(to right, var(--color-accent) 0%, var(--color-accent-light) 50%, var(--color-accent) 100%)';
          indicator.style.width = '0%';
          indicator.style.opacity = '1';
          
          // Animate progress
          setTimeout(() => {
            indicator.style.width = '60%';
            indicator.style.transition = 'width 150ms ease-out';
          }, 10);
          
          setTimeout(() => {
            indicator.style.width = '80%';
            indicator.style.transition = 'width 800ms ease-out';
          }, 150);
        }
        
        // Navigate after transition
        setTimeout(() => {
          window.location.href = href;
        }, 250);
      });
    });
    
    // Handle page show event
    window.addEventListener('pageshow', () => {
      document.body.classList.add('page-transition-enter');
      
      const indicator = document.getElementById('page-transition-progress');
      if (indicator) {
        indicator.style.width = '100%';
        indicator.style.transition = 'width 200ms ease-out';
        
        setTimeout(() => {
          indicator.style.opacity = '0';
          indicator.style.transition = 'opacity 300ms ease-out';
        }, 200);
      }
      
      setTimeout(() => {
        document.body.classList.remove('page-transition-enter');
      }, 300);
    });
  }

  /**
   * Smooth scroll to element
   */
  public smoothScrollTo(element: HTMLElement, offset: number = 0): void {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  /**
   * Scroll to top of page
   */
  public scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Check if element is in viewport
   */
  public isInViewport(element: HTMLElement, threshold: number = 0.1): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    return (
      rect.top <= windowHeight * (1 - threshold) &&
      rect.bottom >= windowHeight * threshold
    );
  }

  /**
   * Setup intersection observer for elements
   */
  public setupIntersectionObserver(
    elements: NodeListOf<Element> | Element[],
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverOptions = {}
  ): void {
    const observerOptions: IntersectionObserverInit = {
      threshold: options.threshold ?? 0.1,
      rootMargin: options.rootMargin ?? 'var(--observer-root-margin)',
      ...options
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(callback);
    }, observerOptions);

    elements.forEach(element => observer.observe(element));
    this.observers.push(observer);
  }

  /**
   * Setup lazy loading for images
   */
  public setupLazyLoading(selector: string = 'img[data-src]'): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback for older browsers
      this.loadAllImages(selector);
      return;
    }

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          this.loadImage(img);
          imageObserver.unobserve(img);
        }
      });
    });

    const images = document.querySelectorAll<HTMLImageElement>(selector);
    images.forEach(img => imageObserver.observe(img));
    this.observers.push(imageObserver);
  }

  /**
   * Setup scroll animations
   */
  public setupScrollAnimations(selector: string = '[data-animate]'): void {
    if (!('IntersectionObserver' in window)) return;

    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          this.animateElement(element);
          animationObserver.unobserve(element);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: 'var(--animation-root-margin)'
    });

    const elements = document.querySelectorAll<HTMLElement>(selector);
    elements.forEach(element => animationObserver.observe(element));
    this.observers.push(animationObserver);
  }

  /**
   * Load a single image
   */
  private loadImage(img: HTMLImageElement): void {
    const src = img.getAttribute('data-src');
    if (!src) return;

    img.src = src;
    img.classList.add('loaded');
    img.removeAttribute('data-src');
  }

  /**
   * Load all images (fallback)
   */
  private loadAllImages(selector: string): void {
    const images = document.querySelectorAll<HTMLImageElement>(selector);
    images.forEach(img => this.loadImage(img));
  }

  /**
   * Animate an element
   */
  private animateElement(element: HTMLElement): void {
    const animationType = element.getAttribute('data-animate') || 'fade-in';
    const duration = element.getAttribute('data-duration') || '600ms';
    const delay = element.getAttribute('data-delay') || '0ms';
    const easing = element.getAttribute('data-easing') || 'ease-out';

    element.style.transition = `all ${duration} ${easing} ${delay}`;
    element.classList.add(`animate-${animationType}`);
  }

  /**
   * Get current scroll position
   */
  public getScrollPosition(): { x: number; y: number } {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    };
  }

  /**
   * Get scroll direction
   */
  public getScrollDirection(): 'up' | 'down' | null {
    const currentScroll = this.getScrollPosition().y;
    const direction = currentScroll > this.lastScrollTop ? 'down' : 'up';
    this.lastScrollTop = currentScroll;
    return direction;
  }

  /**
   * Get scroll percentage
   */
  public getScrollPercentage(): number {
    const scrollTop = this.getScrollPosition().y;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round((scrollTop / docHeight) * 100);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ScrollBehaviorOptions>): void {
    this.config = { ...this.config, ...newConfig };
    this.scrollThreshold = this.config.threshold || 50;
    this.debounceDelay = this.config.debounceDelay || 50;
  }

  /**
   * Get current configuration
   */
  public getConfig(): ScrollBehaviorOptions {
    return { ...this.config };
  }

  /**
   * Cleanup all observers and event listeners
   */
  public cleanup(): void {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Clear scroll timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }
}

// Initialize scroll effects
export function initScrollEffects(options?: ScrollBehaviorOptions): ScrollEffects {
  console.log('🚀 Initializing ScrollEffects...');
  return new ScrollEffects(options);
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      (window as Window & { scrollEffects?: ScrollEffects }).scrollEffects = initScrollEffects();
    });
  } else {
    (window as Window & { scrollEffects?: ScrollEffects }).scrollEffects = initScrollEffects();
  }
} 