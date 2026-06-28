/**
 * Accessibility Module - TypeScript Version
 * Provides comprehensive accessibility features with full type safety
 */

import type { 
  AccessibilityPreferences, 
  AccessibilityConfig,
  FocusTrap 
} from '../../types/accessibility';

// Extend the base config for module-specific needs
export interface AccessibilityModuleConfig extends AccessibilityConfig {
  autoInit?: boolean;
}

export class AccessibilityModule {
  private preferences: AccessibilityPreferences;
  private liveRegion: HTMLElement | null = null;
  private config: AccessibilityModuleConfig;

  constructor(config: AccessibilityModuleConfig = {}) {
    this.config = {
      enableLiveRegion: true,
      enableSkipLink: true,
      enableKeyboardShortcuts: true,
      enableFocusManagement: true,
      enableLandmarkRoles: true,
      ...config
    };
    
    this.preferences = this.loadPreferences();
    this.init();
  }

  private init(): void {
    if (this.config.enableLiveRegion) {
      this.createLiveRegion();
    }
    
    if (this.config.enableSkipLink) {
      this.addSkipToContentLink();
    }
    
    if (this.config.enableKeyboardShortcuts) {
      this.setupKeyboardShortcuts();
    }
    
    if (this.config.enableLandmarkRoles) {
      this.addLandmarkRoles();
    }
    
    this.applyPreferences();
    
    // Mark as loaded in lazy loader
    if (typeof window !== 'undefined' && window.LazyBundleLoader) {
      window.LazyBundleLoader.markModuleLoaded('accessibility');
    }
  }

  private loadPreferences(): AccessibilityPreferences {
    const defaults: AccessibilityPreferences = {
      fontSize: 'medium',
      fontFamily: 'default',
      lineHeight: 'normal',
      letterSpacing: 'normal',
      colorScheme: 'auto',
      highContrast: false,
      reducedMotion: this.detectReducedMotion(),
      soundEnabled: true,
      voiceAnnouncements: true,
      focusIndicator: 'enhanced',
      cursorSize: 'default',
      underlineLinks: false,
      hideImages: false,
      simplifyLayout: false
    };

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('accessibility-preferences');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }
    
    return defaults;
  }

  public savePreferences(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
    }
  }

  private addSkipToContentLink(): void {
    if (typeof document === 'undefined') return;
    
    // Check if skip link already exists
    if (document.getElementById('skip-to-content')) {
      return;
    }
    
    // Create skip link
    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-content';
    skipLink.href = '#main';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-accent focus:text-on-accent focus:rounded';
    
    // Insert at the beginning of body
    if (document.body) {
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
  }

  private createLiveRegion(): void {
    if (typeof document === 'undefined') return;
    
    this.liveRegion = document.createElement('div');
    this.liveRegion.id = 'live-region';
    this.liveRegion.className = 'sr-only';
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    
    if (document.body) {
      document.body.appendChild(this.liveRegion);
    }
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) {
      this.createLiveRegion();
    }
    
    if (this.liveRegion) {
      this.liveRegion.setAttribute('aria-live', priority);
      this.liveRegion.textContent = message;
      
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = '';
        }
      }, 1000);
    }
  }

  public enhanceFocusManagement(
    element: HTMLElement, 
    trapFocus: (event: KeyboardEvent) => void, 
    isMenuOpen: () => boolean
  ): void {
    if (!element) return;
    
    element.addEventListener('keydown', (e) => {
      if (isMenuOpen() && e.key === 'Tab') {
        trapFocus(e);
      }
    });
  }

  public createFocusTrap(element: HTMLElement): FocusTrap | null {
    if (!element) return null;
    
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    
    if (focusableElements.length === 0) return null;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    element.addEventListener('keydown', handleKeyDown);
    
    return {
      activate: () => firstElement.focus(),
      deactivate: () => element.removeEventListener('keydown', handleKeyDown),
      handleKeyDown
    };
  }

  private setupKeyboardShortcuts(): void {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('keydown', (e) => {
      // Alt + A: Toggle accessibility panel
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        this.toggleAccessibilityPanel();
      }
      
      // Alt + T: Toggle theme
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        this.toggleTheme();
      }
      
      // Alt + F: Cycle font size
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        this.cycleFontSize();
      }
    });
  }

  private applyPreferences(): void {
    Object.entries(this.preferences).forEach(([key, value]) => {
      this.applyPreference(key as keyof AccessibilityPreferences, value);
    });
  }

  private applyPreference(key: keyof AccessibilityPreferences, value: AccessibilityPreferences[keyof AccessibilityPreferences]): void {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    switch (key) {
      case 'fontSize':
        if (typeof value === 'string') {
          root.style.setProperty('--font-size-scale', this.getFontSizeScale(value));
        }
        break;
      case 'fontFamily':
        if (typeof value === 'string') {
          root.style.setProperty('--font-family', this.getFontFamily(value));
        }
        break;
      case 'lineHeight':
        if (typeof value === 'string') {
          root.style.setProperty('--line-height', this.getLineHeight(value));
        }
        break;
      case 'focusIndicator':
        if (typeof value === 'string') {
          root.style.setProperty('--focus-indicator', this.getFocusIndicator(value));
        }
        break;
      case 'highContrast':
        if (typeof value === 'boolean') {
          root.classList.toggle('high-contrast', value);
        }
        break;
      case 'reducedMotion':
        if (typeof value === 'boolean') {
          root.classList.toggle('reduced-motion', value);
        }
        break;
      case 'underlineLinks':
        if (typeof value === 'boolean') {
          root.classList.toggle('underline-links', value);
        }
        break;
      case 'hideImages':
        if (typeof value === 'boolean') {
          root.classList.toggle('hide-images', value);
        }
        break;
      case 'simplifyLayout':
        if (typeof value === 'boolean') {
          root.classList.toggle('simplify-layout', value);
        }
        break;
    }
  }

  private getFontSizeScale(size: string): string {
    const scales = {
      'small': '0.875',
      'medium': '1',
      'large': '1.125',
      'extra-large': '1.25'
    };
    return scales[size as keyof typeof scales] || '1';
  }

  private getFontFamily(family: string): string {
    const families = {
      'default': 'system-ui, -apple-system, sans-serif',
      'sans-serif': 'system-ui, -apple-system, sans-serif',
      'serif': 'Georgia, serif',
      'monospace': 'Consolas, Monaco, monospace',
      'dyslexic': 'OpenDyslexic, system-ui, sans-serif'
    };
    return families[family as keyof typeof families] || families.default;
  }

  private getLineHeight(height: string): string {
    const heights = {
      'tight': '1.25',
      'normal': '1.5',
      'relaxed': '1.75',
      'loose': '2'
    };
    return heights[height as keyof typeof heights] || '1.5';
  }

  private getFocusIndicator(indicator: string): string {
    const indicators = {
      'default': 'var(--focus-indicator-default)',
      'enhanced': 'var(--focus-indicator-enhanced)',
      'high-visibility': 'var(--focus-indicator-high-visibility)'
    };
    return indicators[indicator as keyof typeof indicators] || indicators.enhanced;
  }

  public toggleAccessibilityPanel(): void {
    // Implementation for accessibility panel toggle
    this.announce('Accessibility panel toggled');
  }

  public toggleTheme(): void {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    
    if (isDark) {
      root.classList.remove('dark');
      this.announce('Switched to light theme');
    } else {
      root.classList.add('dark');
      this.announce('Switched to dark theme');
    }
  }

  public cycleFontSize(): void {
    const sizes: AccessibilityPreferences['fontSize'][] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.preferences.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    
    this.updatePreference('fontSize', sizes[nextIndex]);
    this.announce(`Font size changed to ${sizes[nextIndex]}`);
  }

  private detectReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private addLandmarkRoles(): void {
    if (typeof document === 'undefined') return;
    
    // Add landmark roles to main sections
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
    }
    
    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
    }
    
    const header = document.querySelector('header');
    if (header && !header.getAttribute('role')) {
      header.setAttribute('role', 'banner');
    }
    
    const footer = document.querySelector('footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
    }
  }

  public highlightActiveLink(): void {
    if (typeof document === 'undefined') return;
    
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('nav a[href]');
    
    links.forEach(link => {
      const href = (link as HTMLAnchorElement).getAttribute('href');
      if (href === currentPath) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  public getPreferences(): AccessibilityPreferences {
    return { ...this.preferences };
  }

  public updatePreference<K extends keyof AccessibilityPreferences>(
    key: K, 
    value: AccessibilityPreferences[K]
  ): void {
    this.preferences[key] = value;
    this.applyPreference(key, value);
    this.savePreferences();
  }
}

// Initialize accessibility module
export function initAccessibilityModule(config?: AccessibilityModuleConfig): AccessibilityModule {
  return new AccessibilityModule(config);
}

// Export for global use
if (typeof window !== 'undefined') {
  (window as Window & { AccessibilityModule?: typeof AccessibilityModule; initAccessibilityModule?: typeof initAccessibilityModule }).AccessibilityModule = AccessibilityModule;
  (window as Window & { AccessibilityModule?: typeof AccessibilityModule; initAccessibilityModule?: typeof initAccessibilityModule }).initAccessibilityModule = initAccessibilityModule;
} 
