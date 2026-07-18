import type { LazyBundleLoader } from '../scripts/utils/LazyLoader';

export {};

declare global {
  type AccessibilityPoliteness = 'polite' | 'assertive';

  interface AccessibilityModule {
    announce(message: string, politeness?: AccessibilityPoliteness): void;
  }

  interface ZarazClient {
    track?: (event: string, props?: Record<string, unknown>) => void | Promise<void>;
    set?: (key: string, value: unknown) => void;
    ecommerce?: (action: string, payload?: Record<string, unknown>) => void;
  }

  interface Window {
    LazyBundleLoader?: LazyBundleLoader;
    accessibilityModule?: AccessibilityModule;
    clarity?: (...args: unknown[]) => void;
    dataLayer?: Array<Record<string, unknown>>;
    fathom?: {
      trackEvent: (action: string, data?: Record<string, unknown>) => void;
    };
    plausible?: (event: string, options?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
    performanceMonitor?: unknown;
    modernNavBar?: unknown;
    zaraz?: ZarazClient;
  }
}
