export {};
/**
 * Motion and Animation Accessibility Module
 * Respects user preferences for reduced motion and provides alternatives
 */

const DEFAULT_TOGGLE_SELECTOR = 'input[data-motion-toggle], #motion-toggle';
const DEFAULT_LIVE_REGION_ID = 'motion-accessibility-status';
const STORAGE_KEY = 'motion-preference';

export type MotionPreference = 'system' | 'reduce' | 'allow';

export interface MotionPreferences {
  respectsReducedMotion: boolean;
  userOverride?: boolean;
}

export interface MotionAccessibilityOptions {
  toggleSelector?: string;
  liveRegionId?: string;
}

export interface MotionAccessibilityController {
  getPreference(): MotionPreference;
  setPreference(preference: MotionPreference, options?: { announce?: boolean }): void;
  isMotionReduced(): boolean;
  getMotionPreferences(): MotionPreferences;
  setMotionPreferences(preferences: Partial<MotionPreferences>): void;
  safeAnimate(
    element: HTMLElement,
    keyframes: Keyframe[],
    options?: KeyframeAnimationOptions & { onComplete?: () => void; onCancel?: () => void }
  ): void;
  safeFadeIn(element: HTMLElement, duration?: number): void;
  safeFadeOut(element: HTMLElement, duration?: number): Promise<void>;
  safeSlideIn(
    element: HTMLElement,
    direction: 'left' | 'right' | 'up' | 'down',
    duration?: number
  ): void;
  safeScale(element: HTMLElement, from?: number, to?: number, duration?: number): void;
  registerToggles(selector?: string): void;
  destroy(): void;
}

class MotionAccessibility implements MotionAccessibilityController {
  private preference: MotionPreference;
  private reduced: boolean;
  private options: MotionAccessibilityOptions;
  private mediaQuery: MediaQueryList | null = null;
  private mediaQueryHandler: ((event: MediaQueryListEvent) => void) | null = null;
  private liveRegion: HTMLElement | null = null;
  private toggles = new Map<HTMLInputElement, (event: Event) => void>();
  private observer: MutationObserver | null = null;
  private destroyed = false;

  constructor(options: MotionAccessibilityOptions = {}) {
    this.options = options;
    this.preference = this.resolveInitialPreference();
    this.reduced = this.computeEffectiveReduction(this.preference);
    this.applyPreference({ announce: false });
    this.setupLiveRegion();
    this.setupMediaQuery();
    this.registerToggles();
    this.setupToggleObserver();
    this.injectCSS();
  }

  getPreference(): MotionPreference {
    return this.preference;
  }

  setPreference(
    preference: MotionPreference,
    { announce = true }: { announce?: boolean } = {}
  ): void {
    if (this.destroyed) return;

    if (this.preference === preference) {
      if (preference === 'system') {
        this.reduced = this.computeEffectiveReduction(preference);
        this.applyPreference({ announce });
        this.syncToggleStates();
      }
      return;
    }

    this.preference = preference;
    this.reduced = this.computeEffectiveReduction(preference);
    this.persistPreference();
    this.applyPreference({ announce });
    this.syncToggleStates();
  }

  isMotionReduced(): boolean {
    return this.reduced;
  }

  getMotionPreferences(): MotionPreferences {
    return {
      respectsReducedMotion: this.reduced,
      userOverride: this.preference === 'system' ? undefined : this.preference === 'allow',
    };
  }

  setMotionPreferences(preferences: Partial<MotionPreferences>): void {
    if (preferences.respectsReducedMotion !== undefined) {
      this.setPreference(preferences.respectsReducedMotion ? 'reduce' : 'allow');
    }

    if (preferences.userOverride !== undefined) {
      const preference = preferences.userOverride ? 'allow' : 'reduce';
      this.setPreference(preference, { announce: false });
    }
  }

  safeAnimate(
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions & { onComplete?: () => void; onCancel?: () => void } = {}
  ): void {
    if (this.reduced) {
      options.onComplete?.();
      return;
    }

    if (!element.animate) {
      options.onComplete?.();
      return;
    }

    const animation = element.animate(keyframes, options);

    if (options.onComplete) {
      animation.addEventListener('finish', options.onComplete);
    }

    if (options.onCancel) {
      animation.addEventListener('cancel', options.onCancel);
    }
  }

  safeFadeIn(element: HTMLElement, duration: number = 300): void {
    if (this.reduced) {
      element.style.opacity = '1';
      return;
    }

    element.style.opacity = '0';
    this.safeAnimate(element, [{ opacity: 0 }, { opacity: 1 }], {
      duration,
      easing: 'ease-out',
      onComplete: () => {
        element.style.opacity = '1';
      },
    });
  }

  safeFadeOut(element: HTMLElement, duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      if (this.reduced) {
        element.style.opacity = '0';
        resolve();
        return;
      }

      this.safeAnimate(element, [{ opacity: 1 }, { opacity: 0 }], {
        duration,
        easing: 'ease-in',
        onComplete: () => {
          element.style.opacity = '0';
          resolve();
        },
        onCancel: () => resolve(),
      });
    });
  }

  safeSlideIn(
    element: HTMLElement,
    direction: 'left' | 'right' | 'up' | 'down',
    duration: number = 300
  ): void {
    if (this.reduced) {
      element.style.transform = 'none';
      element.style.opacity = '1';
      return;
    }

    const transforms: Record<typeof direction, { from: string; to: string }> = {
      left: { from: 'translateX(-100%)', to: 'translateX(0)' },
      right: { from: 'translateX(100%)', to: 'translateX(0)' },
      up: { from: 'translateY(-100%)', to: 'translateY(0)' },
      down: { from: 'translateY(100%)', to: 'translateY(0)' },
    };

    const transform = transforms[direction];
    element.style.transform = transform.from;
    element.style.opacity = '0';

    this.safeAnimate(
      element,
      [
        { transform: transform.from, opacity: 0 },
        { transform: transform.to, opacity: 1 },
      ],
      {
        duration,
        easing: 'ease-out',
        onComplete: () => {
          element.style.transform = transform.to;
          element.style.opacity = '1';
        },
      }
    );
  }

  safeScale(element: HTMLElement, from: number = 0, to: number = 1, duration: number = 300): void {
    if (this.reduced) {
      element.style.transform = `scale(${to})`;
      return;
    }

    element.style.transform = `scale(${from})`;
    this.safeAnimate(element, [{ transform: `scale(${from})` }, { transform: `scale(${to})` }], {
      duration,
      easing: 'ease-out',
      onComplete: () => {
        element.style.transform = `scale(${to})`;
      },
    });
  }

  registerToggles(selector?: string): void {
    if (this.destroyed || typeof document === 'undefined') return;

    const selectorString = selector ?? this.options.toggleSelector ?? DEFAULT_TOGGLE_SELECTOR;
    if (!selectorString) return;

    const toggles = Array.from(document.querySelectorAll<HTMLInputElement>(selectorString));
    toggles.forEach((toggle) => this.attachToggle(toggle));
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.mediaQuery && this.mediaQueryHandler) {
      if ('removeEventListener' in this.mediaQuery) {
        this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
      } else if ('removeListener' in this.mediaQuery) {
        // @ts-expect-error older browsers
        this.mediaQuery.removeListener(this.mediaQueryHandler);
      }
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.toggles.forEach((handler, toggle) => {
      toggle.removeEventListener('change', handler);
    });
    this.toggles.clear();

    const root = document.documentElement;
    const body = document.body;
    root.style.removeProperty('--animation-duration');
    root.style.removeProperty('--transition-duration');
    delete root.dataset.motionPreference;
    delete root.dataset.motionEffective;
    body.classList.remove('reduced-motion');
  }

  private resolveInitialPreference(): MotionPreference {
    if (typeof window === 'undefined') {
      return 'system';
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as MotionPreference | null;
      if (stored === 'reduce' || stored === 'allow') {
        return stored;
      }
    } catch (error) {
      console.warn('Unable to read saved motion preference', error);
    }

    return 'system';
  }

  private computeEffectiveReduction(preference: MotionPreference): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    if (preference === 'reduce') {
      return true;
    }

    if (preference === 'allow') {
      return false;
    }

    if (!this.mediaQuery) {
      this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    }

    return this.mediaQuery?.matches ?? false;
  }

  private applyPreference({ announce = true }: { announce?: boolean } = {}): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;
    const reduce = this.reduced;

    root.dataset.motionPreference = this.preference;
    root.dataset.motionEffective = reduce ? 'reduce' : 'allow';

    if (reduce) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
      body.classList.add('reduced-motion');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
      body.classList.remove('reduced-motion');
    }

    if (announce) {
      this.announce(reduce ? 'Animations disabled for better accessibility' : 'Animations enabled');
    }
  }

  private setupLiveRegion(): void {
    if (typeof document === 'undefined') return;

    const id = this.options.liveRegionId ?? DEFAULT_LIVE_REGION_ID;
    let region = document.getElementById(id);

    if (!region) {
      region = document.createElement('div');
      region.id = id;
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
    }

    this.liveRegion = region;
  }

  private announce(message: string): void {
    if (!this.liveRegion) {
      this.setupLiveRegion();
    }

    try {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    } catch (error) {
      console.warn('Motion accessibility announcement failed', error);
    }
  }

  private setupMediaQuery(): void {
    if (typeof window === 'undefined' || !('matchMedia' in window)) {
      return;
    }

    this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => {
      if (this.preference !== 'system') return;
      this.reduced = event.matches;
      this.applyPreference();
      this.syncToggleStates();
    };

    if ('addEventListener' in this.mediaQuery) {
      this.mediaQuery.addEventListener('change', handler);
    } else if ('addListener' in this.mediaQuery) {
      // @ts-expect-error older browsers
      this.mediaQuery.addListener(handler);
    }

    this.mediaQueryHandler = handler;
  }

  private setupToggleObserver(): void {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.observer = new MutationObserver(() => {
      this.registerToggles();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  private attachToggle(toggle: HTMLInputElement): void {
    if (this.toggles.has(toggle)) return;

    const handler = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const preference: MotionPreference = target.checked ? 'allow' : 'reduce';
      this.setPreference(preference);
    };

    toggle.checked = !this.reduced;
    toggle.setAttribute('data-motion-state', this.reduced ? 'reduced' : 'allowed');
    toggle.addEventListener('change', handler);
    this.toggles.set(toggle, handler);
  }

  private syncToggleStates(): void {
    for (const toggle of this.toggles.keys()) {
      toggle.checked = !this.reduced;
      toggle.setAttribute('data-motion-state', this.reduced ? 'reduced' : 'allowed');
    }
  }

  private persistPreference(): void {
    if (typeof window === 'undefined') return;

    try {
      if (this.preference === 'system') {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, this.preference);
      }
    } catch (error) {
      console.warn('Failed to persist motion preference', error);
    }
  }

  private injectCSS(): void {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('motion-accessibility-styles');
    if (existing) return;

    const style = document.createElement('style');
    style.id = 'motion-accessibility-styles';
    style.textContent = `
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      .reduced-motion *,
      .reduced-motion *::before,
      .reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;

    document.head.appendChild(style);
  }
}

let singletonController: MotionAccessibility | null = null;

export function initMotionAccessibility(
  options: MotionAccessibilityOptions = {}
): MotionAccessibilityController {
  if (typeof window === 'undefined') {
    throw new Error('initMotionAccessibility must be called in the browser');
  }

  if (singletonController) {
    singletonController.registerToggles(options.toggleSelector);
    return singletonController;
  }

  singletonController = new MotionAccessibility(options);
  return singletonController;
}

export function destroyMotionAccessibility(): void {
  singletonController?.destroy();
  singletonController = null;
}
