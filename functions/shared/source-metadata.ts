export const SOURCE_CATEGORY_ICONS: Record<string, string> = {
  Project: '🛠️',
  'Case Study': '📊',
  'Blog Post': '📝',
  Page: '📎',
};

export function normalizeDateToIso(value: unknown): string | undefined {
  if (!value || (typeof value !== 'string' && typeof value !== 'number')) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function inferCollectionFromPath(pathname: string | undefined): string {
  if (!pathname) return 'Page';
  const lower = pathname.toLowerCase();
  if (lower.startsWith('/projects') || lower.includes('/project')) return 'Project';
  if (lower.includes('case-study')) return 'Case Study';
  if (lower.startsWith('/blog') || lower.startsWith('/posts')) return 'Blog Post';
  if (lower.includes('/docs') || lower.includes('/guides')) return 'Guide';
  return 'Page';
}

export function pickSummaryCandidate(
  entry: Record<string, unknown> | null | undefined,
  attributes: Record<string, unknown>,
  metadata: Record<string, unknown>
): string | undefined {
  const candidates = [
    attributes?.summary,
    metadata?.summary,
    metadata?.description,
    metadata?.excerpt,
    attributes?.description,
    entry?.summary,
    entry?.description,
    entry?.headline,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
}

export function buildSourceMetadata(
  rawUrl: string,
  entry: Record<string, unknown> | null | undefined
): {
  collection: string;
  icon: string;
  publishedAt: string | undefined;
  summary: string | undefined;
} {
  try {
    const url = new URL(rawUrl, 'https://blakeoxford.com');
    const attributes =
      entry?.attributes && typeof entry.attributes === 'object'
        ? (entry.attributes as Record<string, unknown>)
        : {};
    const metadata =
      attributes?.metadata && typeof attributes.metadata === 'object'
        ? (attributes.metadata as Record<string, unknown>)
        : {};
    const fileMeta =
      attributes?.file && typeof attributes.file === 'object'
        ? (attributes.file as Record<string, unknown>)
        : {};
    const publishedCandidate =
      metadata?.publishedAt ||
      metadata?.published_at ||
      metadata?.date ||
      fileMeta?.publishedAt ||
      fileMeta?.published_at ||
      fileMeta?.date ||
      entry?.published_at ||
      entry?.created_at ||
      entry?.date;
    const summary = pickSummaryCandidate(entry, attributes, metadata);
    const collection =
      (typeof metadata?.collection === 'string' && metadata.collection) ||
      (typeof attributes?.collection === 'string' && attributes.collection) ||
      inferCollectionFromPath(url.pathname);
    const icon =
      SOURCE_CATEGORY_ICONS[collection] ||
      SOURCE_CATEGORY_ICONS[inferCollectionFromPath(url.pathname)] ||
      '📎';
    return {
      collection,
      icon,
      publishedAt: normalizeDateToIso(publishedCandidate),
      summary,
    };
  } catch {
    return { collection: 'Page', icon: '📎', publishedAt: undefined, summary: undefined };
  }
}
