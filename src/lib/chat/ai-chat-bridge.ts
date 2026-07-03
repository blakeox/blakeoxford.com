/**
 * Bridge between Command Center (find/navigate) and AI Chat (conversational).
 *
 * Find  → Cloudflare Vectorize + local index — jump to a page
 * Ask   → AutoRAG /api/ai-search — multi-turn answers with citations
 */

export type AiChatAskDetail = {
  query: string;
  autoSend?: boolean;
  sourceHref?: string;
  sourceTitle?: string;
};

export const AI_CHAT_ASK = 'ai-chat:ask';

export function buildAskPrompt(query: string, sourceTitle?: string): string {
  const trimmed = query.trim();
  if (!trimmed) return '';
  if (sourceTitle) {
    return `Tell me about "${sourceTitle}" — ${trimmed}`;
  }
  return trimmed;
}

export function handoffToAiChat(detail: AiChatAskDetail): void {
  if (typeof window === 'undefined') return;

  const payload: AiChatAskDetail = {
    ...detail,
    query: buildAskPrompt(detail.query, detail.sourceTitle),
  };

  window.dispatchEvent(new CustomEvent(AI_CHAT_ASK, { detail: payload }));
  window.dispatchEvent(new CustomEvent('ai-chat:state', { detail: { open: true } }));
}

export function openAiChat(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ai-chat:state', { detail: { open: true } }));
}

export function closeAiChat(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ai-chat:state', { detail: { open: false } }));
}
