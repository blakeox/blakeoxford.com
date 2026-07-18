/**
 * Progressive Enhancement Framework - TypeScript version
 * Ensures functionality works without JavaScript and enhances when available
 */

import { logger } from '../../utils/logger';

interface EnhancementConfig {
  enableForms?: boolean;
  enableNavigation?: boolean;
  enableContent?: boolean;
  enableAccessibility?: boolean;
  enablePerformance?: boolean;
  enableLazyLoading?: boolean;
}

interface FeatureDetection {
  intersectionObserver: boolean;
  serviceWorker: boolean;
  webGL: boolean;
  webAudio: boolean;
  batteryAPI: boolean;
  networkAPI: boolean;
  motionAPI: boolean;
}

interface PerformanceMetrics {
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  batteryLevel?: number;
  batteryCharging?: boolean;
}

export class ProgressiveEnhancement {
  private features: Map<string, boolean> = new Map();
  private config: EnhancementConfig;
  private featureDetection: FeatureDetection;
  private performanceMetrics: PerformanceMetrics = {};

  constructor(config: EnhancementConfig = {}) {
    this.config = {
      enableForms: true,
      enableNavigation: true,
      enableContent: true,
      enableAccessibility: true,
      enablePerformance: true,
      enableLazyLoading: true,
      ...config,
    };

    this.featureDetection = this.detectFeatures();
    this.init();
  }

  private detectFeatures(): FeatureDetection {
    return {
      intersectionObserver: 'IntersectionObserver' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webGL: this.detectWebGL(),
      webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
      batteryAPI: 'getBattery' in navigator,
      networkAPI: 'connection' in navigator,
      motionAPI: 'DeviceMotionEvent' in window,
    };
  }

  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  private init(): void {
    // Mark that JavaScript is available
    document.documentElement.classList.add('js-enabled');
    document.documentElement.classList.remove('no-js');

    // Initialize core enhancements
    if (this.config.enableForms) this.enhanceForms();
    if (this.config.enableNavigation) this.enhanceNavigation();
    if (this.config.enableContent) this.enhanceContent();
    if (this.config.enableAccessibility) this.setupAccessibilityEnhancements();
    if (this.config.enablePerformance) this.setupPerformanceEnhancements();

    logger.debug('ProgressiveEnhancement initialized with features:', this.featureDetection);
  }

  private enhanceForms(): void {
    const forms = document.querySelectorAll<HTMLFormElement>('form');

    forms.forEach((form) => {
      // Enhance form with real-time validation only if JS is available
      form.classList.add('js-enhanced');

      // Add loading states
      const submitButtons = form.querySelectorAll<HTMLButtonElement>('button[type="submit"]');
      submitButtons.forEach((button) => {
        button.addEventListener('click', () => {
          button.setAttribute('aria-busy', 'true');
          button.classList.add('loading');
        });
      });

      // Enhanced error handling
      form.addEventListener(
        'invalid',
        (e: Event) => {
          e.preventDefault();
          const target = e.target as HTMLFormElement;
          this.showFieldError(target);
        },
        true
      );
    });
  }

  private enhanceNavigation(): void {
    // Progressive mobile menu enhancement
    const mobileToggle = document.querySelector<HTMLElement>('#nav-toggle');
    const mobileMenu = document.querySelector<HTMLElement>('#nav-mobile-links');

    if (mobileToggle && mobileMenu) {
      // Remove CSS-only fallbacks and add JS enhancements
      mobileMenu.classList.add('js-enhanced');

      // Add ARIA attributes for enhanced experience
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.setAttribute('aria-controls', 'nav-mobile-links');
    }
  }

  private enhanceContent(): void {
    // Progressive loading for images
    const images = document.querySelectorAll<HTMLImageElement>('img[data-src]');

    if (this.featureDetection.intersectionObserver && this.config.enableLazyLoading) {
      this.setupLazyLoading(images);
    } else {
      // Fallback: load all images immediately
      images.forEach((img) => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.add('loaded');
        }
      });
    }
  }

  private setupAccessibilityEnhancements(): void {
    // Enhanced keyboard navigation
    this.setupEnhancedKeyboardNav();

    // Screen reader improvements
    this.setupScreenReaderEnhancements();

    // Motion preference handling
    this.setupMotionPreferences();
  }

  private setupEnhancedKeyboardNav(): void {
    // Skip link improvements
    const skipLinks = document.querySelectorAll<HTMLElement>('.skip-link');
    skipLinks.forEach((link) => {
      link.addEventListener('focus', () => {
        link.style.transform = 'translateY(0)';
      });

      link.addEventListener('blur', () => {
        link.style.transform = 'translateY(-100%)';
      });
    });

    // Arrow key navigation for lists
    const navigableLists = document.querySelectorAll<HTMLElement>('[role="list"], ul, ol');
    navigableLists.forEach((list) => {
      this.addArrowKeyNavigation(list);
    });
  }

  private addArrowKeyNavigation(list: HTMLElement): void {
    const items = Array.from(list.querySelectorAll<HTMLElement>('li'));

    items.forEach((item, index) => {
      item.addEventListener('keydown', (e: KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowDown': {
            e.preventDefault();
            const next = (index + 1) % items.length;
            items[next].focus();
            break;
          }
          case 'ArrowUp': {
            e.preventDefault();
            const prev = (index - 1 + items.length) % items.length;
            items[prev].focus();
            break;
          }
        }
      });
    });
  }

  private setupScreenReaderEnhancements(): void {
    // Live region for dynamic content
    if (!document.querySelector('#live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';

      if (document.body) {
        document.body.appendChild(liveRegion);
      } else {
        console.warn(
          'ProgressiveEnhancement: document.body not available, deferring live region creation'
        );
        setTimeout(() => {
          if (document.body) {
            document.body.appendChild(liveRegion);
          }
        }, 100);
      }
    }

    // Enhanced form announcements
    const forms = document.querySelectorAll<HTMLFormElement>('form');
    forms.forEach((form) => {
      form.addEventListener('submit', () => {
        this.announce('Form submitted. Please wait for confirmation.');
      });
    });
  }

  private setupMotionPreferences(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMotionPreference = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion');
        this.announce('Animations reduced for accessibility.');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    };

    prefersReducedMotion.addEventListener('change', handleMotionPreference);
    // Initial check
    if (prefersReducedMotion.matches) {
      document.documentElement.classList.add('reduce-motion');
      this.announce('Animations reduced for accessibility.');
    }
  }

  private setupPerformanceEnhancements(): void {
    // Connection-aware loading
    if (this.featureDetection.networkAPI) {
      const connection = (navigator as Navigator & { connection?: any }).connection;
      if (connection) {
        this.performanceMetrics.connectionType = connection.effectiveType;
        this.performanceMetrics.effectiveType = connection.effectiveType;
        this.performanceMetrics.downlink = connection.downlink;
        this.performanceMetrics.rtt = connection.rtt;

        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          document.documentElement.classList.add('slow-connection');
          this.disableHeavyAnimations();
        }
      }
    }

    // Battery API consideration
    if (this.featureDetection.batteryAPI) {
      (navigator as Navigator & { getBattery?: () => Promise<any> })
        .getBattery?.()
        .then((battery: any) => {
          this.performanceMetrics.batteryLevel = battery.level;
          this.performanceMetrics.batteryCharging = battery.charging;

          if (battery.level < 0.2) {
            document.documentElement.classList.add('low-battery');
            this.enablePowerSavingMode();
          }
        });
    }
  }

  private setupLazyLoading(images: NodeListOf<HTMLImageElement>): void {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }

  private showFieldError(field: HTMLFormElement): void {
    // Remove existing error
    this.clearFieldError(field);

    // Add error styling
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');

    // Create error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error text-error text-sm mt-1';
    errorElement.textContent = this.getFieldErrorMessage(field);
    errorElement.setAttribute('role', 'alert');

    field.parentNode?.appendChild(errorElement);

    // Focus field for accessibility
    field.focus();
  }

  private clearFieldError(field: HTMLFormElement): void {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');

    const existingError = field.parentNode?.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  private getFieldErrorMessage(field: HTMLFormElement): string {
    const label = this.getFieldLabel(field);

    if (field.validity.valueMissing) {
      return `${label} is required`;
    }

    if (field.validity.typeMismatch) {
      if (field.type === 'email') {
        return `${label} must be a valid email address`;
      }
      if (field.type === 'url') {
        return `${label} must be a valid URL`;
      }
    }

    return field.validationMessage || `${label} is invalid`;
  }

  private getFieldLabel(field: HTMLFormElement): string {
    const label = field.labels?.[0]?.textContent;
    const placeholder = field.getAttribute('placeholder');
    const ariaLabel = field.getAttribute('aria-label');
    const name = field.name || field.id;

    return label || placeholder || ariaLabel || name || 'Field';
  }

  private announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (window.accessibilityModule) {
      window.accessibilityModule.announce(message, priority);
    }
  }

  private disableHeavyAnimations(): void {
    document.documentElement.classList.add('disable-heavy-animations');
  }

  private enablePowerSavingMode(): void {
    document.documentElement.classList.add('power-saving-mode');
  }

  // Public API methods
  public getFeatureDetection(): FeatureDetection {
    return { ...this.featureDetection };
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  public isFeatureSupported(feature: keyof FeatureDetection): boolean {
    return this.featureDetection[feature];
  }

  public updateConfig(newConfig: Partial<EnhancementConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public enhanceElement(element: HTMLElement, enhancementType: string): void {
    element.classList.add(`js-enhanced-${enhancementType}`);
    this.features.set(enhancementType, true);
  }

  public isEnhanced(enhancementType: string): boolean {
    return this.features.get(enhancementType) || false;
  }
}

// Initialize progressive enhancement
export function initProgressiveEnhancement(config?: EnhancementConfig): ProgressiveEnhancement {
  logger.debug('Initializing ProgressiveEnhancement...');
  return new ProgressiveEnhancement(config);
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      (
        window as Window & { progressiveEnhancement?: ProgressiveEnhancement }
      ).progressiveEnhancement = initProgressiveEnhancement();
    });
  } else {
    (
      window as Window & { progressiveEnhancement?: ProgressiveEnhancement }
    ).progressiveEnhancement = initProgressiveEnhancement();
  }
}
