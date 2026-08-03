import type { HistoryEntry } from './types';

type AiSearchMessage = { role: 'user' | 'assistant'; content: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function extractChoiceMessage(value: unknown): string {
  const choice = asRecord(value);
  const message = asRecord(choice?.message);
  const content = message?.content;
  if (typeof content === 'string') return content.trim();
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      const partRecord = asRecord(part);
      return typeof partRecord?.text === 'string' ? partRecord.text : '';
    })
    .join('')
    .trim();
}

export function buildAiSearchRequest(query: string, history: HistoryEntry[]) {
  const messages: AiSearchMessage[] = [
    ...history.map(({ role, content }) => ({ role, content })),
    { role: 'user', content: query },
  ];
  return { messages };
}

export function extractAiSearchMessage(payload: Record<string, unknown>): string {
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const chatMessage = extractChoiceMessage(choices[0]);
  if (chatMessage) return chatMessage;

  const result = asRecord(payload.result);
  const resultResponse = result?.response;
  if (typeof resultResponse === 'string') return resultResponse.trim();

  return typeof payload.response === 'string' ? payload.response.trim() : '';
}

export function extractAiSearchSourceData(payload: Record<string, unknown>): unknown[] {
  const result = asRecord(payload.result);
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.chunks)) return result.chunks;
  if (Array.isArray(payload.chunks)) return payload.chunks;
  return [];
}

export function extractAiSearchError(payload: unknown): string | undefined {
  const record = asRecord(payload);
  if (!record) return undefined;
  if (typeof record.error === 'string' && record.error.trim()) return record.error.trim();
  const errors = Array.isArray(record.errors) ? record.errors : [];
  const firstError = asRecord(errors[0]);
  return typeof firstError?.message === 'string' && firstError.message.trim()
    ? firstError.message.trim()
    : undefined;
}
