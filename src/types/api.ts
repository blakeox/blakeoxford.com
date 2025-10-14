/**
 * API Type Definitions
 * Types for API endpoints, requests, and responses
 */

// ============================================================================
// Common API Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp?: string;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// Security & Monitoring API Types
// ============================================================================

/**
 * CSP violation report structure
 * Content Security Policy violation from browser
 */
export interface CspViolationReport {
  'csp-report': {
    'document-uri': string;
    'violated-directive': string;
    'blocked-uri': string;
    'effective-directive': string;
    'original-policy': string;
    referrer?: string;
    'status-code'?: number;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
    'script-sample'?: string;
  };
}

/**
 * Processed CSP violation with metadata
 */
export interface ProcessedCspViolation {
  documentUri: string;
  violatedDirective: string;
  blockedUri: string;
  effectiveDirective: string;
  originalPolicy: string;
  referrer?: string;
  statusCode?: number;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  sample?: string;
  timestamp: string;
  ip: string;
  userAgent?: string;
}

/**
 * CSP report response
 */
export interface CspReportResponse extends ApiResponse {
  reportId: string;
}

/**
 * Security report data
 * General security incident reporting
 */
export interface SecurityReport {
  type: 'xss' | 'csrf' | 'injection' | 'auth' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  url: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  data?: Record<string, unknown>;
  blocked?: boolean;
  details?: Record<string, unknown>;
}

/**
 * Performance alert data
 * Client-side performance monitoring
 */
export interface PerformanceAlert {
  type?: string;
  metric: 'fcp' | 'lcp' | 'fid' | 'cls' | 'ttfb' | 'custom';
  value: number;
  threshold: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  url?: string;
  userAgent?: string;
  connection?: string;
  deviceMemory?: number;
  timestamp: string;
  message?: string;
  recommendation?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Contact Form API Types
// ============================================================================

/**
 * Contact form submission
 */
export interface ContactFormData {
  name: string;
  email: string;
  subject?: string;
  message: string;
  honeypot?: string; // Bot detection
  timestamp?: number;
}

/**
 * Contact form validation errors
 */
export interface ContactFormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  general?: string;
}

/**
 * Contact form response
 */
export interface ContactFormResponse extends ApiResponse {
  submissionId?: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

// ============================================================================
// Search API Types
// ============================================================================

/**
 * Search query parameters
 */
export interface SearchQuery {
  q: string;
  type?: 'all' | 'blog' | 'projects';
  limit?: number;
  offset?: number;
}

/**
 * Search result item
 */
export interface SearchResult {
  type: 'blog' | 'project';
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  tags?: string[];
  date?: string;
  score: number;
  matches?: SearchMatch[];
}

/**
 * Search match highlight
 */
export interface SearchMatch {
  field: string;
  value: string;
  indices: [number, number][];
}

/**
 * Search response
 */
export interface SearchResponse extends ApiResponse<SearchResult[]> {
  query: string;
  totalResults: number;
  processingTime: number;
}

// ============================================================================
// Analytics API Types
// ============================================================================

/**
 * Page view event
 */
export interface PageViewEvent {
  url: string;
  referrer?: string;
  userAgent?: string;
  timestamp: string;
  sessionId?: string;
}

/**
 * Custom analytics event
 */
export interface AnalyticsEvent {
  name: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Analytics response
 */
export interface AnalyticsResponse extends ApiResponse {
  eventId: string;
  processed: boolean;
}

// ============================================================================
// Edge Computing API Types (Cloudflare)
// ============================================================================

/**
 * Edge function request context
 */
export interface EdgeRequestContext {
  request: Request;
  env: EdgeEnvironment;
  ctx: ExecutionContext;
}

/**
 * Edge environment bindings
 */
export interface EdgeEnvironment {
  ASSETS: Fetcher;
  CONTACT_FORMS?: KVNamespace;
  RESEND_API_KEY?: string;
  ENVIRONMENT?: 'development' | 'staging' | 'production';
  [key: string]: unknown;
}

/**
 * KV storage interface
 */
export interface KVNamespace {
  get(key: string, options?: KVGetOptions): Promise<string | null>;
  put(key: string, value: string, options?: KVPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVListOptions): Promise<KVListResult>;
}

/**
 * KV get options
 */
export interface KVGetOptions {
  type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
  cacheTtl?: number;
}

/**
 * KV put options
 */
export interface KVPutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: Record<string, unknown>;
}

/**
 * KV list options
 */
export interface KVListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

/**
 * KV list result
 */
export interface KVListResult {
  keys: Array<{ name: string; metadata?: Record<string, unknown> }>;
  list_complete: boolean;
  cursor?: string;
}

/**
 * Cloudflare Fetcher interface
 */
export interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

/**
 * Execution context for edge functions
 */
export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
