import type { HistoryEntry } from './types';

type AiSearchMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export function removeLeadingQuestionEcho(message: string, ...queries: string[]): string {
  let answer = message.trim();
  const prefixes = queries
    .map((query) => query.trim())
    .filter(
      (question) =>
        /[?？]/.test(question) ||
        /^(who|what|when|where|why|how|is|are|do|does|can|could|would|will|tell me|show me|explain|describe)\b/i.test(
          question
        )
    )
    .sort((a, b) => b.length - a.length)
    .map((question) => {
      const escaped = question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      return new RegExp(`^${escaped}(?=\\s|$)`, 'i');
    });
  let previous: string;
  do {
    previous = answer;
    for (const prefix of prefixes) answer = answer.replace(prefix, '').trimStart();
  } while (answer !== previous);
  return answer.trim();
}

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
  const prior = history
    .map(({ role, content }, index) => ({
      role,
      content:
        role === 'assistant' && history[index - 1]?.role === 'user'
          ? removeLeadingQuestionEcho(content, history[index - 1].content)
          : content.trim(),
    }))
    .filter(({ content }) => content);
  if (prior.at(-1)?.role === 'user' && prior.at(-1)?.content === query.trim()) prior.pop();
  const messages: AiSearchMessage[] = [
    {
      role: 'system',
      content:
        'Answer the current question directly using the retrieved context. Do not repeat or restate the question before answering. Do not invent facts or sources.',
    },
    ...prior,
    { role: 'user', content: query },
  ];
  return { messages };
}

export function extractAiSearchMessage(
  payload: Record<string, unknown>,
  ...queries: string[]
): string {
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const chatMessage = extractChoiceMessage(choices[0]);
  if (chatMessage) return removeLeadingQuestionEcho(chatMessage, ...queries);

  const result = asRecord(payload.result);
  const resultResponse = result?.response;
  if (typeof resultResponse === 'string')
    return removeLeadingQuestionEcho(resultResponse, ...queries);

  return typeof payload.response === 'string'
    ? removeLeadingQuestionEcho(payload.response, ...queries)
    : '';
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
