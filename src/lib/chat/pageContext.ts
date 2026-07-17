export type PageContext = {
  url: string;
  title: string;
  pathname: string;
};

/** Current page context for Ask — lets the assistant talk about what the visitor is viewing. */
export function getPageContext(): PageContext | null {
  if (typeof window === 'undefined') return null;

  const rawTitle = document.title?.trim() || '';
  const title =
    rawTitle
      .replace(/\s*[|–—•·].*$/, '')
      .replace(/\s+-\s+Blake Oxford.*$/i, '')
      .trim() || rawTitle || 'this page';

  return {
    url: window.location.href,
    title,
    pathname: window.location.pathname || '/',
  };
}

export function formatPageContextLabel(context: PageContext | null): string {
  if (!context) return 'Site assistant';
  if (context.pathname === '/' || context.pathname === '') return 'Home';
  return context.title;
}

/** Soft framing prepended client-side when page context is available. */
export function withPageContext(query: string, context: PageContext | null): string {
  const trimmed = query.trim();
  if (!trimmed || !context) return trimmed;

  const path = context.pathname === '/' ? 'home' : context.pathname;
  return `[Visitor is viewing “${context.title}” (${path})] ${trimmed}`;
}
