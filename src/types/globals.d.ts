export {};

declare global {
  interface ZarazClient {
    track?: (event: string, props?: Record<string, unknown>) => void | Promise<void>;
    set?: (key: string, value: unknown) => void;
    ecommerce?: (action: string, payload?: Record<string, unknown>) => void;
  }

  interface Window {
    clarity?: (...args: unknown[]) => void;
    /** Present when Zaraz gtag compatibility mode is enabled. */
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    zaraz?: ZarazClient;
  }
}
