/**
 * Type definitions for AI Chat Island component
 *
 * This file is the SINGLE SOURCE OF TRUTH for chat-related types.
 * All other files should import from here (or via the barrel export).
 */

import type { AIChatSource, AISearchMeta } from '../ai-search';

// ─── Core Chat Types ──────────────────────────────────────────────

/**
 * Chat message structure - unified across all chat functionality
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: AIChatSource[];
  /** Cloudflare Worker provenance (AutoRAG / Workers AI / cache). */
  provenance?: AISearchMeta;
  qualityScore?: number;
  qualityDetails?: {
    completeness: number;
    citationAccuracy: number;
    conciseness: number;
    relevance: number;
    reasoning: string;
  };
  citationHealth?: 'healthy' | 'warning' | 'error';
  feedback?: 'positive' | 'negative';
  responseTime?: number;
  retryCount?: number;
  error?: {
    category: string;
    message: string;
    retryable: boolean;
  };
}

/** Simplified mutable ref shape to avoid deprecated React types */
export type MutableRef<T> = { current: T };

export type ChatState = 'idle' | 'loading' | 'ready';

export type LoadingPhase = 'searching' | 'analyzing' | 'crafting' | null;

export type SearchFallback = {
  title: string;
  url: string;
  excerpt?: string;
  score: number;
};

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult:
    ((event: { results: Array<{ isFinal: boolean; 0?: { transcript?: string } }> }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

// ─── Initial State ────────────────────────────────────────────────

export const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Ask about projects, case studies, or posts.',
  timestamp: Date.now(),
};
