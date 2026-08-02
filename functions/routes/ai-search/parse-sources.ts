import { buildSourceMetadata } from '../../shared/source-metadata';
import type { AiSourcePayload } from './types';

export function parseAiSources(resultData: unknown[]): AiSourcePayload[] {
  return resultData
    .map((entry: unknown, index: number): AiSourcePayload | null => {
      if (!entry || typeof entry !== 'object') return null;
      const entryObj = entry as Record<string, unknown>;
      const attributes =
        entryObj.attributes && typeof entryObj.attributes === 'object'
          ? (entryObj.attributes as Record<string, unknown>)
          : {};
      const fileMeta =
        attributes.file && typeof attributes.file === 'object'
          ? (attributes.file as Record<string, unknown>)
          : {};
      const item =
        entryObj.item && typeof entryObj.item === 'object'
          ? (entryObj.item as Record<string, unknown>)
          : {};
      const itemMetadata =
        item.metadata && typeof item.metadata === 'object'
          ? (item.metadata as Record<string, unknown>)
          : {};
      const rawUrl =
        typeof entryObj.filename === 'string' && entryObj.filename
          ? entryObj.filename
          : typeof attributes.folder === 'string'
            ? attributes.folder
            : typeof itemMetadata.url === 'string'
              ? itemMetadata.url
              : typeof itemMetadata.pathname === 'string'
                ? itemMetadata.pathname
                : typeof itemMetadata.source_url === 'string'
                  ? itemMetadata.source_url
                  : typeof itemMetadata.sourceUrl === 'string'
                    ? itemMetadata.sourceUrl
                    : typeof itemMetadata.path === 'string'
                      ? itemMetadata.path
                      : typeof item.key === 'string'
                        ? item.key
                        : '';
      if (!rawUrl) return null;
      const titleCandidate =
        typeof fileMeta.title === 'string' && fileMeta.title.trim()
          ? fileMeta.title.trim()
          : typeof attributes.folder === 'string' && attributes.folder.trim()
            ? attributes.folder.trim()
            : typeof itemMetadata.title === 'string' && itemMetadata.title.trim()
              ? itemMetadata.title.trim()
              : `Source ${index + 1}`;
      let snippet: string | undefined;
      if (typeof entryObj.text === 'string' && entryObj.text.trim()) {
        snippet = entryObj.text.trim().slice(0, 320);
      } else if (Array.isArray(entryObj.content)) {
        const contentItem = entryObj.content.find(
          (item: unknown) =>
            !!item &&
            typeof item === 'object' &&
            typeof (item as { text?: unknown }).text === 'string' &&
            Boolean((item as { text: string }).text.trim())
        ) as { text?: string } | undefined;
        if (contentItem && typeof contentItem.text === 'string') {
          snippet = contentItem.text.trim().slice(0, 320);
        }
      }
      const score = typeof entryObj.score === 'number' ? entryObj.score : undefined;
      const metadata = buildSourceMetadata(rawUrl, {
        ...entryObj,
        attributes: {
          ...attributes,
          metadata: {
            ...((attributes.metadata as Record<string, unknown> | undefined) || {}),
            ...itemMetadata,
          },
        },
      });
      const sourcePayload: AiSourcePayload = {
        title: titleCandidate,
        url: rawUrl,
      };
      if (snippet) {
        sourcePayload.snippet = snippet;
      }
      if (typeof score === 'number') {
        sourcePayload.score = score;
      }
      if (metadata.collection) {
        sourcePayload.collection = metadata.collection;
      }
      if (metadata.icon) {
        sourcePayload.icon = metadata.icon;
      }
      if (metadata.publishedAt) {
        sourcePayload.publishedAt = metadata.publishedAt;
      }
      if (metadata.summary) {
        sourcePayload.summary = metadata.summary;
      }
      return sourcePayload;
    })
    .filter((value): value is AiSourcePayload => Boolean(value));
}
