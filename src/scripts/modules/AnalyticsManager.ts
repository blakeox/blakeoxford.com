/**
 * Analytics Manager - TypeScript version
 * Handles analytics tracking with privacy considerations and performance optimization
 */

interface AnalyticsConfig {
  enableTracking?: boolean;
  respectDNT?: boolean;
  anonymizeIP?: boolean;
  trackPerformance?: boolean;
  trackErrors?: boolean;
  trackUserJourney?: boolean;
  debugMode?: boolean;
}

interface TrackingEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

interface UserJourney {
  pageViews: string[];
  interactions: TrackingEvent[];
  sessionDuration: number;
  startTime: number;
}

export class AnalyticsManager {
  private config: AnalyticsConfig;
  private sessionId: string;
  private events: TrackingEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private userJourney: UserJourney;
  private isInitialized = false;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enableTracking: true,
      respectDNT: true,
      anonymizeIP: true,
      trackPerformance: true,
      trackErrors: true,
      trackUserJourney: true,
      debugMode: false,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.userJourney = {
      pageViews: [],
      interactions: [],
      sessionDuration: 0,
      startTime: Date.now()
    };

    this.init();
  }

  private init(): void {
    // Check if tracking should be disabled
    if (!this.shouldTrack()) {
      console.log('📊 Analytics tracking disabled (DNT or config)');
      return;
    }

    this.setupEventListeners();
    this.trackPageView();
    
    if (this.config.trackPerformance) {
      this.setupPerformanceTracking();
    }

    if (this.config.trackErrors) {
      this.setupErrorTracking();
    }

    this.isInitialized = true;
    console.log('📊 AnalyticsManager initialized');
  }

  private shouldTrack(): boolean {
    if (!this.config.enableTracking) return false;
    
    if (this.config.respectDNT) {
      const dnt = navigator.doNotTrack || (window as Window & { doNotTrack?: string }).doNotTrack;
      if (dnt === '1' || dnt === 'yes') return false;
    }

    return true;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // Track navigation events
    this.trackNavigationEvents();
    
    // Track form interactions
    this.trackFormEvents();
    
    // Track search interactions
    this.trackSearchEvents();
    
    // Track theme changes
    this.trackThemeEvents();
    
    // Track scroll depth
    this.trackScrollDepth();
  }

  private trackNavigationEvents(): void {
    const navLinks = document.querySelectorAll<HTMLElement>('a[href]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e: Event) => {
        const href = (e.currentTarget as HTMLAnchorElement).href;
        const text = (e.currentTarget as HTMLAnchorElement).textContent?.trim();
        
        this.trackEvent('Navigation', 'Click', text || href, undefined, {
          href,
          linkType: this.getLinkType(href)
        });
      });
    });
  }

  private trackFormEvents(): void {
    const forms = document.querySelectorAll<HTMLFormElement>('form');
    
    forms.forEach(form => {
      // Track form submissions
      form.addEventListener('submit', () => {
        const formId = form.id || form.className || 'unknown';
        this.trackEvent('Form', 'Submit', formId);
      });

      // Track form field interactions
      const fields = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');
      fields.forEach(field => {
        field.addEventListener('focus', () => {
          this.trackEvent('Form', 'Field Focus', field.name || field.id || 'unknown');
        });

        field.addEventListener('blur', () => {
          this.trackEvent('Form', 'Field Blur', field.name || field.id || 'unknown');
        });
      });
    });
  }

  private trackSearchEvents(): void {
    const searchInput = document.querySelector<HTMLInputElement>('#search-input');
    const searchToggle = document.querySelector<HTMLElement>('#search-toggle');
    
    if (searchToggle) {
      searchToggle.addEventListener('click', () => {
        this.trackEvent('Search', 'Open Overlay');
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        if (value.length > 2) {
          this.trackEvent('Search', 'Query', value, value.length);
        }
      });

      searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const value = (e.target as HTMLInputElement).value;
          this.trackEvent('Search', 'Submit', value);
        }
      });
    }
  }

  private trackThemeEvents(): void {
    const themeToggle = document.querySelector<HTMLElement>('#theme-toggle');
    
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        this.trackEvent('Theme', 'Toggle', isDark ? 'dark' : 'light');
      });
    }
  }

  private trackScrollDepth(): void {
    let maxScrollDepth = 0;
    const trackScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        
        // Track at 25%, 50%, 75%, 100%
        if (scrollPercent >= 25 && maxScrollDepth < 50) {
          this.trackEvent('Engagement', 'Scroll Depth', '25%');
        } else if (scrollPercent >= 50 && maxScrollDepth < 75) {
          this.trackEvent('Engagement', 'Scroll Depth', '50%');
        } else if (scrollPercent >= 75 && maxScrollDepth < 100) {
          this.trackEvent('Engagement', 'Scroll Depth', '75%');
        } else if (scrollPercent >= 100) {
          this.trackEvent('Engagement', 'Scroll Depth', '100%');
        }
      }
    };

    window.addEventListener('scroll', this.throttle(trackScroll, 1000));
  }

  private setupPerformanceTracking(): void {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.trackPerformanceMetrics();
      }, 0);
    });

    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      this.trackCoreWebVitals();
    }
  }

  private trackPerformanceMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.addPerformanceMetric('DOM Content Loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
      this.addPerformanceMetric('Page Load', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
      this.addPerformanceMetric('First Paint', navigation.responseEnd - navigation.fetchStart, 'ms');
    }

    // Track resource loading
    const resources = performance.getEntriesByType('resource');
    resources.forEach(resource => {
      this.addPerformanceMetric(`Resource: ${resource.name}`, resource.duration, 'ms');
    });
  }

  private trackCoreWebVitals(): void {
    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.addPerformanceMetric('LCP', lastEntry.startTime, 'ms');
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        const firstInputEntry = entry as PerformanceEventTiming;
        this.addPerformanceMetric('FID', firstInputEntry.processingStart - firstInputEntry.startTime, 'ms');
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value || 0;
        }
      });
      this.addPerformanceMetric('CLS', clsValue, 'score');
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }

  private setupErrorTracking(): void {
    // Track JavaScript errors
    window.addEventListener('error', (e: ErrorEvent) => {
      this.trackEvent('Error', 'JavaScript', e.message, undefined, {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
      this.trackEvent('Error', 'Promise Rejection', e.reason?.message || 'Unknown', undefined, {
        reason: e.reason
      });
    });

    // Track resource loading errors
    window.addEventListener('error', (e: ErrorEvent) => {
      if (e.target && e.target !== window) {
        const target = e.target as HTMLElement;
        this.trackEvent('Error', 'Resource Load', target.tagName, undefined, {
          src: (target as HTMLImageElement).src || (target as HTMLScriptElement).src,
          tagName: target.tagName
        });
      }
    }, true);
  }

  public trackEvent(
    category: string, 
    action: string, 
    label?: string, 
    value?: number,
    customData?: Record<string, unknown>
  ): void {
    if (!this.isInitialized || !this.shouldTrack()) return;

    const event: TrackingEvent = {
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...customData
    };

    this.events.push(event);
    this.userJourney.interactions.push(event);

    if (this.config.debugMode) {
      console.log('📊 Analytics Event:', event);
    }

    // Send to analytics service (if configured)
    this.sendToAnalytics(event);
  }

  public trackPageView(page?: string): void {
    const currentPage = page || window.location.pathname;
    this.userJourney.pageViews.push(currentPage);
    
    this.trackEvent('Page View', 'View', currentPage, undefined, {
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    });
  }

  public trackNavigation(from: string, to: string, method: string): void {
    this.trackEvent('Navigation', method, `${from} → ${to}`, undefined, {
      from,
      to,
      method
    });
  }

  private addPerformanceMetric(name: string, value: number, unit: string): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now()
    };

    this.performanceMetrics.push(metric);

    if (this.config.debugMode) {
      console.log('📊 Performance Metric:', metric);
    }
  }

  private sendToAnalytics(event: TrackingEvent): void {
    // Send to Google Analytics if available
    if (typeof window.gtag === 'function') {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameters: event
      });
    }

    // Send to custom analytics endpoint
    this.sendToCustomEndpoint(event);
  }

  private async sendToCustomEndpoint(event: TrackingEvent): Promise<void> {
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          anonymized: this.config.anonymizeIP
        })
      });

      if (!response.ok) {
        console.warn('📊 Analytics endpoint returned error:', response.status);
      }
    } catch (error) {
      console.warn('📊 Failed to send analytics event:', error);
    }
  }

  private getLinkType(href: string): string {
    if (href.startsWith('http')) return 'external';
    if (href.startsWith('mailto:')) return 'email';
    if (href.startsWith('tel:')) return 'phone';
    if (href.startsWith('#')) return 'anchor';
    return 'internal';
  }

  private throttle<T extends (...args: unknown[]) => unknown>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    let lastExecTime = 0;
    
    return ((...args: unknown[]) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    }) as T;
  }

  // Public API methods
  public getEvents(): TrackingEvent[] {
    return [...this.events];
  }

  public getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  public getUserJourney(): UserJourney {
    return {
      ...this.userJourney,
      sessionDuration: Date.now() - this.userJourney.startTime
    };
  }

  public updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public enableTracking(): void {
    this.config.enableTracking = true;
  }

  public disableTracking(): void {
    this.config.enableTracking = false;
  }

  public exportData(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      events: this.events,
      performanceMetrics: this.performanceMetrics,
      userJourney: this.getUserJourney(),
      config: this.config
    }, null, 2);
  }
}

// Initialize analytics manager
export function initAnalyticsManager(config?: AnalyticsConfig): AnalyticsManager {
  console.log('🚀 Initializing AnalyticsManager...');
  return new AnalyticsManager(config);
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      (window as Window & { analyticsManager?: AnalyticsManager }).analyticsManager = initAnalyticsManager();
    });
  } else {
    (window as Window & { analyticsManager?: AnalyticsManager }).analyticsManager = initAnalyticsManager();
  }
} 