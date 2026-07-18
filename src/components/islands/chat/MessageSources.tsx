/**
 * MessageSources — 1–2 titled citation links under an assistant answer.
 * No Vectorize jargon, scores, or dock-stealing chrome.
 */
import { memo, type RefObject } from 'react';
import { decodeHtmlEntities, decodeMimeEncodedWords } from '../../../lib/string-utils';
import type { Source } from './types';

const MIN_SOURCE_SCORE = 0.55;

function sourceTitle(source: Source): string {
  return decodeMimeEncodedWords(decodeHtmlEntities(source.title || source.url));
}

function isExternalUrl(url: string, siteHostname: string): boolean {
  try {
    const parsed = url.startsWith('http') ? new URL(url) : new URL(url, `https://${siteHostname}`);
    return parsed.hostname !== siteHostname;
  } catch {
    return !url.startsWith('/');
  }
}

export function filterDisplaySources(sources: Source[], limit = 2): Source[] {
  const ranked = [...sources].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const strong = ranked.filter(
    (source) => typeof source.score !== 'number' || source.score >= MIN_SOURCE_SCORE
  );
  const pool = strong.length > 0 ? strong : ranked;
  return pool.slice(0, limit);
}

type MessageSourcesProps = {
  sources: Source[];
  messageId: string;
  siteHostname: string;
  sourceRefs?: RefObject<HTMLAnchorElement[]>;
  onOpenSource?: (url: string) => void;
};

export const MessageSources = memo(function MessageSources({
  sources,
  messageId,
  siteHostname,
  sourceRefs,
  onOpenSource,
}: MessageSourcesProps) {
  const visible = filterDisplaySources(sources, 2);
  if (visible.length === 0) return null;

  const remaining = Math.max(0, sources.length - visible.length);

  return (
    <div className="mt-0.5 flex w-full max-w-[92%] flex-col gap-1" aria-label="Cited pages">
      <ul className="flex flex-col gap-0.5">
        {visible.map((source, index) => {
          const title = sourceTitle(source);
          const external = isExternalUrl(source.url, siteHostname);
          return (
            <li key={`${messageId}-source-${index}`}>
              <a
                ref={(el) => {
                  if (!sourceRefs?.current || !el) return;
                  sourceRefs.current[index] = el;
                }}
                href={source.url}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className="focus-ring-interactive inline-flex max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-xs text-accent transition hover:underline"
                onClick={() => onOpenSource?.(source.url)}
              >
                <span className="truncate font-medium">{title}</span>
              </a>
            </li>
          );
        })}
      </ul>
      {remaining > 0 ? (
        <p className="px-1 text-xxs text-subtle-foreground">+{remaining} more cited</p>
      ) : null}
    </div>
  );
});

/** @deprecated Prefer MessageSources — kept for any legacy imports */
export const SourcesList = MessageSources;
export const CitationLinks = MessageSources;
