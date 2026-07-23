import type { PageContext } from './types';

/**
 * Rewrite conversational questions into retrieval-friendly portfolio queries.
 * Critical: never stuff SYSTEM instructions or page chrome into the AutoRAG query —
 * that kills document retrieval (e.g. "What does he do well" → empty results).
 */
export function rewriteAskQuery(raw: string, ctx: PageContext) {
  let text = String(raw || '').trim();
  const lower = text.toLowerCase();

  // Resolve pronouns / second-person to Blake
  text = text
    .replace(/\b(he|him|his)\b/gi, 'Blake Oxford')
    .replace(/\b(you|your)\b/gi, 'Blake Oxford');

  const aboutPage = /\b(this page|this project|this post|here)\b/i.test(raw) && ctx?.title;
  const strengthAsk =
    /\b(do well|good at|strength|excel|best at|specialize|known for|stand out|great at)\b/i.test(
      lower
    );
  const whoAsk = /\b(who is|who are|about blake|tell me about)\b/i.test(lower);
  const skillAsk = /\b(skill|experien|tech|stack|proficien|expertise)\b/i.test(lower);
  const projectAsk = /\b(project|case study|portfolio|built|work)\b/i.test(lower);

  let complexity = 'simple';
  if (skillAsk || projectAsk || strengthAsk || whoAsk) complexity = 'medium';
  if (/\b(compare|versus|vs\.?|difference|how did|how does|analyze)\b/i.test(lower))
    complexity = 'complex';

  // Build a clean retrieval query AutoRAG can match against the index
  let retrievalQuery = text;
  if (strengthAsk || whoAsk) {
    retrievalQuery = `Blake Oxford strengths expertise skills projects outcomes achievements ${text}`;
  } else if (aboutPage) {
    retrievalQuery = `${ctx.title} ${text}`;
  } else if (
    !/\bblake\b/i.test(retrievalQuery) &&
    retrievalQuery.length < 48 &&
    !/^(hi|hello|hey|thanks|thank you|ok|okay)\b/i.test(retrievalQuery)
  ) {
    // Short questions without an explicit subject — bias toward Blake's portfolio
    retrievalQuery = `Blake Oxford ${retrievalQuery}`;
  }

  // Generation prompt stays conversational; page context is guidance only for page-specific asks
  let generationQuery = text;
  if (ctx?.title && (aboutPage || (!strengthAsk && !whoAsk))) {
    generationQuery = `${text}\n\nContext: the visitor is currently viewing “${ctx.title}”. If the question is about this page, prioritize it; if it is about Blake or the site in general, answer site-wide.`;
  }

  const shouldUseCache = !/\b(latest|recent|current|now|today)\b/i.test(lower);

  return {
    retrievalQuery: retrievalQuery.trim(),
    generationQuery,
    complexity,
    shouldUseCache,
  };
}

export function isConversationalProfileAsk(query: string): boolean {
  return /\b(do well|good at|strength|excel|best at|specialize|known for|stand out|great at|who is|who are|about blake|tell me about)\b/i.test(
    query
  );
}

export function normalizeForCache(q: string): string {
  return q
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim()
    .slice(0, 100);
}

export function isCacheEligibleQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return (
    !lower.includes('latest') &&
    !lower.includes('recent') &&
    !lower.includes('now') &&
    !lower.includes('today')
  );
}
