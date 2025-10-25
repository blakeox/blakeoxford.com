import type { LazyBundleLoader } from '../scripts/utils/LazyLoader';

export {};

declare global {

  type AccessibilityPoliteness = 'polite' | 'assertive';

  interface AccessibilityModule {
    announce(message: string, politeness?: AccessibilityPoliteness): void;
  }

  interface Window {
    LazyBundleLoader?: LazyBundleLoader;
    accessibilityModule?: AccessibilityModule;
    clarity?: (...args: unknown[]) => void;
    fathom?: {
      trackEvent: (action: string, data?: Record<string, unknown>) => void;
    };
    plausible?: (event: string, options?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
    performanceMonitor?: unknown;
    modernNavBar?: unknown;
  }
}
