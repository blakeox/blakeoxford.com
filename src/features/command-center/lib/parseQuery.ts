import type { CommandMode } from '../types';

export type ParsedCommandQuery = {
  mode: CommandMode;
  query: string;
};

export function parseCommandQuery(raw: string): ParsedCommandQuery {
  const trimmed = raw.trim();
  if (trimmed.startsWith('?')) {
    return { mode: 'ask', query: trimmed.slice(1).trim() };
  }
  return { mode: 'find', query: trimmed };
}
