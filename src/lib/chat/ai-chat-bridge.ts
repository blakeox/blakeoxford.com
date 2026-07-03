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
  sourceKind?: 'page' | 'project' | 'blog';
};

export const AI_CHAT_ASK = 'ai-chat:ask';

function kindLabel(kind?: AiChatAskDetail['sourceKind']): string {
  if (kind === 'blog') return 'blog post';
  if (kind === 'project') return 'project';
  if (kind === 'page') return 'page';
  return 'page';
}

export function buildAskPrompt(
  query: string,
  options?: Pick<AiChatAskDetail, 'sourceTitle' | 'sourceKind'>,
): string {
  const trimmed = query.trim();
  const title = options?.sourceTitle?.trim();

  if (title) {
    const label = kindLabel(options?.sourceKind);
    if (trimmed && !trimmed.toLowerCase().includes(title.toLowerCase())) {
      return `Regarding my search for "${trimmed}", tell me more about the ${label} "${title}".`;
    }
    return `Tell me about the ${label} "${title}" — key approach, outcomes, and what I should know.`;
  }

  return trimmed;
}

export function handoffToAiChat(detail: AiChatAskDetail): void {
  if (typeof window === 'undefined') return;

  const payload: AiChatAskDetail = {
    ...detail,
    query: buildAskPrompt(detail.query, {
      sourceTitle: detail.sourceTitle,
      sourceKind: detail.sourceKind,
    }),
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
