/**
 * Consolidated Analytics System
 * Replaces both AnalyticsManager and AnalyticsModule with a single, comprehensive solution
 */

import type { 
  AnalyticsConfig, 
  TrackingEvent, 
  UserJourney, 
  NavigationData, 
  ScrollData, 
  FormData as AnalyticsFormData,
  SearchData, 
  ErrorData,
  PerformanceMetric 
} from '../../types/analytics';
import type { ModuleInitializer } from '../../types/core';
import { ConfigManager } from '../../config/app-config';

export class Analytics implements ModuleInitializer<AnalyticsConfig> {
  private static instance: Analytics;
  private config: AnalyticsConfig;
  private sessionId: string;
  private events: TrackingEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private userJourney: UserJourney;
  private isInitialized = false;
  
  private constructor(config?: Partial<AnalyticsConfig>) {
    const configManager = ConfigManager.getInstance();
    this.config = { ...configManager.getAnalyticsConfig(), ...config };
    this.sessionId = this.generateSessionId();
    this.userJourney = {
      pageViews: [],
      interactions: [],
      sessionDuration: 0,
      startTime: Date.now()
    };
  }
  
  // Singleton pattern
  static getInstance(config?: Partial<AnalyticsConfig>): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics(config);
    }
    return Analytics.instance;
  }
  
  // ModuleInitializer implementation
  init(config?: AnalyticsConfig): void {
    if (this.isInitialized) {
      console.warn('Analytics already initialized');
      return;
    }
    
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    if (!this.shouldTrack()) {
      console.log('🚫 Analytics tracking disabled');
      return;
    }
    
    this.setupEventListeners();
    this.setupPerformanceTracking();
    this.isInitialized = true;
    
    console.log('📊 Analytics initialized', this.config.debug ? this.config : '');
  }
  
  destroy(): void {
    this.cleanup();
    this.isInitialized = false;
    this.events.length = 0;
    this.performanceMetrics.length = 0;
  }
  
  updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.isInitialized && !this.shouldTrack()) {
      this.destroy();
    } else if (!this.isInitialized && this.shouldTrack()) {
      this.init();
    }
  }
  
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }
  
  // Core tracking methods
  track(event: Omit<TrackingEvent, 'sessionId' | 'timestamp'>): void {
    if (!this.shouldTrack()) return;
    
    const trackingEvent: TrackingEvent = {
      ...event,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };
    
    this.events.push(trackingEvent);
    this.userJourney.interactions.push(trackingEvent);
    
    // Send to configured providers
    this.sendToProviders(trackingEvent);
    
    if (this.config.debug) {
      console.log('📊 Event tracked:', trackingEvent);
    }
  }
  
  trackPageView(path: string, title?: string): void {
    if (!this.config.trackPageViews) return;
    
    this.userJourney.pageViews.push(path);
    
    this.track({
      category: 'navigation',
      action: 'page_view',
      label: path,
      custom: { 
        title: title || document.title,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      }
    });
  }
  
  trackNavigation(data: NavigationData): void {
    this.track({
      category: 'navigation',
      action: 'navigate',
      label: `${data.from} → ${data.to}`,
      custom: data
    });
  }
  
  trackScroll(data: ScrollData): void {
    if (!this.config.trackScroll) return;
    
    this.track({
      category: 'engagement', 
      action: 'scroll',
      label: `${data.depth}%`,
      value: data.depth,
      custom: data
    });
  }
  
  trackForm(data: AnalyticsFormData): void {
    this.track({
      category: 'form',
      action: data.validationErrors?.length ? 'validation_error' : 'interaction',
      label: data.formName,
      custom: data
    });
  }
  
  trackSearch(data: SearchData): void {
    this.track({
      category: 'search',
      action: 'query',
      label: data.query,
      value: data.results,
      custom: data
    });
  }
  
  trackError(error: ErrorData): void {
    if (!this.config.trackErrors) return;
    
    this.track({
      category: 'error',
      action: error.errorType,
      label: error.errorMessage,
      custom: error
    });
  }
  
  trackClick(element: HTMLElement, customData?: Record<string, unknown>): void {
    if (!this.config.trackClicks) return;
    
    const elementInfo = this.getElementInfo(element);
    
    this.track({
      category: 'interaction',
      action: 'click',
      label: elementInfo.selector,
      custom: {
        ...elementInfo,
        ...customData
      }
    });
  }
  
  // Performance tracking
  private setupPerformanceTracking(): void {
    if (!this.config.trackPerformance) return;
    
    // Track Core Web Vitals
    this.trackCoreWebVitals();
    
    // Track resource loading
    this.trackResourceTiming();
    
    // Track navigation timing
    this.trackNavigationTiming();
  }
  
  private trackCoreWebVitals(): void {
    // Implementation would use web-vitals library or native APIs
    // This is a simplified version
    if ('PerformanceObserver' in window) {
      // Track LCP, CLS, FID
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceMetric({
            name: entry.entryType,
            value: entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            category: 'performance'
          });
        }
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
    }
  }
  
  private trackResourceTiming(): void {
    if ('performance' in window && performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource');
      resources.forEach((resource) => {
        this.recordPerformanceMetric({
          name: `resource_${resource.name.split('/').pop()}`,
          value: resource.duration,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'network'
        });
      });
    }
  }
  
  private trackNavigationTiming(): void {
    if ('performance' in window && performance.timing) {
      const timing = performance.timing;
      const navigationStart = timing.navigationStart;
      
      this.recordPerformanceMetric({
        name: 'dom_content_loaded',
        value: timing.domContentLoadedEventEnd - navigationStart,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'navigation'
      });
      
      this.recordPerformanceMetric({
        name: 'page_load_complete',
        value: timing.loadEventEnd - navigationStart,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'navigation'
      });
    }
  }
  
  private recordPerformanceMetric(metric: PerformanceMetric): void {
    this.performanceMetrics.push(metric);
    
    if (this.config.debug) {
      console.log('⚡ Performance metric:', metric);
    }
  }
  
  // Event listeners setup
  private setupEventListeners(): void {
    if (this.config.trackClicks) {
      this.setupClickTracking();
    }
    
    if (this.config.trackScroll) {
      this.setupScrollTracking();
    }
    
    this.setupNavigationTracking();
    this.setupFormTracking();
    this.setupErrorTracking();
  }
  
  private setupClickTracking(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Skip excluded elements
      if (this.isExcluded(target)) return;
      
      this.trackClick(target, {
        clickX: event.clientX,
        clickY: event.clientY,
        timestamp: Date.now()
      });
    }, { passive: true });
  }
  
  private setupScrollTracking(): void {
    let scrollDepth = 0;
    let scrollDirection: 'up' | 'down' = 'down';
    let lastScrollY = window.scrollY;
    
    const trackScroll = this.throttle(() => {
      const currentScrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentDepth = Math.round((currentScrollY / documentHeight) * 100);
      
      scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
      
      // Only track significant scroll depth changes
      if (Math.abs(currentDepth - scrollDepth) >= 10) {
        this.trackScroll({
          depth: currentDepth,
          direction: scrollDirection,
          speed: Math.abs(currentScrollY - lastScrollY)
        });
        scrollDepth = currentDepth;
      }
      
      lastScrollY = currentScrollY;
    }, 1000);
    
    document.addEventListener('scroll', trackScroll, { passive: true });
  }
  
  private setupNavigationTracking(): void {
    // Track initial page load
    if (document.readyState === 'complete') {
      this.trackPageView(window.location.pathname, document.title);
    } else {
      window.addEventListener('load', () => {
        this.trackPageView(window.location.pathname, document.title);
      });
    }
    
    // Track navigation changes (for SPAs)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => {
        this.trackPageView(window.location.pathname, document.title);
      }, 0);
    };
    
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => {
        this.trackPageView(window.location.pathname, document.title);
      }, 0);
    };
    
    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname, document.title);
    });
  }
  
  private setupFormTracking(): void {
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (!form || form.tagName !== 'FORM') return;
      
      const formData = new FormData(form);
      const fields = Array.from(formData.keys());
      
      this.trackForm({
        formName: form.name || form.id || 'unnamed',
        formId: form.id,
        fields,
        submissionTime: Date.now()
      });
    });
    
    // Track form field interactions
    document.addEventListener('focusout', (event) => {
      const target = event.target as HTMLElement;
      if (!this.isFormField(target)) return;
      
      const form = target.closest('form');
      if (!form) return;
      
      this.trackForm({
        formName: form.name || form.id || 'unnamed',
        fields: [target.getAttribute('name') || target.id || 'unnamed'],
        submissionTime: Date.now()
      });
    });
  }
  
  private setupErrorTracking(): void {
    if (!this.config.trackErrors) return;
    
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        errorType: 'javascript',
        errorMessage: event.message,
        stackTrace: event.error?.stack,
        url: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno
      });
    });
    
    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        errorType: 'javascript',
        errorMessage: event.reason?.message || 'Unhandled promise rejection',
        stackTrace: event.reason?.stack
      });
    });
    
    // Resource loading errors
    document.addEventListener('error', (event) => {
      const target = event.target;
      if (target && target !== window && 'tagName' in target) {
        const element = target as HTMLElement;
        this.trackError({
          errorType: 'resource',
          errorMessage: `Failed to load ${element.tagName}: ${element.getAttribute('src') || element.getAttribute('href')}`,
          url: element.getAttribute('src') || element.getAttribute('href') || undefined
        });
      }
    }, true);
  }
  
  // Utility methods
  private shouldTrack(): boolean {
    if (!this.config.enableTracking) return false;
    if (this.config.respectDNT && navigator.doNotTrack === '1') return false;
    return true;
  }
  
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
  
  private sendToProviders(event: TrackingEvent): void {
    this.config.providers?.forEach(provider => {
      switch (provider) {
        case 'gtag':
          this.sendToGtag(event);
          break;
        case 'plausible':
          this.sendToPlausible(event);
          break;
        case 'fathom':
          this.sendToFathom(event);
          break;
        case 'clarity':
          this.sendToClarity(event);
          break;
      }
    });
  }
  
  private sendToGtag(event: TrackingEvent): void {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.custom
      });
    }
  }
  
  private sendToPlausible(event: TrackingEvent): void {
    if (typeof window.plausible === 'function') {
      window.plausible(event.action, {
        props: {
          category: event.category,
          label: event.label,
          value: event.value,
          ...event.custom
        }
      });
    }
  }
  
  private sendToFathom(event: TrackingEvent): void {
    if (window.fathom?.trackEvent) {
      window.fathom.trackEvent(event.action, {
        category: event.category,
        label: event.label,
        value: event.value,
        ...event.custom
      });
    }
  }
  
  private sendToClarity(event: TrackingEvent): void {
    if (window.clarity) {
      window.clarity('event', event.action, {
        category: event.category,
        label: event.label,
        value: event.value,
        ...event.custom
      });
    }
  }
  
  private getElementInfo(element: HTMLElement) {
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      text: element.textContent?.slice(0, 100),
      selector: this.getElementSelector(element)
    };
  }
  
  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ').join('.')}`;
    return element.tagName.toLowerCase();
  }
  
  private isExcluded(element: HTMLElement): boolean {
    return this.config.excludeSelectors?.some(selector => 
      element.matches(selector) || element.closest(selector)
    ) || false;
  }
  
  private isFormField(element: HTMLElement): boolean {
    const formElements = ['INPUT', 'TEXTAREA', 'SELECT'];
    return formElements.includes(element.tagName);
  }
  
  private throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;
    
    return ((...args: Parameters<T>) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    }) as T;
  }
  
  private cleanup(): void {
    // Remove event listeners if needed
    // This is a simplified cleanup - in practice, you'd store references to listeners
  }
  
  // Public API methods
  getEvents(): TrackingEvent[] {
    return [...this.events];
  }
  
  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }
  
  getUserJourney(): UserJourney {
    return {
      ...this.userJourney,
      sessionDuration: Date.now() - this.userJourney.startTime,
      endTime: Date.now()
    };
  }
  
  exportData(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      events: this.events,
      performanceMetrics: this.performanceMetrics,
      userJourney: this.getUserJourney(),
      config: this.config
    }, null, 2);
  }
  
  enableTracking(): void {
    this.updateConfig({ enableTracking: true });
  }
  
  disableTracking(): void {
    this.updateConfig({ enableTracking: false });
  }
}

// Initialize analytics function
export const initAnalytics = (config?: Partial<AnalyticsConfig>): Analytics => {
  const analytics = Analytics.getInstance(config);
  analytics.init();
  return analytics;
};

// Auto-initialize if not in module context
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      (window as any).analytics = initAnalytics();
    });
  } else {
    (window as any).analytics = initAnalytics();
  }
}
