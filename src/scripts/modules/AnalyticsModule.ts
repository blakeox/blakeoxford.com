/**
 * Analytics Module - TypeScript version
 * Provides comprehensive analytics tracking for navigation and general event tracking
 */

import type { 
  AnalyticsConfig,
  EventData,
  NavigationData,
  ScrollData,
  FormData,
  SearchData
} from '../../types/analytics';

export class AnalyticsModule {
  private config: AnalyticsConfig;
  private scrollDepth: number = 0;
  private lastScrollTime: number = 0;
  private isInitialized: boolean = false;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      debug: false,
      trackPageViews: true,
      trackClicks: true,
      trackScroll: true,
      excludeSelectors: ['[data-no-track]', '.no-analytics'],
      providers: ['gtm', 'gtag', 'plausible', 'fathom', 'clarity'],
      ...config
    };
    
    this.init();
  }

  private init(): void {
    if (this.config.trackPageViews) {
      this.setupPageViewTracking();
    }
    
    if (this.config.trackClicks) {
      this.setupClickTracking();
    }
    
    if (this.config.trackScroll) {
      this.setupScrollTracking();
    }
    
    this.isInitialized = true;
    
    // Mark as loaded in lazy loader
    if (typeof window !== 'undefined' && window.LazyBundleLoader) {
      window.LazyBundleLoader.markModuleLoaded('analytics');
    }
  }

  /**
   * Track an analytics event using available providers
   */
  public trackEvent(eventName: string, eventData: EventData = {}): void {
    const timestamp = Date.now();
    const enhancedData: EventData = {
      timestamp,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...eventData
    };

    // Google Tag Manager (GTM) - pushes to dataLayer for GTM, Clarity, GA, etc.
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ...enhancedData
      });
    }
    
    // Google Analytics (gtag)
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, enhancedData);
    }
    
    // Plausible Analytics
    else if (typeof window.plausible === 'function') {
      window.plausible(eventName, { props: enhancedData });
    }
    
    // Fathom Analytics
    else if (typeof window.fathom === 'object' && typeof window.fathom?.trackEvent === 'function') {
      window.fathom.trackEvent(eventName, enhancedData);
    }
    
    // Microsoft Clarity (optional, via GTM or direct)
    if (typeof window.clarity === 'function') {
      window.clarity('track', eventName, enhancedData);
    }
    
    // Fallback: log to console for debugging
    if (this.config.debug || this.shouldLogFallback()) {
      console.debug('[Analytics]', eventName, enhancedData);
    }
  }

  /**
   * Track legacy format events
   */
  public trackEventLegacy(params: {
    category: string;
    action: string;
    label?: string;
    value?: number;
  }): void {
    const { category, action, label = '', value } = params;
    
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'custom_event',
        event_category: category,
        event_action: action,
        event_label: label,
        value: value,
      });
    }
  }

  /**
   * Track page view
   */
  public trackPageView(path?: string): void {
    const pagePath = path || window.location.pathname;
    
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'pageview',
        page_path: pagePath,
        page_title: document.title,
        page_url: window.location.href,
        timestamp: Date.now()
      });
    }
    
    // Also track as custom event for other providers
    this.trackEvent('page_view', {
      page_path: pagePath,
      page_title: document.title,
      page_url: window.location.href
    });
  }

  /**
   * Track user interaction
   */
  public trackInteraction(element: string, action: string, data: Record<string, unknown> = {}): void {
    this.trackEvent('user_interaction', {
      element,
      action,
      ...data
    });
  }

  /**
   * Track form submission
   */
  public trackFormSubmission(formName: string, data: FormData = { formName }): void {
    this.trackEvent('form_submission', {
      form_name: formName,
      ...data
    });
  }

  /**
   * Track search query
   */
  public trackSearch(query: string, source: 'search-bar' | 'voice' | 'suggestion' = 'search-bar'): void {
    const searchData: SearchData = {
      query,
      source,
      query_length: query.length
    };
    
    this.trackEvent('search', searchData);
  }

  /**
   * Track navigation event
   */
  public trackNavigation(from: string, to: string, method: 'click' | 'keyboard' | 'programmatic' = 'click'): void {
    const navigationData: NavigationData = {
      from,
      to,
      method
    };
    
    this.trackEvent('navigation', navigationData);
  }

  /**
   * Track scroll depth
   */
  public trackScrollDepth(depth: number, direction: 'up' | 'down'): void {
    const scrollData: ScrollData = {
      depth,
      direction
    };
    
    this.trackEvent('scroll_depth', scrollData);
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(metricName: string, value: number, unit: string = 'ms'): void {
    this.trackEvent('performance', {
      metric_name: metricName,
      value,
      unit
    });
  }

  /**
   * Track error events
   */
  public trackError(errorType: string, errorMessage: string, additionalData: Record<string, unknown> = {}): void {
    this.trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      ...additionalData
    });
  }

  /**
   * Track custom events with type safety
   */
  public trackCustomEvent(eventName: string, data: Record<string, unknown>): void {
    this.trackEvent(eventName, data);
  }

  private setupPageViewTracking(): void {
    // Track initial page view
    this.trackPageView();
    
    // Track navigation changes (for SPA-like behavior)
    let currentPath = window.location.pathname;
    
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        this.trackNavigation(currentPath, window.location.pathname, 'programmatic');
        currentPath = window.location.pathname;
        this.trackPageView();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private setupClickTracking(): void {
    document.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      
      if (this.isExcluded(target)) return;
      
      const element = target.tagName.toLowerCase();
      const id = target.id || '';
      const className = target.className || '';
      const text = target.textContent?.trim().substring(0, 50) || '';
      
      this.trackInteraction(element, 'click', {
        id,
        className,
        text,
        href: (target as HTMLAnchorElement).href || undefined
      });
    });
  }

  private setupScrollTracking(): void {
    let scrollTimeout: NodeJS.Timeout;
    
    const trackScrollDepth = (): void => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      if (scrollPercent > this.scrollDepth) {
        this.scrollDepth = scrollPercent;
        
        // Track at 25%, 50%, 75%, 100%
        if (scrollPercent >= 25 && this.scrollDepth < 50) {
          this.trackScrollDepth(25, 'down');
        } else if (scrollPercent >= 50 && this.scrollDepth < 75) {
          this.trackScrollDepth(50, 'down');
        } else if (scrollPercent >= 75 && this.scrollDepth < 100) {
          this.trackScrollDepth(75, 'down');
        } else if (scrollPercent >= 100) {
          this.trackScrollDepth(100, 'down');
        }
      }
    };

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(trackScrollDepth, 100);
    });
  }

  private isExcluded(element: HTMLElement): boolean {
    return this.config.excludeSelectors?.some(selector => 
      element.matches(selector) || element.closest(selector)
    ) || false;
  }

  private shouldLogFallback(): boolean {
    return !window.dataLayer && 
           typeof window.gtag !== 'function' && 
           typeof window.plausible !== 'function' &&
           typeof window.fathom !== 'object';
  }

  public getProviderInfo(): Record<string, boolean> {
    return {
      gtm: Array.isArray(window.dataLayer),
      gtag: typeof window.gtag === 'function',
      plausible: typeof window.plausible === 'function',
      fathom: typeof window.fathom === 'object',
      clarity: typeof window.clarity === 'function'
    };
  }

  public updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getInitialized(): boolean {
    return this.isInitialized;
  }

  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }
}

// Initialize analytics module
export function initAnalyticsModule(config?: AnalyticsConfig): AnalyticsModule {
  console.log('🚀 Initializing AnalyticsModule...');
  return new AnalyticsModule(config);
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      (window as Window & { analyticsModule?: AnalyticsModule }).analyticsModule = initAnalyticsModule();
    });
  } else {
    (window as Window & { analyticsModule?: AnalyticsModule }).analyticsModule = initAnalyticsModule();
  }
} 