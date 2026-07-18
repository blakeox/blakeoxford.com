/**
 * Chat Module - Consolidated exports for AI chat functionality
 *
 * This barrel file provides a single import point for all chat-related
 * functionality, eliminating the need for deep imports.
 *
 * @example
 * ```ts
 * import {
 *   type ChatMessage,
 *   enhanceQuery,
 *   cleanSnippet,
 *   GUIDED_PROMPTS
 * } from '@/lib/chat';
 * ```
 */

// ─── Type Definitions ─────────────────────────────────────────────
export type {
  ChatMessage,
  MutableRef,
  ChatState,
  LoadingPhase,
  SearchFallback,
  SpeechRecognitionLike,
} from './chat-types';

// Re-export the initial message constant
export { INITIAL_ASSISTANT_MESSAGE } from './chat-types';

// ─── Constants & Configuration ────────────────────────────────────
export {
  // Storage keys
  CONVERSATION_STORAGE_KEY,
  PREFERENCES_STORAGE_KEY,
  // API endpoints
  SEMANTIC_SEARCH_URL,
  // UI constants
  GUIDED_PROMPTS,
  QUICK_ACTIONS,
  CONTEXTUAL_CTAS,
  // Text truncation limits
  MAX_SUMMARY_LENGTH,
  SUMMARY_TRUNCATE_AT,
  // Message compression limits
  MAX_USER_MESSAGE_LENGTH,
  MAX_ASSISTANT_MESSAGE_LENGTH,
  // CTA generation thresholds
  MAX_CTAS,
  DEEP_CONVERSATION_THRESHOLD,
  MULTIPLE_SOURCES_THRESHOLD,
  // Message history limits
  MAX_HISTORY_MESSAGES,
  COMPRESSION_THRESHOLD,
  // Quality scoring thresholds
  QUALITY_THRESHOLDS,
  // Retry configuration
  MAX_RETRIES,
  RETRY_DELAY_MS,
} from './chat-constants';

export type { ContextualCTA } from './chat-constants';

// ─── Helper Functions ─────────────────────────────────────────────
export { cleanSnippet, checkCitationHealth, enhanceQuery } from './chat-helpers';

export {
  getPageContext,
  formatPageContextLabel,
  withPageContext,
  type PageContext,
} from './pageContext';

// ─── Conversation Utilities ───────────────────────────────────────
export {
  filterMessages,
  calculateConversationAnalytics,
  exportToMarkdown,
  exportToJSON,
} from './conversation-utils';

// ─── Message Processing ───────────────────────────────────────────
export {
  compressOlderMessages,
  buildHistoryForRequest,
  generateContextualCTAs,
} from './message-processing';

// ─── Message Validation ───────────────────────────────────────────
export { restoreMessages } from './message-validation';

// ─── Response Handlers ────────────────────────────────────────────
export {
  finalizeMessageQuality,
  copyToClipboard,
  getRelevanceExplanation,
} from './response-handlers';

// ─── Storage Utilities ────────────────────────────────────────────
export {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  getBooleanPreference,
} from './storage-utils';

// ─── WebSocket & Real-time ────────────────────────────────────────
export { ConversationWebSocket, ConversationHTTP, type WSMessage } from './conversation-ws';
