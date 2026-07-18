/**
 * Library Barrel Export
 *
 * Central export point for all library modules.
 *
 * @module lib
 */

// AI Search
export {
  AISearchError,
  searchWithAI,
  type AIChatRole,
  type AIChatMessage,
  type AIChatSource,
  type AIChatResponse,
  type SearchWithAIOptions,
} from './ai-search';

// Analytics
export { trackEvent, autoragEvents, conversionEvents } from './analytics';

// Error Utilities
export { categorizeError, getRetryDelay } from './error-utils';

// String Utilities
export {
  decodeHtmlEntities,
  decodeMimeEncodedWords,
  cleanSnippet,
  cleanAssistantResponse,
  formatPublishedDate,
  formatRelativeDate,
  createId,
} from './string-utils';

// Quality Utilities
export {
  calculateResponseQuality,
  evaluateResponseWithLLM,
  getConfidenceIndicator,
  getCitationHealthIndicator,
} from './quality-utils';

// Chat Module (re-export from sub-module)
export * from './chat';

// Hooks Module (re-export from sub-module)
export * from './hooks';
