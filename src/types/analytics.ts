/**
 * Analytics type definitions shared across client modules.
 */
import type { BaseConfig } from './core';

export type AnalyticsProvider = 'gtag' | 'plausible' | 'fathom' | 'clarity';

export interface NavigationData {
  from: string;
  to: string;
  method?: 'link' | 'router' | 'history';
  duration?: number;
}

export interface ScrollData {
  depth: number;
  direction: 'up' | 'down';
  speed?: number;
}

export interface FormData {
  formName: string;
  formId?: string;
  fields?: string[];
  validationErrors?: string[];
  submissionTime?: number;
  [key: string]: unknown;
}

export interface SearchData {
  query: string;
  results: number;
  latencyMs?: number;
  [key: string]: unknown;
}

export interface ErrorData {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  stack?: string;
  url?: string;
  status?: number;
  lineNumber?: number;
  columnNumber?: number;
  reason?: unknown;
  [key: string]: unknown;
}

export type TrackingPayload =
  Record<string, unknown> | NavigationData | ScrollData | FormData | SearchData | ErrorData;

export interface TrackingEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  custom?: TrackingPayload;
  sessionId: string;
  timestamp: number;
}

export interface UserJourney {
  pageViews: string[];
  interactions: TrackingEvent[];
  sessionDuration: number;
  startTime: number;
  endTime?: number;
}

export interface AnalyticsConfig extends BaseConfig {
  enabled: boolean;
  enableTracking: boolean;
  respectDNT: boolean;
  trackPageViews: boolean;
  trackClicks: boolean;
  trackScroll: boolean;
  trackErrors: boolean;
  trackPerformance: boolean;
  providers?: AnalyticsProvider[];
  excludeSelectors?: string[];
}

export type { PerformanceMetric } from './core';
