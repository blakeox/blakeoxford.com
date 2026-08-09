/**
 * MessageCTAs - Renders contextual call-to-actions and follow-up suggestions
 *
 * @component
 * @category Islands/Chat
 * @subcategory Engagement & Navigation
 *
 * @description
 * A collection of memoized React components that provide contextual CTAs and follow-up
 * suggestions based on AI chat responses and cited sources. Intelligently matches user
 * queries to relevant site actions (contact, projects, blog) and generates dynamic
 * follow-up questions.
 *
 * Exports three main components:
 * - MatchedCTA: Shows relevant CTA based on query context (hire me, explore projects, etc.)
 * - FollowUpSuggestions: Dynamic suggestions based on cited sources
 * - ContextualCTAs: Site-specific CTAs based on source collections
 *
 * @example Matched CTA (hiring query)
 * ```tsx
 * <MatchedCTA
 * message={chatMessage}
 * messages={conversationHistory}
 * sources={citedSources}
 * />
 * // Renders "Interested in hiring?" CTA if query mentions "hire", "work together", etc.
 * ```
 *
 * @example Follow-up suggestions
 * ```tsx
 * <FollowUpSuggestions
 * sources={citedSources}
 * setInputValue={(query) => setInput(query)}
 * sendQuery={(query) => submitQuery(query)}
 * />
 * // Generates suggestions like "Tell me more about the [Project] project"
 * ```
 *
 * @example Contextual CTAs
 * ```tsx
 * <ContextualCTAs
 * sources={citedSources}
 * siteHostname="blakeoxford.com"
 * messagesCount={conversationLength}
 * />
 * // Shows "Contact Blake" after 5+ messages or "Explore more projects" if project sources cited
 * ```
 *
 * @accessibility
 * - CTA buttons have focus-visible indicators
 * - Keyboard navigation fully supported
 * - Icon SVGs use aria-hidden with descriptive button text
 * - Suggestion chips have clear labels and actions
 *
 * @performance
 * - All components wrapped in React.memo
 * - CTA matching runs once per message
 * - Dynamic suggestions generated on-demand
 * - Analytics events tracked efficiently
 *
 * @analytics
 * - Tracks CTA clicks with type, label, and source context
 * - Follow-up suggestion interactions logged
 * - Contextual CTA engagement measured
 */
import { memo } from 'react';
import { autoragEvents } from '@/lib/analytics';
import { CONTEXTUAL_CTAS, generateContextualCTAs } from '@/lib/chat';
import type { ChatMessage, Source } from '@/features/chat/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchedCTAProps {
  message: ChatMessage;
  messages: ChatMessage[];
  sources: Source[];
  compact?: boolean;
}

interface FollowUpSuggestionsProps {
  sources: Source[];
  setInputValue: (value: string) => void;
  sendQuery: (query: string) => void;
  maxSuggestions?: number;
}

interface ContextualCTAsProps {
  sources: Source[];
  siteHostname: string;
  messagesCount: number;
}

// ─── Matched CTA Component ────────────────────────────────────────────────────

export const MatchedCTA = memo(function MatchedCTA({
  message,
  messages,
  sources,
  compact = false,
}: MatchedCTAProps) {
  const messageIndex = messages.findIndex((m) => m.id === message.id);
  const userQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content || '' : '';
  // Prefer hire/contact intents; skip newsletter-style noise in compact mode.
  const matchedCTA = CONTEXTUAL_CTAS.find((cta) => {
    if (!cta.condition(userQuery, sources)) return false;
    if (compact && cta.ctaLink.includes('newsletter')) return false;
    return true;
  });

  if (!matchedCTA) return null;

  if (compact) {
    return (
      <a
        href={matchedCTA.ctaLink}
        className="focus-ring-interactive inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-subtle px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/15"
        onClick={() => {
          autoragEvents.ctaClick({
            type: 'quality-suggestion',
          });
        }}
      >
        {matchedCTA.ctaText}
        <svg
          className="size-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
        </svg>
      </a>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-accent/25 bg-accent-subtle p-3">
      <p className="mb-2 text-sm text-muted-foreground">{matchedCTA.message}</p>
      <a
        href={matchedCTA.ctaLink}
        className="focus-ring-interactive inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-dark"
        onClick={() => {
          autoragEvents.ctaClick({
            type: 'quality-suggestion',
          });
        }}
      >
        {matchedCTA.ctaText}
      </a>
    </div>
  );
});

// ─── Follow-Up Suggestions Component ──────────────────────────────────────────

export const FollowUpSuggestions = memo(function FollowUpSuggestions({
  sources,
  setInputValue,
  sendQuery,
  maxSuggestions = 2,
}: FollowUpSuggestionsProps) {
  const suggestions: Array<{ label: string; query: string }> = [];
  const collections = [...new Set(sources.map((s) => s.collection).filter(Boolean))] as string[];

  if (collections.includes('projects')) {
    const projectSources = sources.filter((s) => s.collection === 'projects');
    if (projectSources.length > 0) {
      suggestions.push({
        label: 'More on this project',
        query: `Tell me more about the ${projectSources[0].title} project`,
      });
    }
  }

  if (collections.includes('blog') && suggestions.length < maxSuggestions) {
    const blogSources = sources.filter((s) => s.collection === 'blog');
    if (blogSources.length > 0) {
      suggestions.push({
        label: 'Related writing',
        query: `What else has Blake written about topics in "${blogSources[0].title}"?`,
      });
    }
  }

  if (sources[0]?.title && !suggestions.some((s) => s.query.includes(sources[0].title))) {
    suggestions.push({
      label: 'Go deeper',
      query: `Can you explain "${sources[0].title}" in more detail?`,
    });
  }

  const limitedSuggestions = suggestions.slice(0, maxSuggestions);
  if (limitedSuggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {limitedSuggestions.map((suggestion) => (
        <button
          key={suggestion.label}
          type="button"
          onClick={() => {
            setInputValue(suggestion.query);
            setTimeout(() => sendQuery(suggestion.query), 100);
            autoragEvents.suggestedQuery({ query: suggestion.query });
          }}
          className="focus-ring-interactive rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-accent hover:text-accent"
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
});

// ─── Contextual CTAs Component ────────────────────────────────────────────────

export const ContextualCTAs = memo(function ContextualCTAs({
  sources,
  siteHostname,
  messagesCount,
}: ContextualCTAsProps) {
  const ctas = generateContextualCTAs(sources, siteHostname, messagesCount);
  if (ctas.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">Take action</p>
      <div className="flex flex-col gap-2">
        {ctas.map((cta, index) => (
          <a
            key={index}
            href={cta.url}
            target={cta.url.startsWith('http') ? '_blank' : undefined}
            rel={cta.url.startsWith('http') ? 'noreferrer' : undefined}
            onClick={() => {
              autoragEvents.ctaClick({
                type: cta.type,
              });
            }}
            className="group inline-flex items-center gap-2.5 rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 px-4 py-3 text-sm font-medium text-accent-emphasis shadow-sm transition-all duration-normal hover:border-accent/50 hover:bg-accent/15 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
          >
            <span className="text-lg" aria-hidden="true">
              {cta.icon}
            </span>
            <span className="flex-1">{cta.label}</span>
            <svg
              className="size-4 transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
});
