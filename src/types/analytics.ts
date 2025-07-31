/**
 * Analytics Type Definitions
 * Consolidated types for both analytics tracking and management
 */

import type { BaseConfig, EventData, PerformanceMetric } from './core';

// Re-export core types for convenience
export type { EventData, PerformanceMetric } from './core';

export interface AnalyticsConfig extends BaseConfig {
  enableTracking?: boolean;
  respectDNT?: boolean;
  anonymizeIP?: boolean;
  trackPerformance?: boolean;
  trackErrors?: boolean;
  trackUserJourney?: boolean;
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackScroll?: boolean;
  excludeSelectors?: string[];
    providers?: ('gtm' | 'gtag' | 'plausible' | 'fathom' | 'clarity')[];
  debugMode?: boolean;
}

export interface TrackingEvent {
  sessionId: string;
  userId?: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  custom?: Record<string, unknown>;
}

export interface UserJourney {
  pageViews: string[];
  interactions: TrackingEvent[];
  sessionDuration: number;
  startTime: number;
  endTime?: number;
}

// Specific event data interfaces
export interface NavigationData extends EventData {
  from: string;
  to: string;
  method?: 'click' | 'keyboard' | 'programmatic';
  duration?: number;
}

export interface ScrollData extends EventData {
  depth: number;
  direction: 'up' | 'down';
  speed?: number;
  element?: string;
}

export interface FormData extends EventData {
  formName: string;
  formId?: string;
  fields?: string[];
  validationErrors?: string[];
  submissionTime?: number;
  abandonmentPoint?: string;
}

export interface SearchData extends EventData {
  query: string;
  source?: 'search-bar' | 'voice' | 'suggestion';
  results?: number;
  filters?: string[];
  queryLength?: number;
  resultClicked?: boolean;
}

export interface ErrorData extends EventData {
  errorType: 'javascript' | 'network' | 'resource' | 'validation';
  errorMessage: string;
  stackTrace?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
}

// Analytics service interface
export interface AnalyticsService {
  track(event: TrackingEvent): void;
  trackPageView(path: string, title?: string): void;
  trackError(error: ErrorData): void;
  getEvents(): TrackingEvent[];
  getPerformanceMetrics(): PerformanceMetric[];
  getUserJourney(): UserJourney;
  exportData(): string;
}
